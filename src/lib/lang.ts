/**
 * A simplified port of Laya's routing detection (laya/lang.py `analyse`, laya/router.py `_route`).
 *
 * Kept exactly: script counting over the same Unicode ranges (with unlisted scripts counted as
 * "other"), the non-Latin-fraction override, the function-word scoring with its margins and the
 * "evidenced language" rule, the diacritic rate, and the routing precedence and reason texts.
 *
 * Left out: the line-by-line and field-by-field scan for a foreign segment inside mostly-English
 * text, identifier and code-line filtering, and the English "rescue" for loanwords. The real
 * detector is therefore more careful than this one on mixed and structured inputs.
 */
import { NON_EN_DIACRITICS, SCRIPT_RANGES, STOPWORDS } from "../data/langData";

export const NON_EN_DIACRITIC_RATE = 0.02;
export const NON_LATIN_FRACTION = 0.2;
export const NON_LATIN_MIN_FRACTION = 0.1;
export const NON_LATIN_MIN_LETTERS = 10;

const DIACRITICS = new Set([...NON_EN_DIACRITICS]);
const SHARED = (() => {
  const count = new Map<string, number>();
  for (const words of Object.values(STOPWORDS)) for (const w of words) count.set(w, (count.get(w) ?? 0) + 1);
  return new Set([...count].filter(([, n]) => n > 1).map(([w]) => w));
})();
const STOPSETS = Object.fromEntries(Object.entries(STOPWORDS).map(([k, v]) => [k, new Set(v)]));

const isLetter = (ch: string) => /\p{L}/u.test(ch);

export function scriptCounts(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  let latin = 0;
  for (const ch of text) {
    if (!isLetter(ch)) continue;
    const cp = ch.codePointAt(0)!;
    if (cp < 0x02b0 || (cp >= 0x1e00 && cp <= 0x1eff) || (cp >= 0xff21 && cp <= 0xff3a) || (cp >= 0xff41 && cp <= 0xff5a)) {
      latin++;
      continue;
    }
    const hit = SCRIPT_RANGES.find(([, ranges]) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi));
    const name = hit ? hit[0] : "other";
    counts[name] = (counts[name] ?? 0) + 1;
  }
  counts.latin = latin; // last, so a named script wins a tie against Latin
  return counts;
}

function dominant(counts: Record<string, number>): string {
  let best = "unknown";
  let bestN = 0;
  for (const [name, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = name;
      bestN = n;
    }
  }
  return best;
}

export interface LatinProfile {
  language: string | null;
  englishHits: number;
  diacriticRate: number;
  looksNonEnglish: boolean;
  scores: Record<string, number>;
}

export function latinProfile(text: string): LatinProfile {
  const cleaned = text.replace(/(?<![\w-])[\w-]*(?:[.@][\w-]+)+/gu, " ");
  const words = (cleaned.toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? []).map((w) => w.normalize("NFC"));
  const lowered = text.toLowerCase();
  let diac = 0;
  for (const ch of lowered) if (DIACRITICS.has(ch)) diac++;
  const diacriticRate = diac / Math.max(1, [...lowered].length);
  const looksNonEnglish = diacriticRate >= NON_EN_DIACRITIC_RATE;
  const scores: Record<string, number> = {};
  if (words.length < 4) return { language: null, englishHits: 0, diacriticRate, looksNonEnglish, scores };

  for (const [lg, set] of Object.entries(STOPSETS)) scores[lg] = words.filter((w) => set.has(w)).length;
  const en = scores.en ?? 0;
  const unique = new Set(words);
  let bestLg: string | null = null;
  let best = 0;
  for (const [lg, s] of Object.entries(scores)) {
    if (lg === "en") continue;
    const evidenced = [...unique].some((w) => STOPSETS[lg].has(w) && !SHARED.has(w));
    if (evidenced && s > best) {
      best = s;
      bestLg = lg;
    }
  }
  let language: string | null = null;
  if (bestLg && best >= Math.max(2, en + 2)) language = bestLg;
  else if (bestLg && looksNonEnglish && best >= Math.max(2, en)) language = bestLg;
  else if (en && !looksNonEnglish) language = "en";
  return { language, englishHits: en, diacriticRate, looksNonEnglish, scores };
}

export interface Detection {
  script: string;
  profile: Record<string, number>;
  nonLatinFraction: number;
  language: string | null;
  isEnglish: boolean;
  undecided: boolean;
  diacriticRate: number;
}

export function analyse(text: string): Detection {
  const counts = scriptCounts(text);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const profile = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0).map(([k, n]) => [k, n / Math.max(1, total)]));
  let script = total ? dominant(counts) : "unknown";
  const nonLatin = total ? 1 - (profile.latin ?? 0) : 0;
  const nNonLatin = Math.round(nonLatin * total);
  if (script === "latin" && (nonLatin >= NON_LATIN_FRACTION || (nonLatin >= NON_LATIN_MIN_FRACTION && nNonLatin >= NON_LATIN_MIN_LETTERS))) {
    script = Object.entries(profile)
      .filter(([s]) => s !== "latin")
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  if (script === "unknown") {
    return { script, profile, nonLatinFraction: 0, language: null, isEnglish: true, undecided: true, diacriticRate: 0 };
  }
  if (script !== "latin") {
    return { script, profile, nonLatinFraction: nonLatin, language: null, isEnglish: false, undecided: true, diacriticRate: 0 };
  }
  const lp = latinProfile(text);
  const undecided = lp.language === null;
  return {
    script,
    profile,
    nonLatinFraction: nonLatin,
    language: lp.language,
    isEnglish: lp.language === "en" || (undecided && !lp.looksNonEnglish),
    undecided,
    diacriticRate: lp.diacriticRate,
  };
}

export type Checkpoint = "english" | "multilingual" | "typed-decisions";

export interface RouteOptions {
  model?: Checkpoint;
  lang?: string;
  defaultModel?: "english" | "multilingual";
}

export interface RouteDecision {
  model: Checkpoint;
  reason: string;
  detection: Detection | null;
  step: "model" | "lang" | "detection";
}

/** English or not, from a language code, as `_english_from_code` reads it (null = abstain). */
export function englishFromCode(code: string): boolean | null {
  const c = code.trim();
  if (!c) return null;
  const primary = c.split(/[-_.@]/)[0].toLowerCase();
  if (["c", "posix", "und", "zxx", "mul"].includes(primary)) return null;
  return ["en", "eng", "english"].includes(primary);
}

/** The routing decision, in `_route`'s precedence: explicit model > explicit lang > detection > default. */
export function route(text: string, opts: RouteOptions = {}): RouteDecision {
  const def = opts.defaultModel ?? "english";
  if (opts.model) return { model: opts.model, reason: `explicit model='${opts.model}'`, detection: null, step: "model" };
  if (opts.lang !== undefined) {
    const en = englishFromCode(opts.lang);
    if (en !== null) {
      return { model: en ? "english" : "multilingual", reason: `explicit lang='${opts.lang}'`, detection: null, step: "lang" };
    }
  }
  const det = analyse(text);
  const pct = (x: number) => `${Math.round(100 * x)}%`;
  let model: Checkpoint;
  let reason: string;
  if (det.script === "unknown") {
    model = def;
    reason = `no letters detected in state; using default (${def})`;
  } else if (det.script !== "latin") {
    model = "multilingual";
    reason = `non-Latin script (${det.script}, ${pct(det.nonLatinFraction)} of letters); the English checkpoint cannot read it`;
  } else if (!det.isEnglish) {
    model = "multilingual";
    reason = det.language
      ? `Latin script but language looks like '${det.language}', not English`
      : `Latin script, language not identified but ${pct(det.diacriticRate)} non-English letters; not safe for the English checkpoint`;
  } else if (det.undecided) {
    model = def;
    reason = `Latin script, language not identified and no non-English letters; using default (${def})`;
  } else {
    model = "english";
    reason = "English Latin text";
  }
  return { model, reason, detection: det, step: "detection" };
}
