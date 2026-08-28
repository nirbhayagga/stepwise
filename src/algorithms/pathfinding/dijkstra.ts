import type { PathfindingAlgorithm } from './types';
import { MinHeap, neighbors, stepCost, reconstruct, pathCosts, label } from './grid';

export const dijkstra: PathfindingAlgorithm = {
  id: 'dijkstra',
  name: "Dijkstra's Algorithm",
  summary: 'Uniform-cost search: always expands the frontier node with the smallest known distance, so the first time the target is popped its distance is optimal.',
  complexity: { time: { worst: 'O((V + E) log V)' }, space: 'O(V)', tags: ['Optimal', 'Complete', 'Weighted'] },
  weighted: true,
  diagonal: 'optional',
  pseudocode: [
    'procedure Dijkstra(G, s, t)',                        // 1
    '  dist[v] ← ∞ for all v; dist[s] ← 0',               // 2
    '  Q ← min-priority queue keyed by dist; Q.push(s)',  // 3
    '  while Q not empty',                                // 4
    '    u ← Q.pop-min()',                                // 5
    '    if u = t then return path(t)',                   // 6
    '    for each neighbour v of u',                      // 7
    '      alt ← dist[u] + w(u, v)',                      // 8
    '      if alt < dist[v] then',                        // 9
    '        dist[v] ← alt; parent[v] ← u; Q.push(v)',    // 10
    '  return no path',                                   // 11
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const dist = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const q = new MinHeap();
    dist[start] = 0;
    q.push(start, 0);
    yield { frontier: [start], line: 3, variables: { s: label(t, start), t: label(t, target) } };

    while (q.size) {
      const { item: u, key } = q.pop()!;
      if (closed[u] || key > dist[u]) continue;
      closed[u] = 1;
      yield { visiting: [u], line: 5, variables: { u: label(t, u), 'dist[u]': dist[u] } };
      if (u === target) {
        const path = reconstruct(parent, target);
        const costs = pathCosts(t, path, true);
        yield { visited: [u], line: 6, variables: { u: label(t, u), 'dist[t]': dist[u] } };
        for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 6, variables: { 'dist[t]': dist[target], edges: k } };
        return;
      }
      for (const nb of neighbors(t, u, opts.diagonal)) {
        if (closed[nb.i]) continue;
        const alt = dist[u] + stepCost(t, nb.i, nb.diagonal, true);
        if (alt < dist[nb.i]) {
          dist[nb.i] = alt;
          parent[nb.i] = u;
          q.push(nb.i, alt);
          yield { frontier: [nb.i], line: 10, variables: { u: label(t, u), v: label(t, nb.i), alt } };
        }
      }
      yield { visited: [u], line: 4, variables: { u: label(t, u), 'dist[u]': dist[u], '|Q|': q.size } };
    }
    yield { line: 11, variables: { result: 'no path' } };
  },
};
