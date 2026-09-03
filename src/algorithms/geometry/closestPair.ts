import type { GeoAction, GeometryAlgorithm, GeoPoint } from './types';
import { GPT, dist, seg } from './types';

export const closestPair: GeometryAlgorithm = {
  id: 'closest-pair',
  name: 'Closest Pair (divide & conquer)',
  summary: 'Splits the points at the median x, solves both halves, then only checks the strip within d of the divider — each strip point against at most 7 successors by y — beating the O(n²) of comparing everything.',
  complexity: { time: { worst: 'O(n log n)' }, space: 'O(n)', recurrence: 'T(n) = 2T(n/2) + Θ(n) ⇒ Θ(n log n) — Master case 2', tags: ['Divide & conquer', 'Strip argument'] },
  pseudocode: [
    'procedure Closest(P sorted by x)',                                // 1
    '  if |P| ≤ 3 then compare all pairs',                             // 2
    '  m ← median x; d ← min(Closest(left), Closest(right))',          // 3
    '  strip ← points with |x − m| < d, sorted by y',                  // 4
    '  for each strip point, compare to the next ≤ 7 strip points',    // 5
    '  return the best pair found',                                    // 6
  ],
  *run(points) {
    const byX = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    let best = Infinity;
    let bestPair: [GeoPoint, GeoPoint] | null = null;
    let comparisons = 0;

    function* consider(a: GeoPoint, b: GeoPoint, where: string): Generator<GeoAction, void, unknown> {
      comparisons++;
      const d = dist(a, b);
      const improved = d < best;
      if (improved) { best = d; bestPair = [a, b]; }
      yield {
        points: [[a.id, GPT.active], [b.id, GPT.active]],
        overlay: [seg(a, b, improved ? 'best' : 'active')],
        segments: bestPair ? [seg(bestPair[0], bestPair[1], 'best')] : [],
        line: where === 'strip' ? 5 : 2,
        variables: { pair: `${a.id} – ${b.id}`, distance: d, where, best, comparisons },
      };
    }

    function* solve(lo: number, hi: number, depth: number): Generator<GeoAction, void, unknown> {
      const count = hi - lo;
      if (count <= 3) {
        for (let i = lo; i < hi; i++) for (let j = i + 1; j < hi; j++) yield* consider(byX[i], byX[j], 'base case');
        return;
      }
      const mid = (lo + hi) >> 1;
      const mx = (byX[mid - 1].x + byX[mid].x) / 2;
      yield { overlay: [{ x1: mx, y1: 0, x2: mx, y2: 1, kind: 'divider' }], line: 3, variables: { depth, split: `x = ${mx.toFixed(2)}`, points: count } };
      yield* solve(lo, mid, depth + 1);
      yield* solve(mid, hi, depth + 1);
      const strip = byX.slice(lo, hi).filter(p => Math.abs(p.x - mx) < best).sort((a, b) => a.y - b.y);
      yield {
        points: strip.map(p => [p.id, GPT.strip] as [number, number]),
        overlay: [{ x1: mx, y1: 0, x2: mx, y2: 1, kind: 'divider' }],
        line: 4, variables: { depth, 'strip size': strip.length, d: best },
      };
      for (let i = 0; i < strip.length; i++) {
        for (let j = i + 1; j < strip.length && strip[j].y - strip[i].y < best; j++) {
          yield* consider(strip[i], strip[j], 'strip');
        }
      }
    }

    yield { line: 1, variables: { n: points.length } };
    yield* solve(0, byX.length, 0);
    if (bestPair !== null) {
      const [a, b] = bestPair as [GeoPoint, GeoPoint];
      yield { mark: [[a.id, GPT.best], [b.id, GPT.best]], segments: [seg(a, b, 'best')], line: 6, variables: { 'closest pair': `${a.id} – ${b.id}`, distance: best, comparisons } };
    }
  },
};
