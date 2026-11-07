import anyAscii from 'any-ascii';

// Detects any character outside Latin script, shared numbers/punctuation/symbols, and combining marks.
// Covers Japanese (Hiragana/Katakana/Kanji), Chinese (Hanzi), Korean (Hangul), Thai,
// Indic scripts (Devanagari/Hindi, Bengali, Tamil, Telugu, etc.), Arabic/Urdu, Cyrillic, Greek, etc.
const NON_LATIN_SCRIPT_RE = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;

// Fullwidth CJK punctuation that sometimes appears even around mixed-script titles
const FULLWIDTH_PUNCT_RE = /[\u3000-\u303F\uFF01-\uFF60]/;

export function hasNonLatinScript(str) {
  if (!str || typeof str !== 'string') return false;
  return NON_LATIN_SCRIPT_RE.test(str) || FULLWIDTH_PUNCT_RE.test(str);
}

function normalizeEastAsianPunctuation(input) {
  return input
    .replace(/\u3000/g, ' ')
    .replace(/：/g, ': ')
    .replace(/[，、]/g, ', ')
    .replace(/。/g, '. ')
    .replace(/！/g, '! ')
    .replace(/？/g, '? ')
    .replace(/；/g, '; ')
    .replace(/（/g, ' (')
    .replace(/）/g, ') ')
    .replace(/[【［《〈]/g, ' [')
    .replace(/[】］》〉]/g, '] ')
    .replace(/[「『]/g, ' "')
    .replace(/[」』]/g, '" ')
    .replace(/[·・]/g, ' · ')
    .replace(/[～〜]/g, ' ~ ')
    .replace(/＝/g, ' = ');
}

function capitalizeWord(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Converts any non-Latin script string into clean, human-readable Romanized Latin text.
 * Leaves already-Latin strings untouched.
 */
export function romanizeText(str, { titleCase = true } = {}) {
  if (!str || typeof str !== 'string') return str;
  if (!hasNonLatinScript(str)) return str;

  let text = normalizeEastAsianPunctuation(str);

  // 1. Mandarin / CJK Hanzi runs: space-separate syllables so Pinyin is easy to read
  text = text.replace(/\p{Script=Han}+/gu, (match) => {
    const syllables = Array.from(match)
      .map((ch) => anyAscii(ch).trim())
      .filter(Boolean)
      .map((syl) => (titleCase ? capitalizeWord(syl.toLowerCase()) : syl.toLowerCase()));
    return ` ${syllables.join(' ')} `;
  });

  // 2. Korean Hangul runs: group contiguous Hangul blocks into natural Revised Romanization words
  text = text.replace(/\p{Script=Hangul}+/gu, (match) => {
    const raw = anyAscii(match).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!raw) return ' ';
    return ` ${titleCase ? capitalizeWord(raw) : raw} `;
  });

  // 3. Japanese Hiragana & Katakana runs (including prolonged sound mark ー)
  text = text.replace(/[\p{Script=Hiragana}\p{Script=Katakana}\u30FC]+/gu, (match) => {
    const cleanedMatch = match.replace(/\u30FC/g, '');
    const raw = anyAscii(cleanedMatch).trim().toLowerCase();
    if (!raw) return ' ';
    return ` ${titleCase ? capitalizeWord(raw) : raw} `;
  });

  // 4. Transliterate any remaining non-ASCII scripts (Thai, Hindi, Bengali, Tamil, Arabic, Cyrillic, etc.)
  text = text.replace(/[^\x00-\x7F·]+/g, (match) => {
    const transliterated = anyAscii(match).trim();
    return transliterated ? ` ${transliterated} ` : ' ';
  });

  // Separate stuck letter-to-number boundaries from Kana/CJK titles (e.g. "Mobusaiko100" -> "Mobusaiko 100")
  text = text.replace(/([a-zA-Z])(\d)/g, '$1 $2');

  // Clean up spacing around punctuation
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([:,.;!?)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/([:,;])\s*/g, '$1 ')
    .replace(/\s*·\s*/g, ' · ')
    .trim();

  if (titleCase) {
    text = text
      .split(' ')
      .map((token) => {
        if (!token) return token;
        // Preserve tokens that already intentionally contain uppercase acronyms (e.g. "TV", "II")
        if (/^[A-Z0-9]{2,}$/.test(token)) return token;
        return token.replace(/^([^a-zA-Z]*)([a-zA-Z])/, (_, prefix, firstChar) => `${prefix}${firstChar.toUpperCase()}`);
      })
      .join(' ');
  } else if (text.length > 0) {
    // Sentence case for long synopses
    text = text.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (m) => m.toUpperCase());
  }

  return text;
}

/**
 * Picks the best readable Latin title:
 * 1. `primary` (e.g. id-ID or en-US) if non-empty and already Latin
 * 2. `englishFallback` (en-US) if non-empty and already Latin
 * 3. Romanized version of `englishFallback || primary || originalFallback`
 */
export function resolveReadableTitle(primary, englishFallback, originalFallback) {
  if (primary && !hasNonLatinScript(primary)) return primary;
  if (englishFallback && !hasNonLatinScript(englishFallback)) return englishFallback;
  const candidate = englishFallback || primary || originalFallback || '';
  return romanizeText(candidate, { titleCase: true });
}

/**
 * Picks the best readable overview/synopsis:
 * 1. `idOverview` (Indonesian) if non-empty and Latin
 * 2. `enOverview` (English) if non-empty and Latin
 * 3. Romanized version of whichever non-empty overview exists
 */
export function resolveReadableOverview(idOverview, enOverview) {
  if (idOverview && !hasNonLatinScript(idOverview)) return idOverview;
  if (enOverview && !hasNonLatinScript(enOverview)) return enOverview;
  const candidate = enOverview || idOverview || '';
  return candidate ? romanizeText(candidate, { titleCase: false }) : '';
}

/**
 * Recursively normalizes titles, names, episode titles, cast/crew names, and overviews
 * inside any TMDb API response object so no unreadable non-Latin scripts reach the UI.
 */
export function normalizeMediaItem(item) {
  if (!item || typeof item !== 'object') return item;

  const normalized = { ...item };

  if (typeof normalized.title === 'string') {
    normalized.title = romanizeText(normalized.title, { titleCase: true });
  }
  if (typeof normalized.name === 'string') {
    normalized.name = romanizeText(normalized.name, { titleCase: true });
  }
  if (typeof normalized.overview === 'string' && hasNonLatinScript(normalized.overview)) {
    normalized.overview = romanizeText(normalized.overview, { titleCase: false });
  }
  if (typeof normalized.tagline === 'string' && hasNonLatinScript(normalized.tagline)) {
    normalized.tagline = romanizeText(normalized.tagline, { titleCase: false });
  }
  if (typeof normalized.character === 'string' && hasNonLatinScript(normalized.character)) {
    normalized.character = romanizeText(normalized.character, { titleCase: true });
  }
  if (typeof normalized.biography === 'string' && hasNonLatinScript(normalized.biography)) {
    normalized.biography = romanizeText(normalized.biography, { titleCase: false });
  }

  if (Array.isArray(normalized.seasons)) {
    normalized.seasons = normalized.seasons.map((s) => normalizeMediaItem(s));
  }
  if (Array.isArray(normalized.episodes)) {
    normalized.episodes = normalized.episodes.map((ep) => normalizeMediaItem(ep));
  }
  if (Array.isArray(normalized.created_by)) {
    normalized.created_by = normalized.created_by.map((c) => normalizeMediaItem(c));
  }
  if (normalized.credits && typeof normalized.credits === 'object') {
    normalized.credits = {
      ...normalized.credits,
      cast: Array.isArray(normalized.credits.cast)
        ? normalized.credits.cast.map((c) => normalizeMediaItem(c))
        : normalized.credits.cast,
      crew: Array.isArray(normalized.credits.crew)
        ? normalized.credits.crew.map((c) => normalizeMediaItem(c))
        : normalized.credits.crew,
    };
  }
  if (normalized.combined_credits && typeof normalized.combined_credits === 'object') {
    normalized.combined_credits = {
      ...normalized.combined_credits,
      cast: Array.isArray(normalized.combined_credits.cast)
        ? normalized.combined_credits.cast.map((c) => normalizeMediaItem(c))
        : normalized.combined_credits.cast,
      crew: Array.isArray(normalized.combined_credits.crew)
        ? normalized.combined_credits.crew.map((c) => normalizeMediaItem(c))
        : normalized.combined_credits.crew,
    };
  }
  if (normalized.recommendations && Array.isArray(normalized.recommendations.results)) {
    normalized.recommendations = {
      ...normalized.recommendations,
      results: normalized.recommendations.results.map((r) => normalizeMediaItem(r)),
    };
  }

  return normalized;
}

export function normalizeTMDbPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeMediaItem(item));
  }

  const normalized = normalizeMediaItem(payload);
  if (Array.isArray(normalized.results)) {
    normalized.results = normalized.results.map((item) => normalizeMediaItem(item));
  }
  return normalized;
}
