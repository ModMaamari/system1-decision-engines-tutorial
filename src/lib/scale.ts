/** Minimal linear scale and "nice" tick generation for the SVG charts. */

export interface LinearScale {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
  invert: (px: number) => number;
}

export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const f = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as LinearScale;
  f.domain = domain;
  f.range = range;
  f.invert = (px: number) => d0 + ((px - r0) / (r1 - r0 || 1)) * span;
  return f;
}

/** A step of 1, 2 or 5 times a power of ten that gives about `count` ticks. */
export function niceStep(span: number, count: number): number {
  if (!(span > 0) || count < 1) return 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  const mult = unit >= 5 ? 5 : unit >= 2 ? 2 : 1;
  // Round up to the next multiple when the raw step is just over a boundary.
  return (unit > mult * (1 + 1e-9) ? (mult === 1 ? 2 : mult === 2 ? 5 : 10) : mult) * pow;
}

/** Ticks covering [min, max] on nice round values, inclusive where they fall on the ends. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const step = niceStep(max - min, count);
  const start = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(12)));
  }
  return ticks;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
