import type { PathfindingAlgorithm } from './types';
import { MinHeap, neighbors, stepCost, reconstruct, pathCosts, heuristic, label } from './grid';

export const astar: PathfindingAlgorithm = {
  id: 'astar',
  name: 'A* Search',
  summary: 'Dijkstra ordered by f = g + h with an admissible heuristic (Manhattan or octile distance); explores far fewer nodes while remaining optimal.',
  complexity: { time: { worst: 'O(E log V)' }, space: 'O(V)', tags: ['Optimal', 'Complete', 'Weighted', 'Heuristic'] },
  weighted: true,
  diagonal: 'optional',
  pseudocode: [
    'procedure AStar(G, s, t)',                                  // 1
    '  g[v] ← ∞ for all v; g[s] ← 0',                            // 2
    '  Q ← min-priority queue keyed by f = g + h; Q.push(s)',    // 3
    '  while Q not empty',                                       // 4
    '    u ← Q.pop-min()',                                       // 5
    '    if u = t then return path(t)',                          // 6
    '    for each neighbour v of u',                             // 7
    '      tentative ← g[u] + w(u, v)',                          // 8
    '      if tentative < g[v] then',                            // 9
    '        g[v] ← tentative; parent[v] ← u',                   // 10
    '        f[v] ← g[v] + h(v, t); Q.push(v)',                  // 11
    '  return no path',                                          // 12
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const g = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const q = new MinHeap();
    const h = (i: number) => heuristic(t, i, target, opts.diagonal);
    g[start] = 0;
    q.push(start, h(start));
    yield { frontier: [start], line: 3, variables: { s: label(t, start), 'h(s)': h(start) } };

    while (q.size) {
      const { item: u, key: f } = q.pop()!;
      if (closed[u] || f > g[u] + h(u) + 1e-9) continue;
      closed[u] = 1;
      yield { visiting: [u], line: 5, variables: { u: label(t, u), g: g[u], h: h(u), f } };
      if (u === target) {
        const path = reconstruct(parent, target);
        const costs = pathCosts(t, path, true);
        yield { visited: [u], line: 6, variables: { 'g[t]': g[u] } };
        for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 6, variables: { 'g[t]': g[target], edges: k } };
        return;
      }
      for (const nb of neighbors(t, u, opts.diagonal)) {
        if (closed[nb.i]) continue;
        const tentative = g[u] + stepCost(t, nb.i, nb.diagonal, true);
        if (tentative < g[nb.i]) {
          g[nb.i] = tentative;
          parent[nb.i] = u;
          const fv = tentative + h(nb.i);
          q.push(nb.i, fv);
          yield { frontier: [nb.i], line: 11, variables: { u: label(t, u), v: label(t, nb.i), 'g[v]': tentative, 'h(v)': h(nb.i), 'f[v]': fv } };
        }
      }
      yield { visited: [u], line: 4, variables: { u: label(t, u), '|Q|': q.size } };
    }
    yield { line: 12, variables: { result: 'no path' } };
  },
};
