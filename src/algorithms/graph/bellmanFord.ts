import type { GraphAlgorithm } from './types';
import { GNODE, GEDGE } from './types';

export const bellmanFord: GraphAlgorithm = {
  id: 'bellman-ford',
  name: 'Bellman–Ford',
  summary: 'Single-source shortest paths that tolerates negative edge weights: |V|−1 passes relaxing every edge, with early exit when a pass changes nothing; one extra pass detects negative cycles. This graph is generated with some negative edges but no negative cycle.',
  complexity: { time: { worst: 'O(V·E)' }, space: 'O(V)', tags: ['Negative weights', 'Detects negative cycles', 'Dynamic programming'] },
  kind: 'directed', weighted: true, usesSource: true,
  pseudocode: [
    'procedure BellmanFord(G, s)',                          // 1
    '  dist[v] ← ∞ for all v; dist[s] ← 0',                 // 2
    '  repeat |V| − 1 times',                               // 3
    '    for each edge (u, v) with weight w',               // 4
    '      if dist[u] + w < dist[v] then',                  // 5
    '        dist[v] ← dist[u] + w; parent[v] ← u',         // 6
    '    if nothing was relaxed then break',                // 7
    '  if one more pass still relaxes → negative cycle',    // 8
    '  return dist',                                        // 9
  ],
  *run(g, s) {
    const n = g.nodes.length;
    const dist = new Array<number>(n).fill(Infinity);
    const parentEdge = new Int32Array(n).fill(-1);
    dist[s] = 0;
    const fmt = (x: number) => (x === Infinity ? '∞' : String(x));
    yield { nodes: [[s, GNODE.result]], labels: Object.fromEntries(g.nodes.map(v => [v.id, fmt(v.id === s ? 0 : Infinity)])), line: 2, variables: { s } };
    let pass = 0;
    for (; pass < n - 1; pass++) {
      let relaxed = 0;
      yield { line: 3, variables: { pass: pass + 1, of: n - 1 } };
      for (const e of g.edges) {
        if (dist[e.u] === Infinity) continue;
        const alt = dist[e.u] + e.w;
        if (alt < dist[e.v]) {
          const old = parentEdge[e.v];
          dist[e.v] = alt;
          parentEdge[e.v] = e.id;
          relaxed++;
          yield { edges: [[e.id, GEDGE.tree], ...(old >= 0 && old !== e.id ? [[old, GEDGE.default] as [number, number]] : [])], nodes: [[e.v, GNODE.frontier]], labels: { [e.v]: fmt(alt) }, line: 6, variables: { pass: pass + 1, edge: `${e.u} → ${e.v}`, w: e.w, 'dist[v]': alt } };
        } else {
          yield { edges: [[e.id, GEDGE.active]], line: 5, variables: { pass: pass + 1, edge: `${e.u} → ${e.v}`, w: e.w, 'dist[u] + w': alt, 'dist[v]': fmt(dist[e.v]), relaxed: false } };
          yield { edges: [[e.id, parentEdge[e.v] === e.id ? GEDGE.tree : GEDGE.default]], line: 4, variables: { pass: pass + 1 } };
        }
      }
      yield { line: 7, variables: { pass: pass + 1, 'edges relaxed': relaxed } };
      if (relaxed === 0) break;
    }
    let negative = false;
    for (const e of g.edges) {
      if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) { negative = true; break; }
    }
    yield { nodes: g.nodes.filter(v => dist[v.id] < Infinity).map(v => [v.id, GNODE.visited] as [number, number]), line: 8, variables: { 'negative cycle': negative, passes: pass + 1 } };
    yield { line: 9, variables: { dist: dist.map(fmt), 'negative cycle': negative } };
  },
};
