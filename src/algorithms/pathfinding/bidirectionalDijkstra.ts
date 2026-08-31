import type { PathfindingAlgorithm } from './types';
import { MinHeap, neighbors, stepCost, pathCosts, label } from './grid';

export const bidirectionalDijkstra: PathfindingAlgorithm = {
  id: 'bidir-dijkstra',
  name: 'Bidirectional Dijkstra',
  summary: 'Runs Dijkstra from both endpoints at once, always expanding the side with the smaller tentative distance; stops when the two search radii together cover the best meeting point.',
  complexity: { time: { worst: 'O((V + E) log V)' }, space: 'O(V)', tags: ['Optimal', 'Complete', 'Weighted'] },
  weighted: true,
  diagonal: 'optional',
  pseudocode: [
    'procedure BidirectionalDijkstra(G, s, t)',                        // 1
    '  distS[s] ← 0; distT[t] ← 0; μ ← ∞',                             // 2
    '  while both queues non-empty',                                   // 3
    '    expand from the side with the smaller minimum key:',          // 4
    '      u ← Q.pop-min(); mark u settled for this side',             // 5
    '      if distS[u] + distT[u] < μ then μ ← that; meet ← u',        // 6
    '      relax the neighbours of u on this side',                    // 7
    '    if minS + minT ≥ μ then return join(meet)',                   // 8
    '  return no path',                                                // 9
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const dist = [new Float64Array(n).fill(Infinity), new Float64Array(n).fill(Infinity)];
    const parent = [new Int32Array(n).fill(-1), new Int32Array(n).fill(-1)];
    const settled = [new Uint8Array(n), new Uint8Array(n)];
    const q = [new MinHeap(), new MinHeap()];
    dist[0][start] = 0; dist[1][target] = 0;
    q[0].push(start, 0); q[1].push(target, 0);
    let mu = Infinity, meet = -1;
    const top = [0, 0];
    yield { frontier: [start, target], line: 2, variables: { s: label(t, start), t: label(t, target) } };

    while (q[0].size && q[1].size) {
      const side = top[0] <= top[1] ? 0 : 1;
      const popped = q[side].pop()!;
      const u = popped.item;
      if (settled[side][u] || popped.key > dist[side][u]) { top[side] = q[side].size ? peekKey(q[side]) : Infinity; continue; }
      settled[side][u] = 1;
      top[side] = popped.key;
      yield { visiting: [u], line: 5, variables: { side: side === 0 ? 'start' : 'target', u: label(t, u), 'dist[u]': dist[side][u], 'μ': mu } };
      if (dist[0][u] + dist[1][u] < mu) {
        mu = dist[0][u] + dist[1][u];
        meet = u;
        yield { line: 6, variables: { meet: label(t, u), 'μ': mu } };
      }
      for (const nb of neighbors(t, u, opts.diagonal)) {
        if (settled[side][nb.i]) continue;
        // Forward search pays for entering the neighbour; the backward search
        // walks reversed edges, whose forward cost is entering the popped node.
        const alt = dist[side][u] + stepCost(t, side === 0 ? nb.i : u, nb.diagonal, true);
        if (alt < dist[side][nb.i]) {
          dist[side][nb.i] = alt;
          parent[side][nb.i] = u;
          q[side].push(nb.i, alt);
          if (dist[0][nb.i] + dist[1][nb.i] < mu) { mu = dist[0][nb.i] + dist[1][nb.i]; meet = nb.i; }
          yield { frontier: [nb.i], line: 7, variables: { side: side === 0 ? 'start' : 'target', v: label(t, nb.i), alt, 'μ': mu } };
        }
      }
      yield { visited: [u], line: 3, variables: { side: side === 0 ? 'start' : 'target', u: label(t, u) } };
      const minS = q[0].size ? peekKey(q[0]) : Infinity;
      const minT = q[1].size ? peekKey(q[1]) : Infinity;
      top[0] = minS; top[1] = minT;
      if (minS + minT >= mu && meet >= 0) break;
    }
    if (meet < 0 || mu === Infinity) { yield { line: 9, variables: { result: 'no path' } }; return; }

    const left: number[] = [];
    for (let c = meet; c !== -1; c = parent[0][c]) left.push(c);
    left.reverse();
    const right: number[] = [];
    for (let c = parent[1][meet]; c !== -1; c = parent[1][c]) right.push(c);
    const path = left.concat(right);
    const costs = pathCosts(t, path, true);
    yield { line: 8, variables: { meet: label(t, meet), 'μ': mu } };
    for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 8, variables: { 'μ': mu, edges: k } };

    function peekKey(h: MinHeap): number {
      const p = h.pop()!;
      h.push(p.item, p.key);
      return p.key;
    }
  },
};
