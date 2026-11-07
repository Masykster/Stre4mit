import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_SOURCE, VIDEO_SOURCES, getEmbedUrl } from '../lib/videoSources';
import { readPreferredSource, savePreferredSource } from '../lib/serverPreference';

// A cross-origin iframe gives us no error event when its host is dead, blocked
// by DNS/adblock, or simply never answers — `load` never fires. A timeout is
// therefore the only signal available: cancel it in onLoad, otherwise the
// server is treated as failed and the next one takes over.
const LOAD_TIMEOUT_MS = 12000;

const BLOCK_REASON_TEXT = {
  timeout: 'gagal dimuat',
  'x-frame-options': 'menolak embed (X-Frame-Options)',
  csp: 'menolak embed (CSP frame-ancestors)',
};

const sourceLabel = (value) =>
  VIDEO_SOURCES.find((source) => source.value === value)?.label || value;

// Starts at the current server, then wraps around the list, so a server the
// user picked manually is not immediately retried by the fallback chain.
function fallbackOrder(start) {
  const index = VIDEO_SOURCES.findIndex((source) => source.value === start);
  const ordered = index === -1
    ? VIDEO_SOURCES
    : [...VIDEO_SOURCES.slice(index), ...VIDEO_SOURCES.slice(0, index)];
  return ordered.map((source) => source.value);
}

export default function useEmbedFallback({ type, id, season, episode, initialSource = DEFAULT_SOURCE, enabled = true }) {
  const [source, setSource] = useState(initialSource);
  const [notice, setNotice] = useState(null);
  const [exhausted, setExhausted] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const failedRef = useRef(new Set());
  const loadedRef = useRef(new Set());
  const timerRef = useRef(null);

  // Identity of the title/episode. Stored alongside notice/exhausted so those
  // do not leak into the next episode when the component instance is reused.
  const identity = `${type}-${id}-${season ?? ''}-${episode ?? ''}`;
  const embedUrl = getEmbedUrl(source, type, id, season, episode);
  const iframeKey = `${identity}-${source}-${reloadToken}`;

  // Restore the server the user ended on last time. Deferred to the next
  // animation frame so the markup from hydration matches the server render and
  // the synchronous effect body never triggers a cascading render.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const preferred = readPreferredSource();
      if (preferred) setSource(preferred);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // A cached iframe can fire `load` before this effect runs, so check the
    // record instead of arming a watchdog that would switch away from it.
    if (!enabled || loadedRef.current.has(iframeKey)) return undefined;

    let cancelled = false;
    let settled = false;
    const controller = new AbortController();

    const switchAway = (reason) => {
      // Header probe and timeout can resolve in either order; only the first
      // one may advance the chain, otherwise a server gets skipped.
      if (settled) return;
      settled = true;

      failedRef.current.add(source);
      const next = fallbackOrder(initialSource).find((value) => !failedRef.current.has(value));

      if (!next) {
        setExhausted({ identity });
        setNotice(null);
        return;
      }

      // Fallback is also persisted: otherwise the next visit starts on the
      // same dead server again.
      savePreferredSource(next);
      setNotice({ identity, from: source, to: next, reason });
      setSource(next);
    };

    // Header probe: catches X-Frame-Options / frame-ancestors denial, which the
    // browser reports as a normal `load` of an error page and the watchdog
    // therefore cannot see.
    const params = new URLSearchParams({ source, type, id: String(id) });
    if (type === 'tv') {
      params.set('season', String(season));
      params.set('episode', String(episode));
    }

    fetch(`/api/embed-check?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (!cancelled && result?.blocked) switchAway(result.reason);
      })
      .catch(() => {}); // aborted on unmount/source change

    timerRef.current = setTimeout(() => {
      if (!cancelled) switchAway('timeout');
    }, LOAD_TIMEOUT_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [iframeKey, enabled, source, identity, initialSource, type, id, season, episode]);

  const handleFrameLoad = useCallback(() => {
    loadedRef.current.add(iframeKey);
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, [iframeKey]);

  const selectSource = useCallback((value) => {
    // Picking a server by hand is an explicit retry, so forget past failures.
    failedRef.current.delete(value);
    savePreferredSource(value);
    setNotice(null);
    setExhausted(null);
    setSource(value);
  }, []);

  const retry = useCallback(() => {
    failedRef.current.clear();
    setNotice(null);
    setExhausted(null);
    setReloadToken((token) => token + 1);
  }, []);

  return {
    source,
    embedUrl,
    iframeKey,
    notice: notice && notice.identity === identity
      ? `${sourceLabel(notice.from)} ${BLOCK_REASON_TEXT[notice.reason] || BLOCK_REASON_TEXT.timeout} — beralih otomatis ke ${sourceLabel(notice.to)}.`
      : null,
    exhausted: Boolean(exhausted && exhausted.identity === identity),
    selectSource,
    handleFrameLoad,
    retry,
  };
}
