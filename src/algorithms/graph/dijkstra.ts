import type { GraphAlgorithm } from './types';
import { adjacency, GNODE, GEDGE } from './types';

export const graphDijkstra: GraphAlgorithm = {
  id: 'dijkstra',
  name: "Dijkstra's Shortest Paths",
  summary: 'Single-source shortest paths with non-negative weights: repeatedly settle the tentative-closest vertex and relax its outgoing edges.',
  complexity: { time: { worst: 'O((V + E) log V)' }, space: 'O(V)', tags: ['Greedy', 'Non-negative weights', 'Optimal'] },
  kind: 'undirected', weighted: true, usesSource: true,
  pseudocode: [
    'procedure Dijkstra(G, s)',                                     // 1
    '  dist[v] ← ∞ for all v; dist[s] ← 0; Q ← all vertices',       // 2
    '  while Q not empty',                                          // 3
    '    u ← Q.extract-min(dist)',                                  // 4
    '    for each edge (u, v) with weight w',                       // 5
    '      if dist[u] + w < dist[v] then',                          // 6
    '        dist[v] ← dist[u] + w; parent[v] ← u',                 // 7
  ],
  *run(g, s) {
    const adj = adjacency(g);
    const n = g.nodes.length;
    const dist = new Float64Array(n).fill(Infinity);
    const parentEdge = new Int32Array(n).fill(-1);
    const done = new Uint8Array(n);
    dist[s] = 0;
    const fmt = (x: number) => (x === Infinity ? '∞' : String(x));
    yield { nodes: [[s, GNODE.frontier]], labels: Object.fromEntries(g.nodes.map(v => [v.id, v.id === s ? '0' : '∞'])), line: 2, variables: { s } };
    for (;;) {
      let u = -1;
      for (let v = 0; v < n; v++) if (!done[v] && dist[v] < Infinity && (u === -1 || dist[v] < dist[u])) u = v;
      if (u === -1) break;
      done[u] = 1;
      yield { nodes: [[u, GNODE.current]], edges: parentEdge[u] >= 0 ? [[parentEdge[u], GEDGE.tree]] : [], line: 4, variables: { u, 'dist[u]': dist[u] } };
      for (const { to: v, edge } of adj[u]) {
        if (done[v]) continue;
        const alt = dist[u] + edge.w;
        if (alt < dist[v]) {
          const old = parentEdge[v];
          dist[v] = alt; parentEdge[v] = edge.id;
          yield { nodes: [[v, GNODE.frontier]], edges: [[edge.id, GEDGE.active], ...(old >= 0 ? [[old, GEDGE.rejected] as [number, number]] : [])], labels: { [v]: fmt(alt) }, line: 7, variables: { u, v, w: edge.w, 'dist[u] + w': alt, relaxed: true } };
        } else {
          yield { edges: [[edge.id, edgeIsTree(edge.id) ? GEDGE.tree : GEDGE.rejected]], line: 6, variables: { u, v, w: edge.w, 'dist[u] + w': alt, 'dist[v]': dist[v], relaxed: false } };
        }
      }
      yield { nodes: [[u, GNODE.visited]], line: 3, variables: { settled: u, 'dist[u]': dist[u] } };
    }
    yield { line: 3, variables: { dist: Array.from(dist, fmt) } };

    function edgeIsTree(id: number) { return Array.from(parentEdge).includes(id); }
  },
};
