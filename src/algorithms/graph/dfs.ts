import type { GraphAction, GraphAlgorithm } from './types';
import { adjacency, GNODE, GEDGE } from './types';

export const graphDfs: GraphAlgorithm = {
  id: 'dfs',
  name: 'Depth-First Search',
  summary: 'Recursive traversal that records discovery and finish times d/f; tree edges form a DFS forest and finishing order underlies topological sorting.',
  complexity: { time: { worst: 'O(V + E)' }, space: 'O(V)', tags: ['Traversal', 'Recursive', 'Discovery/finish times'] },
  kind: 'undirected', weighted: false, usesSource: true,
  pseudocode: [
    'procedure DFS(G, s)',                                          // 1
    '  time ← 0; start with s, then any undiscovered vertex',       // 2
    'procedure Visit(u)',                                           // 3
    '  time ← time + 1; d[u] ← time; colour u grey',                // 4
    '  for each edge (u, v)',                                       // 5
    '    if v is white then parent[v] ← u; Visit(v)',               // 6
    '  time ← time + 1; f[u] ← time; colour u black',               // 7
  ],
  *run(g, s) {
    const adj = adjacency(g);
    const colour = new Uint8Array(g.nodes.length); // 0 white, 1 grey, 2 black
    const d = new Int32Array(g.nodes.length), f = new Int32Array(g.nodes.length);
    let time = 0;
    const order: number[] = [];
    function* visit(u: number, depth: number): Generator<GraphAction, void, unknown> {
      colour[u] = 1; d[u] = ++time; order.push(u);
      yield { nodes: [[u, GNODE.current]], labels: { [u]: `d=${d[u]}` }, output: order, line: 4, variables: { u, 'd[u]': d[u], depth, time } };
      for (const { to: v, edge } of adj[u]) {
        if (colour[v] === 0) {
          yield { edges: [[edge.id, GEDGE.active]], line: 6, variables: { u, v, edge: 'tree' } };
          yield* visit(v, depth + 1);
          yield { nodes: [[u, GNODE.current]], edges: [[edge.id, GEDGE.tree]], line: 5, variables: { u, back_to: u, depth } };
        } else if (edge.id !== undefined && edgeUnmarked(edge.id)) {
          yield { edges: [[edge.id, GEDGE.rejected]], line: 6, variables: { u, v, edge: colour[v] === 1 ? 'back edge' : 'already explored' } };
        }
      }
      colour[u] = 2; f[u] = ++time;
      yield { nodes: [[u, GNODE.visited]], labels: { [u]: `${d[u]}/${f[u]}` }, line: 7, variables: { u, 'd[u]': d[u], 'f[u]': f[u], time } };
    }
    const marked = new Set<number>();
    function edgeUnmarked(id: number) { if (marked.has(id)) return false; marked.add(id); return true; }
    yield { line: 2, variables: { s, time } };
    yield* visit(s, 0);
    for (let u = 0; u < g.nodes.length; u++) {
      if (colour[u] === 0) {
        yield { line: 2, variables: { restart: u, reason: 'unreachable from s' } };
        yield* visit(u, 0);
      }
    }
    yield { output: order, line: 2, variables: { order, time } };
  },
};
