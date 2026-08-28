/** Small deterministic PRNG (mulberry32) so a seed reproduces a layout. */
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

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Parse a comma/space separated list of integers. Returns null when invalid. */
export function parseIntList(text: string): number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const out: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return null;
    out.push(parseInt(p, 10));
  }
  return out;
}
