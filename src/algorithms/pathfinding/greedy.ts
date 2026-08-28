import type { PathfindingAlgorithm } from './types';
import { MinHeap, neighbors, reconstruct, pathCosts, heuristic, label } from './grid';

export const greedyBestFirst: PathfindingAlgorithm = {
  id: 'greedy',
  name: 'Greedy Best-First Search',
  summary: 'Expands the node that looks closest to the target by heuristic alone (f = h); fast but ignores path cost, so the result is not guaranteed optimal.',
  complexity: { time: { worst: 'O(E log V)' }, space: 'O(V)', tags: ['Not optimal', 'Complete', 'Heuristic'] },
  weighted: false,
  diagonal: 'optional',
  pseudocode: [
    'procedure GreedyBestFirst(G, s, t)',                   // 1
    '  Q ← min-priority queue keyed by h(v, t); Q.push(s)', // 2
    '  visited ← {s}',                                      // 3
    '  while Q not empty',                                  // 4
    '    u ← Q.pop-min()',                                  // 5
    '    if u = t then return path(t)',                     // 6
    '    for each neighbour v of u',                        // 7
    '      if v ∉ visited then',                            // 8
    '        visited ← visited ∪ {v}; parent[v] ← u',       // 9
    '        Q.push(v)',                                    // 10
    '  return no path',                                     // 11
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const parent = new Int32Array(n).fill(-1);
    const seen = new Uint8Array(n);
    const q = new MinHeap();
    const h = (i: number) => heuristic(t, i, target, opts.diagonal);
    seen[start] = 1;
    q.push(start, h(start));
    yield { frontier: [start], line: 2, variables: { s: label(t, start), 'h(s)': h(start) } };

    while (q.size) {
      const { item: u, key } = q.pop()!;
      yield { visiting: [u], line: 5, variables: { u: label(t, u), 'h(u)': key } };
      if (u === target) {
        const path = reconstruct(parent, target);
        const costs = pathCosts(t, path, false);
        yield { visited: [u], line: 6 };
        for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 6, variables: { edges: k } };
        return;
      }
      for (const nb of neighbors(t, u, opts.diagonal)) {
        if (seen[nb.i]) continue;
        seen[nb.i] = 1;
        parent[nb.i] = u;
        q.push(nb.i, h(nb.i));
        yield { frontier: [nb.i], line: 10, variables: { u: label(t, u), v: label(t, nb.i), 'h(v)': h(nb.i) } };
      }
      yield { visited: [u], line: 4, variables: { u: label(t, u), '|Q|': q.size } };
    }
    yield { line: 11, variables: { result: 'no path' } };
  },
};
