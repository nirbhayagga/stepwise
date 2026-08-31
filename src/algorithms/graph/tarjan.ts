import type { GraphAction, GraphAlgorithm } from './types';
import { adjacency, GNODE, GEDGE } from './types';

export const tarjan: GraphAlgorithm = {
  id: 'tarjan',
  name: 'Tarjan SCC',
  summary: "Strongly connected components in one DFS: each vertex gets an index and a low-link (the smallest index reachable through its subtree and one back edge); when low = index, the stack above and including that vertex is one component.",
  complexity: { time: { worst: 'O(V + E)' }, space: 'O(V)', tags: ['Directed', 'DFS', 'Low-link'] },
  kind: 'directed', weighted: false, usesSource: false,
  pseudocode: [
    'procedure Tarjan(G)',                                               // 1
    '  index ← 0; S ← empty stack',                                      // 2
    '  for each unvisited vertex v: Connect(v)',                         // 3
    'procedure Connect(v)',                                              // 4
    '  v.idx ← v.low ← index++; push v',                                 // 5
    '  for each edge (v, w)',                                            // 6
    '    if w unvisited then Connect(w); v.low ← min(v.low, w.low)',     // 7
    '    else if w on stack then v.low ← min(v.low, w.idx)',             // 8
    '  if v.low = v.idx then pop down to v — one SCC',                   // 9
  ],
  *run(g) {
    const adj = adjacency(g);
    const n = g.nodes.length;
    const idx = new Int32Array(n).fill(-1);
    const low = new Int32Array(n).fill(-1);
    const onStack = new Uint8Array(n);
    const stack: number[] = [];
    let index = 0, comp = 0;
    const components: number[][] = [];
    const lab = (v: number) => ({ [v]: `${idx[v]}/${low[v]}` });

    function* connect(v: number): Generator<GraphAction, void, unknown> {
      idx[v] = low[v] = index++;
      stack.push(v);
      onStack[v] = 1;
      yield { nodes: [[v, GNODE.current]], labels: lab(v), line: 5, variables: { v, index, stack: stack.slice() } };
      for (const { to: w, edge } of adj[v]) {
        if (idx[w] === -1) {
          yield { edges: [[edge.id, GEDGE.active]], line: 7, variables: { v, w, edge: 'tree' } };
          yield* connect(w);
          low[v] = Math.min(low[v], low[w]);
          yield { nodes: [[v, GNODE.current]], edges: [[edge.id, GEDGE.tree]], labels: lab(v), line: 7, variables: { v, w, 'low[v]': low[v] } };
        } else if (onStack[w]) {
          low[v] = Math.min(low[v], idx[w]);
          yield { edges: [[edge.id, GEDGE.active]], labels: lab(v), line: 8, variables: { v, w, 'back edge to idx': idx[w], 'low[v]': low[v] } };
          yield { edges: [[edge.id, GEDGE.rejected]], line: 8, variables: { v, w } };
        } else {
          yield { edges: [[edge.id, GEDGE.rejected]], line: 8, variables: { v, w, note: 'w in a finished SCC' } };
        }
      }
      if (low[v] === idx[v]) {
        const members: number[] = [];
        for (;;) {
          const w = stack.pop()!;
          onStack[w] = 0;
          members.push(w);
          if (w === v) break;
        }
        components.push(members);
        yield {
          nodes: members.map(m => [m, GNODE.result] as [number, number]),
          labels: Object.fromEntries(members.map(m => [m, `C${comp}`])),
          line: 9,
          variables: { root: v, [`C${comp}`]: members.slice().sort((a, b) => a - b) },
        };
        comp++;
      } else {
        yield { nodes: [[v, GNODE.visited]], labels: lab(v), line: 9, variables: { v, 'low[v]': low[v], 'idx[v]': idx[v] } };
      }
    }

    yield { line: 2, variables: { vertices: n } };
    for (let v = 0; v < n; v++) if (idx[v] === -1) { yield { line: 3, variables: { start: v } }; yield* connect(v); }
    yield { line: 3, variables: { components: components.length } };
  },
};
