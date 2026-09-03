import type { SortingAlgorithm } from './types';
import { mulberry32 } from '../../engine/random';

/**
 * Empirical growth measurement: run a sorting generator to completion on
 * inputs of increasing size and count the operations it performs. No frames
 * are recorded — this is the cheap counterpart of buildSortFrames used by the
 * Growth Analysis view.
 */

export const GROWTH_SIZES = [8, 16, 32, 64, 96, 128, 192, 256, 384, 512];

export type Distribution = 'random' | 'sorted' | 'reversed' | 'few-unique';

export const DISTRIBUTIONS: { id: Distribution; label: string }[] = [
  { id: 'random', label: 'Random' },
  { id: 'sorted', label: 'Already sorted' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'few-unique', label: 'Few unique values' },
];

/** Values scale with n so counting/radix/bucket keep their k ∝ n behaviour. */
export function makeInput(n: number, dist: Distribution, seed: number): number[] {
  const rnd = mulberry32(seed);
  switch (dist) {
    case 'random': return Array.from({ length: n }, () => 1 + Math.floor(rnd() * 2 * n));
    case 'sorted': return Array.from({ length: n }, (_, i) => i + 1);
    case 'reversed': return Array.from({ length: n }, (_, i) => n - i);
    case 'few-unique': return Array.from({ length: n }, () => (1 + Math.floor(rnd() * 8)) * 10);
  }
}

export interface OpCounts { comparisons: number; swaps: number; writes: number; total: number }

/** Run the generator to completion counting operations (no frames). */
export function countOps(algo: SortingAlgorithm, values: number[]): OpCounts {
  const a = values.slice();
  let comparisons = 0, swaps = 0, writes = 0;
  for (const action of algo.run(a)) {
    if (action.type === 'compare') comparisons++;
    else if (action.type === 'swap') swaps++;
    else if (action.type === 'write') writes++;
  }
  return { comparisons, swaps, writes, total: comparisons + swaps + writes };
}

export interface GrowthPoint { n: number; ops: number }

/** Measure one algorithm across sizes; random inputs are averaged over trials. */
export function measureGrowth(algo: SortingAlgorithm, dist: Distribution, sizes: number[] = GROWTH_SIZES): GrowthPoint[] {
  return sizes.map(n => {
    const trials = dist === 'random' || dist === 'few-unique' ? (n <= 128 ? 3 : 2) : 1;
    let sum = 0;
    for (let t = 0; t < trials; t++) sum += countOps(algo, makeInput(n, dist, 0x9e3779b9 + t * 101 + n)).total;
    return { n, ops: Math.round(sum / trials) };
  });
}

export interface OrderModel { id: string; label: string; f: (n: number) => number }

export const ORDER_MODELS: OrderModel[] = [
  { id: 'n', label: 'Θ(n)', f: n => n },
  { id: 'nlogn', label: 'Θ(n log n)', f: n => n * Math.log2(n) },
  { id: 'n1.5', label: 'Θ(n^1.5)', f: n => Math.pow(n, 1.5) },
  { id: 'n2', label: 'Θ(n²)', f: n => n * n },
];

export interface OrderEstimate {
  /** Best-fitting model among ORDER_MODELS. */
  model: OrderModel;
  /** Slope of log ops vs log n over the larger sizes, i.e. ops ≈ c·n^exponent. */
  exponent: number;
}

/**
 * Fit the measured points in log space. The empirical exponent is the
 * least-squares slope of (ln n, ln ops); the best model minimises the residual
 * after choosing its constant as the geometric mean of ops / f(n). Small sizes
 * are dominated by constant factors, so only the larger half is used.
 */
export function estimateOrder(points: GrowthPoint[]): OrderEstimate | null {
  const pts = points.filter(p => p.ops > 0);
  if (pts.length < 4) return null;
  const half = pts.slice(Math.floor(pts.length / 2));

  const xs = half.map(p => Math.log(p.n));
  const ys = half.map(p => Math.log(p.ops));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const exponent = den === 0 ? 0 : num / den;

  let best: OrderModel = ORDER_MODELS[0];
  let bestErr = Infinity;
  for (const m of ORDER_MODELS) {
    const logs = half.map(p => Math.log(p.ops / m.f(p.n)));
    const c = logs.reduce((a, b) => a + b, 0) / logs.length;
    const err = logs.reduce((a, b) => a + (b - c) ** 2, 0);
    if (err < bestErr) { bestErr = err; best = m; }
  }
  return { model: best, exponent };
}
