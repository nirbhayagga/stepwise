import type { PathfindingAlgorithm } from './types';
import { neighbors, reconstruct, pathCosts, label } from './grid';

export const dfs: PathfindingAlgorithm = {
  id: 'dfs',
  name: 'Depth-First Search',
  summary: 'Follows one branch as deep as possible before backtracking (explicit stack); finds a path but typically a long one.',
  complexity: { time: { worst: 'O(V + E)' }, space: 'O(V)', tags: ['Not optimal', 'Complete (finite graph)'] },
  weighted: false,
  diagonal: 'optional',
  pseudocode: [
    'procedure DFS(G, s, t)',                               // 1
    '  S ← stack; S.push(s)',                               // 2
    '  while S not empty',                                  // 3
    '    u ← S.pop()',                                      // 4
    '    if u ∈ visited then continue',                     // 5
    '    visited ← visited ∪ {u}',                          // 6
    '    if u = t then return path(t)',                     // 7
    '    for each neighbour v of u (reverse order)',        // 8
    '      if v ∉ visited then parent[v] ← u; S.push(v)',   // 9
    '  return no path',                                     // 10
  ],
  *run(t, start, target, opts) {
    const n = t.rows * t.cols;
    const parent = new Int32Array(n).fill(-1);
    const visited = new Uint8Array(n);
    const stack: number[] = [start];
    yield { frontier: [start], line: 2, variables: { s: label(t, start) } };

    while (stack.length) {
      const u = stack.pop()!;
      if (visited[u]) continue;
      visited[u] = 1;
      yield { visiting: [u], line: 6, variables: { u: label(t, u), '|S|': stack.length } };
      if (u === target) {
        const path = reconstruct(parent, target);
        const costs = pathCosts(t, path, false);
        yield { visited: [u], line: 7 };
        for (let k = 0; k < path.length; k++) yield { path: [path[k]], cost: costs[k], line: 7, variables: { edges: k } };
        return;
      }
      const nbs = neighbors(t, u, opts.diagonal).reverse();
      const pushed: number[] = [];
      for (const nb of nbs) {
        if (visited[nb.i]) continue;
        parent[nb.i] = u;
        stack.push(nb.i);
        pushed.push(nb.i);
      }
      if (pushed.length) yield { frontier: pushed, line: 9, variables: { u: label(t, u), pushed: pushed.length, '|S|': stack.length } };
      yield { visited: [u], line: 3, variables: { u: label(t, u), '|S|': stack.length } };
    }
    yield { line: 10, variables: { result: 'no path' } };
  },
};
