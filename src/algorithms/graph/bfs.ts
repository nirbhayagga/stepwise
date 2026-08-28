import type { GraphAlgorithm } from './types';
import { adjacency, GNODE, GEDGE } from './types';

export const graphBfs: GraphAlgorithm = {
  id: 'bfs',
  name: 'Breadth-First Search',
  summary: 'Visits vertices in order of hop distance from the source; the tree of first-discovery edges gives shortest paths in an unweighted graph.',
  complexity: { time: { worst: 'O(V + E)' }, space: 'O(V)', tags: ['Traversal', 'Unweighted shortest paths'] },
  kind: 'undirected', weighted: false, usesSource: true,
  pseudocode: [
    'procedure BFS(G, s)',                                            // 1
    '  visited ← {s}; Q ← queue; Q.enqueue(s); d[s] ← 0',             // 2
    '  while Q not empty',                                            // 3
    '    u ← Q.dequeue()',                                            // 4
    '    for each edge (u, v)',                                       // 5
    '      if v ∉ visited then',                                      // 6
    '        visited ← visited ∪ {v}; d[v] ← d[u] + 1; Q.enqueue(v)', // 7
  ],
  *run(g, s) {
    const adj = adjacency(g);
    const seen = new Uint8Array(g.nodes.length);
    const d = new Int32Array(g.nodes.length).fill(-1);
    const q = [s]; let head = 0;
    seen[s] = 1; d[s] = 0;
    const order: number[] = [];
    const treeEdges = new Set<number>();
    yield { nodes: [[s, GNODE.frontier]], labels: { [s]: 'd=0' }, line: 2, variables: { s, queue: [s] } };
    while (head < q.length) {
      const u = q[head++];
      order.push(u);
      yield { nodes: [[u, GNODE.current]], output: order, line: 4, variables: { u, 'd[u]': d[u], queue: q.slice(head) } };
      for (const { to: v, edge } of adj[u]) {
        if (seen[v]) {
          if (!treeEdges.has(edge.id)) yield { edges: [[edge.id, GEDGE.rejected]], line: 6, variables: { u, v, 'already visited': true } };
          continue;
        }
        seen[v] = 1; d[v] = d[u] + 1; q.push(v);
        treeEdges.add(edge.id);
        yield { nodes: [[v, GNODE.frontier]], edges: [[edge.id, GEDGE.tree]], labels: { [v]: `d=${d[v]}` }, line: 7, variables: { u, v, 'd[v]': d[v], queue: q.slice(head) } };
      }
      yield { nodes: [[u, GNODE.visited]], line: 3, variables: { u, queue: q.slice(head) } };
    }
    yield { output: order, line: 3, variables: { order, unreachable: g.nodes.length - order.length } };
  },
};
