import type { GraphAlgorithm } from './types';
import { adjacency, GNODE, GEDGE } from './types';

export const prim: GraphAlgorithm = {
  id: 'prim',
  name: "Prim's Minimum Spanning Tree",
  summary: 'Grows one tree from the source, always attaching the cheapest edge that leaves the tree (the cut property guarantees it belongs to some MST).',
  complexity: { time: { worst: 'O(E log V)' }, space: 'O(V)', tags: ['Greedy', 'MST', 'Undirected'] },
  kind: 'undirected', weighted: true, usesSource: true,
  pseudocode: [
    'procedure Prim(G, s)',                                         // 1
    '  key[v] ← ∞ for all v; key[s] ← 0; T ← ∅',                    // 2
    '  while some vertex is not in T',                              // 3
    '    u ← vertex ∉ T with minimum key; add u (and its edge) to T', // 4
    '    for each edge (u, v) with weight w',                       // 5
    '      if v ∉ T and w < key[v] then',                           // 6
    '        key[v] ← w; parent[v] ← u',                            // 7
  ],
  *run(g, s) {
    const adj = adjacency(g);
    const n = g.nodes.length;
    const key = new Float64Array(n).fill(Infinity);
    const via = new Int32Array(n).fill(-1);
    const inTree = new Uint8Array(n);
    key[s] = 0;
    let total = 0;
    yield { nodes: [[s, GNODE.frontier]], labels: Object.fromEntries(g.nodes.map(v => [v.id, v.id === s ? '0' : '∞'])), line: 2, variables: { s } };
    for (;;) {
      let u = -1;
      for (let v = 0; v < n; v++) if (!inTree[v] && key[v] < Infinity && (u === -1 || key[v] < key[u])) u = v;
      if (u === -1) break;
      inTree[u] = 1;
      total += key[u];
      yield { nodes: [[u, GNODE.result]], edges: via[u] >= 0 ? [[via[u], GEDGE.tree]] : [], line: 4, variables: { u, 'key[u]': key[u], 'weight(T)': total } };
      for (const { to: v, edge } of adj[u]) {
        if (inTree[v]) continue;
        if (edge.w < key[v]) {
          const old = via[v];
          key[v] = edge.w; via[v] = edge.id;
          yield { nodes: [[v, GNODE.frontier]], edges: [[edge.id, GEDGE.active], ...(old >= 0 ? [[old, GEDGE.rejected] as [number, number]] : [])], labels: { [v]: String(edge.w) }, line: 7, variables: { u, v, w: edge.w, improved: true } };
        } else {
          yield { edges: [[edge.id, GEDGE.rejected]], line: 6, variables: { u, v, w: edge.w, 'key[v]': key[v], improved: false } };
        }
      }
    }
    yield { line: 3, variables: { 'weight(T)': total, edges: inTree.reduce((a, b) => a + b, 0) - 1 } };
  },
};
