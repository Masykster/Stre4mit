import { NextResponse } from 'next/server';
import { getEmbedUrl, VIDEO_SOURCES } from '../../lib/videoSources';
import { framingBlockReason } from '../../lib/embedFraming';

const CHECK_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const INCONCLUSIVE_TTL_MS = 2 * 60 * 1000;

// Framing headers belong to the provider, not to a movie, so one probe answers
// every title on that host. The key also includes our own origin because
// `frame-ancestors` is evaluated against it.
const cache = new Map();

async function probeFraming({ embedUrl, origin }) {
  try {
    const response = await fetch(embedUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    // Only trust a page that actually served content. A challenge or error page
    // (Cloudflare 403, etc.) says nothing about how the player frames itself.
    if (!response.ok) {
      return { blocked: false, reason: null, status: response.status };
    }

    const reason = framingBlockReason({
      xFrameOptions: response.headers.get('x-frame-options'),
      contentSecurityPolicy: response.headers.get('content-security-policy'),
      origin,
    });

    return { blocked: Boolean(reason), reason, status: response.status };
  } catch {
    // Unreachable from our server is not proof of blocking (geo rules, TLS
    // quirks), so the client watchdog stays in charge of that case.
    return { blocked: false, reason: null, status: 0 };
  }
}

/**
 * Probes an embed URL's response headers so the client can skip servers that
 * refuse to be framed. The URL is built from the source registry instead of
 * accepting a raw URL, so this cannot be used to fetch arbitrary hosts.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const source = searchParams.get('source');
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const id = searchParams.get('id');

  if (!id || !VIDEO_SOURCES.some((entry) => entry.value === source)) {
    return NextResponse.json({ error: 'Sumber atau id tidak valid' }, { status: 400 });
  }

  const cacheKey = `${source}|${origin}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.payload, cached: true });
  }

  const season = Number(searchParams.get('season')) || 1;
  const episode = Number(searchParams.get('episode')) || 1;
  const payload = await probeFraming({
    embedUrl: getEmbedUrl(source, type, id, season, episode),
    origin,
  });

  cache.set(cacheKey, {
    payload,
    // Inconclusive answers (403 challenge, timeout) may change soon; a page
    // that really served content rarely changes its framing policy.
    expiresAt: Date.now() + (payload.status === 200 ? CACHE_TTL_MS : INCONCLUSIVE_TTL_MS),
  });

  return NextResponse.json(payload);
}
