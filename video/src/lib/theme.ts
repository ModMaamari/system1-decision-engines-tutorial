/**
 * Visual language, borrowed from the tutorial's dark theme (src/styles/tokens.css):
 * teal is System 1 (one pass), rose is System 2 (token by token), and blue, amber and violet
 * are the three decision primitives: choice, score and noul.
 */
export const C = {
  bg: '#060a14',
  bgTop: '#070c18',
  bgBottom: '#0a1224',
  surface: '#0f1729',
  surface2: '#162036',
  surface3: '#1f2a40',
  border: '#26324b',
  borderStrong: '#36456a',
  text: '#eef1f6',
  text2: '#aab4c6',
  text3: '#7d889d',
  s1: '#2dd4bf',
  s1Strong: '#5eead4',
  s1Deep: '#0d9488',
  s2: '#fb7185',
  s2Deep: '#e11d48',
  choice: '#60a5fa',
  score: '#fbbf24',
  noul: '#a78bfa',
  good: '#4ade80',
  bad: '#f87171',
  warn: '#fbbf24',
} as const;

export const FONT = 'Inter Variable';
export const MONO = 'JetBrains Mono Variable';
export const DEVANAGARI = 'Noto Sans Devanagari';
export const ARABIC = 'Noto Sans Arabic';
export const KHMER = 'Noto Sans Khmer';

export const W = 1920;
export const H = 1080;

/** `#rrggbb` + alpha -> `rgba()` */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
