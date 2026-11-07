import { VIDEO_SOURCES } from './videoSources';

const STORAGE_KEY = 'stre4mit_player_source';

// Stored values from an older build can point at a server that no longer
// exists in the list, so only accept values we still know about.
const isKnownSource = (value) => VIDEO_SOURCES.some((source) => source.value === value);

export function readPreferredSource() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isKnownSource(stored) ? stored : null;
}

export function savePreferredSource(value) {
  if (typeof window === 'undefined' || !isKnownSource(value)) return;
  window.localStorage.setItem(STORAGE_KEY, value);
}
