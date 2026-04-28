// Seedable 32-bit PRNG (mulberry32). Deterministic when a seed is supplied.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = Math.random;

export function pickWeighted<T>(
  entries: { value: T; weight: number }[],
  rng: () => number = rand,
): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}

export function randRange(min: number, max: number, rng: () => number = rand): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
