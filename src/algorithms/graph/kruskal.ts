import type { GraphAlgorithm } from './types';
import { GNODE, GEDGE } from './types';

export const kruskal: GraphAlgorithm = {
  id: 'kruskal',
  name: "Kruskal's Minimum Spanning Tree",
  summary: 'Scans edges by increasing weight and keeps each one that joins two different components; a union–find structure answers the component query. Node labels show the component representative.',
  complexity: { time: { worst: 'O(E log E)' }, space: 'O(V)', tags: ['Greedy', 'MST', 'Union–Find'] },
  kind: 'undirected', weighted: true, usesSource: false,
  pseudocode: [
    'procedure Kruskal(G)',                                   // 1
    '  T ← ∅; MakeSet(v) for each vertex v',                  // 2
    '  sort E by weight',                                     // 3
    '  for each edge (u, v) in that order',                   // 4
    '    if Find(u) ≠ Find(v) then',                          // 5
    '      T ← T ∪ {(u, v)}; Union(u, v)',                    // 6
    '    else discard (u, v)          ▷ would close a cycle', // 7
    '  return T',                                             // 8
  ],
  *run(g) {
    const n = g.nodes.length;
    const parent = Int32Array.from({ length: n }, (_, i) => i);
    const rank = new Uint8Array(n);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const union = (a: number, b: number) => {
      a = find(a); b = find(b);
      if (rank[a] < rank[b]) [a, b] = [b, a];
      parent[b] = a;
      if (rank[a] === rank[b]) rank[a]++;
    };
    const labelsNow = () => Object.fromEntries(g.nodes.map(v => [v.id, `∈${find(v.id)}`]));
    yield { labels: labelsNow(), line: 2, variables: { components: n } };
    const sorted = g.edges.slice().sort((a, b) => a.w - b.w || a.id - b.id);
    yield { line: 3, variables: { 'sorted weights': sorted.map(e => e.w) } };
    let total = 0, count = 0, components = n;
    for (const e of sorted) {
      yield { edges: [[e.id, GEDGE.active]], nodes: [[e.u, GNODE.current], [e.v, GNODE.current]], line: 4, variables: { edge: `(${e.u}, ${e.v})`, w: e.w, 'Find(u)': find(e.u), 'Find(v)': find(e.v) } };
      if (find(e.u) !== find(e.v)) {
        union(e.u, e.v);
        total += e.w; count++; components--;
        yield { edges: [[e.id, GEDGE.tree]], nodes: [[e.u, GNODE.result], [e.v, GNODE.result]], labels: labelsNow(), line: 6, variables: { accepted: `(${e.u}, ${e.v})`, 'weight(T)': total, '|T|': count, components } };
      } else {
        yield { edges: [[e.id, GEDGE.rejected]], nodes: [[e.u, GNODE.result], [e.v, GNODE.result]], line: 7, variables: { rejected: `(${e.u}, ${e.v})`, reason: 'same component' } };
      }
      if (count === n - 1) break;
    }
    yield { line: 8, variables: { 'weight(T)': total, '|T|': count } };
  },
};
