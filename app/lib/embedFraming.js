// Framing rules that decide whether a browser may render an embed inside our
// page. Kept free of Next.js imports so the route handler can use it and it can
// be exercised in isolation.
const FRAME_ANCESTORS = /frame-ancestors([^;]*)/i;

function tokenAllows(token, origin) {
  const value = token.replace(/^'|'$/g, '');

  if (value === '*') return true;
  if (value === 'self' || value === 'none') return false; // the provider itself, not us

  let ourUrl;
  try {
    ourUrl = new URL(origin);
  } catch {
    return true; // no usable origin: never claim a block
  }

  // Scheme source, e.g. `https:`
  if (/^[a-z][a-z0-9+.-]*:$/i.test(value)) {
    return ourUrl.protocol === value.toLowerCase();
  }

  // Wildcard host, e.g. `https://*.example.com`
  const wildcard = value.match(/^([a-z][a-z0-9+.-]*):\/\/\*\.([^/]+)$/i);
  if (wildcard) {
    return (
      ourUrl.protocol === `${wildcard[1].toLowerCase()}:` &&
      (ourUrl.hostname === wildcard[2] || ourUrl.hostname.endsWith(`.${wildcard[2]}`))
    );
  }

  try {
    return new URL(value).origin === ourUrl.origin;
  } catch {
    return false;
  }
}

function cspAllowsFraming(csp, origin) {
  // Each comma-separated policy applies on its own; the most restrictive wins.
  for (const policy of csp.split(',')) {
    const match = policy.match(FRAME_ANCESTORS);
    if (!match) continue;

    const tokens = match[1].trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    if (!tokens.some((token) => tokenAllows(token, origin))) return false;
  }
  return true;
}

/**
 * Returns the header that forbids framing by `origin`, or null when the page
 * may be embedded. `frame-ancestors` takes precedence over X-Frame-Options,
 * matching what browsers do.
 */
export function framingBlockReason({ xFrameOptions, contentSecurityPolicy, origin }) {
  if (contentSecurityPolicy && FRAME_ANCESTORS.test(contentSecurityPolicy)) {
    return cspAllowsFraming(contentSecurityPolicy, origin) ? null : 'csp';
  }

  if (!xFrameOptions) return null;

  const value = xFrameOptions.trim().toLowerCase();
  // ALLOW-FROM is ignored by modern browsers, so it never blocks on its own.
  if (value === 'deny' || value === 'sameorigin') return 'x-frame-options';
  return null;
}
