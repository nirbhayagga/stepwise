import type { PathfindingAlgorithm } from './types';
import { neighbors, pathCosts, label } from './grid';

export const bidirectional: PathfindingAlgorithm = {
  id: 'bidir',
  name: 'Bidirectional BFS',
  summary: 'Runs breadth-first searches from both endpoints and stops when the frontiers meet; each side explores roughly half the depth.',
  complexity: { time: { worst: 'O(b^(d/2))' }, space: 'O(b^(d/2))', tags: ['Optimal (unweighted)', 'Complete'] },
  weighted: false,
  diagonal: 'optional',
  pseudocode: [
    'procedure BidirectionalBFS(G, s, t)',                        // 1
    '  Qs ← {s}; Qt ← {t}; seenS ← {s}; seenT ← {t}',              // 2
    '  while Qs and Qt not empty',                                 // 3
    '    expand one layer from the smaller side:',                 // 4
    '      u ← Q.dequeue()',                                       // 5
    '      for each neighbour v of u',                             // 6
    '        if v seen by the other side then return join(u, v)',  // 7
    '        if v ∉ seen then seen ← seen ∪ {v}; parent[v] ← u; Q.enqueue(v)', // 8
    '  return no path',                                            // 9
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const parentS = new Int32Array(n).fill(-1);
    const parentT = new Int32Array(n).fill(-1);
    const seenS = new Uint8Array(n);
    const seenT = new Uint8Array(n);
    let qs = [start], qt = [target];
    seenS[start] = 1; seenT[target] = 1;
    yield { frontier: [start, target], line: 2 };

    const join = function* (meetS: number, meetT: number) {
      const left: number[] = [];
      for (let c = meetS; c !== -1; c = parentS[c]) left.push(c);
      left.reverse();
      const right: number[] = [];
      for (let c = meetT; c !== -1; c = parentT[c]) right.push(c);
      const path = left.concat(right);
      const costs = pathCosts(t, path, false);
      for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 7, variables: { edges: k } };
    };

    while (qs.length && qt.length) {
      const fromStart = qs.length <= qt.length;
      const q = fromStart ? qs : qt;
      const seen = fromStart ? seenS : seenT;
      const other = fromStart ? seenT : seenS;
      const parent = fromStart ? parentS : parentT;
      const next: number[] = [];
      const side = fromStart ? 'start' : 'target';
      yield { line: 4, variables: { side, layer: q.length } };
      for (const u of q) {
        yield { visiting: [u], line: 5, variables: { side, u: label(t, u) } };
        for (const nb of neighbors(t, u, opts.diagonal)) {
          if (other[nb.i]) {
            yield { visited: [u], line: 7, variables: { side, meet: label(t, nb.i) } };
            if (fromStart) yield* join(u, nb.i);
            else yield* join(nb.i, u);
            return;
          }
          if (!seen[nb.i]) {
            seen[nb.i] = 1;
            parent[nb.i] = u;
            next.push(nb.i);
            yield { frontier: [nb.i], line: 8, variables: { side, u: label(t, u), v: label(t, nb.i) } };
          }
        }
        yield { visited: [u], line: 6, variables: { side, u: label(t, u) } };
      }
      if (fromStart) qs = next; else qt = next;
    }
    yield { line: 9, variables: { result: 'no path' } };
  },
};
