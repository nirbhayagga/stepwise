import type { GeometryAlgorithm } from './types';
import { GPT, cross, dist, seg } from './types';

export const jarvisMarch: GeometryAlgorithm = {
  id: 'jarvis',
  name: 'Gift Wrapping (Jarvis March)',
  summary: 'Wraps the point set like string around a parcel: from the leftmost point, repeatedly pick the point that every other point lies to the left of, until returning to the start. Output-sensitive: O(n·h) for h hull points.',
  complexity: { time: { worst: 'O(n·h)' }, space: 'O(h)', tags: ['Convex hull', 'Output-sensitive', 'No sorting'] },
  pseudocode: [
    'procedure GiftWrapping(P)',                                     // 1
    '  start ← leftmost point; cur ← start',                         // 2
    '  repeat',                                                      // 3
    '    cand ← any point ≠ cur',                                    // 4
    '    for each other point q',                                    // 5
    '      if q is right of the line cur→cand then cand ← q',        // 6
    '    hull edge cur→cand; cur ← cand',                            // 7
    '  until cur = start',                                           // 8
  ],
  *run(points) {
    const start = points.reduce((a, b) => (b.x < a.x || (b.x === a.x && b.y < a.y) ? b : a));
    const hull: number[] = [start.id];
    const hullSegs: ReturnType<typeof seg>[] = [];
    yield { mark: [[start.id, GPT.hull]], line: 2, variables: { start: start.id } };
    let cur = start, tests = 0;
    for (;;) {
      let cand = points.find(p => p !== cur)!;
      yield { points: [[cand.id, GPT.active]], overlay: [seg(cur, cand, 'active')], line: 4, variables: { cur: cur.id, candidate: cand.id } };
      for (const q of points) {
        if (q === cur || q === cand) continue;
        tests++;
        const c = cross(cur, cand, q);
        // q strictly right of cur→cand (or collinear but farther) beats cand.
        const better = c < 0 || (c === 0 && dist(cur, q) > dist(cur, cand));
        yield { points: [[q.id, GPT.active], [cand.id, GPT.strip]], overlay: [seg(cur, cand, 'active'), seg(cur, q, 'best')], line: 6, variables: { cur: cur.id, candidate: cand.id, q: q.id, 'q more clockwise': better, 'orientation tests': tests } };
        if (better) cand = q;
      }
      hullSegs.push(seg(cur, cand, 'hull'));
      yield { mark: [[cand.id, GPT.hull]], segments: hullSegs.slice(), line: 7, variables: { edge: `${cur.id} → ${cand.id}` } };
      cur = cand;
      if (cur === start) break;
      hull.push(cur.id);
    }
    yield { segments: hullSegs.slice(), line: 8, variables: { hull, 'hull size': hull.length, 'orientation tests': tests } };
  },
};
