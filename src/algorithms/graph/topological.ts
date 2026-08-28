import type { GraphAlgorithm } from './types';
import { adjacency, GNODE, GEDGE } from './types';

export const topological: GraphAlgorithm = {
  id: 'topo',
  name: "Topological Sort (Kahn's)",
  summary: 'Repeatedly removes a vertex with no incoming edges from a directed acyclic graph; the removal order respects every edge u → v. Labels show remaining in-degree; removed edges are dashed.',
  complexity: { time: { worst: 'O(V + E)' }, space: 'O(V)', tags: ['DAG', 'Queue-based'] },
  kind: 'dag', weighted: false, usesSource: false,
  pseudocode: [
    'procedure TopologicalSort(G)',                          // 1
    '  indeg[v] ← number of edges into v',                   // 2
    '  Q ← all v with indeg[v] = 0',                         // 3
    '  while Q not empty',                                   // 4
    '    u ← Q.dequeue(); append u to order',                // 5
    '    for each edge (u, v)',                              // 6
    '      indeg[v] ← indeg[v] − 1',                         // 7
    '      if indeg[v] = 0 then Q.enqueue(v)',               // 8
    '  if |order| < |V| then G has a cycle',                 // 9
  ],
  *run(g) {
    const adj = adjacency(g);
    const n = g.nodes.length;
    const indeg = new Int32Array(n);
    for (const e of g.edges) indeg[e.v]++;
    const lab = () => Object.fromEntries(g.nodes.map(v => [v.id, `in=${indeg[v.id]}`]));
    yield { labels: lab(), line: 2, variables: { indeg: Array.from(indeg) } };
    const q: number[] = [];
    for (let v = 0; v < n; v++) if (indeg[v] === 0) q.push(v);
    yield { nodes: q.map(v => [v, GNODE.frontier]), line: 3, variables: { queue: q.slice() } };
    const order: number[] = [];
    let head = 0;
    while (head < q.length) {
      const u = q[head++];
      order.push(u);
      yield { nodes: [[u, GNODE.current]], output: order, line: 5, variables: { u, order: order.slice(), queue: q.slice(head) } };
      for (const { to: v, edge } of adj[u]) {
        indeg[v]--;
        const zero = indeg[v] === 0;
        if (zero) q.push(v);
        yield { edges: [[edge.id, GEDGE.rejected]], nodes: zero ? [[v, GNODE.frontier]] : [], labels: { [v]: `in=${indeg[v]}` }, line: zero ? 8 : 7, variables: { u, v, 'indeg[v]': indeg[v], enqueued: zero } };
      }
      yield { nodes: [[u, GNODE.visited]], line: 4, variables: { u, order: order.slice(), queue: q.slice(head) } };
    }
    yield { output: order, line: 9, variables: { order, acyclic: order.length === n } };
  },
};
