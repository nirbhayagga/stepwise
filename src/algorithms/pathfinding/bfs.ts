import type { PathfindingAlgorithm } from './types';
import { neighbors, reconstruct, pathCosts, label } from './grid';

export const bfs: PathfindingAlgorithm = {
  id: 'bfs',
  name: 'Breadth-First Search',
  summary: 'Expands nodes in order of hop count using a FIFO queue; optimal on unweighted grids, blind to cell weights.',
  complexity: { time: { worst: 'O(V + E)' }, space: 'O(V)', tags: ['Optimal (unweighted)', 'Complete'] },
  weighted: false,
  diagonal: 'optional',
  pseudocode: [
    'procedure BFS(G, s, t)',                             // 1
    '  Q ← FIFO queue; Q.enqueue(s); visited ← {s}',      // 2
    '  while Q not empty',                                // 3
    '    u ← Q.dequeue()',                                // 4
    '    if u = t then return path(t)',                   // 5
    '    for each neighbour v of u',                      // 6
    '      if v ∉ visited then',                          // 7
    '        visited ← visited ∪ {v}; parent[v] ← u',     // 8
    '        Q.enqueue(v)',                               // 9
    '  return no path',                                   // 10
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const parent = new Int32Array(n).fill(-1);
    const seen = new Uint8Array(n);
    const depth = new Int32Array(n);
    const queue: number[] = [start];
    let head = 0;
    seen[start] = 1;
    yield { frontier: [start], line: 2, variables: { s: label(t, start) } };

    while (head < queue.length) {
      const u = queue[head++];
      yield { visiting: [u], line: 4, variables: { u: label(t, u), depth: depth[u] } };
      if (u === target) {
        const path = reconstruct(parent, target);
        const costs = pathCosts(t, path, false);
        yield { visited: [u], line: 5, variables: { depth: depth[u] } };
        for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 5, variables: { edges: k } };
        return;
      }
      for (const nb of neighbors(t, u, opts.diagonal)) {
        if (seen[nb.i]) continue;
        seen[nb.i] = 1;
        parent[nb.i] = u;
        depth[nb.i] = depth[u] + 1;
        queue.push(nb.i);
        yield { frontier: [nb.i], line: 9, variables: { u: label(t, u), v: label(t, nb.i), 'depth[v]': depth[nb.i] } };
      }
      yield { visited: [u], line: 3, variables: { u: label(t, u), '|Q|': queue.length - head } };
    }
    yield { line: 10, variables: { result: 'no path' } };
  },
};
