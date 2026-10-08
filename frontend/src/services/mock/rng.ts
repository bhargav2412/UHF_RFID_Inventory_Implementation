/**
 * Deterministic pseudo-random helpers used to generate realistic mock data.
 * A fixed seed keeps the demo data stable between reloads.
 */
let seed = 20261007;

export const resetSeed = (value = 20261007) => {
  seed = value;
};

export const rand = (): number => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

export const float = (min: number, max: number, digits = 1) =>
  Number((rand() * (max - min) + min).toFixed(digits));

export const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];

export const weighted = <T>(list: readonly [T, number][]): T => {
  const total = list.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [value, w] of list) {
    if ((r -= w) <= 0) return value;
  }
  return list[list.length - 1][0];
};

export const hex = (length: number) =>
  Array.from({ length }, () => Math.floor(rand() * 16).toString(16)).join('').toUpperCase();

export const pad = (n: number, size = 4) => String(n).padStart(size, '0');

const NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO timestamp `minutes` ago from now. */
export const minutesAgo = (minutes: number) => new Date(NOW - minutes * MINUTE).toISOString();
export const hoursAgo = (hours: number) => new Date(NOW - hours * HOUR).toISOString();
export const daysAgo = (days: number) => new Date(NOW - days * DAY).toISOString();
export const daysFromNow = (days: number) => new Date(NOW + days * DAY).toISOString();

export const lastNDays = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(NOW - (n - 1 - i) * DAY);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  });

export const lastNMonths = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(NOW);
    d.setMonth(d.getMonth() - (n - 1 - i));
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  });
