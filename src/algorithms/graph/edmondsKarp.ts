import type { GraphAlgorithm } from './types';
import { GNODE, GEDGE } from './types';

export const edmondsKarp: GraphAlgorithm = {
  id: 'edmonds-karp',
  name: 'Edmonds–Karp Max-Flow',
  summary: 'Ford–Fulkerson with BFS: repeatedly find the shortest augmenting path in the residual graph and push its bottleneck capacity. Edge weights act as capacities; source is the leftmost vertex, sink the rightmost. Edge labels show flow/capacity.',
  complexity: { time: { worst: 'O(V·E²)' }, space: 'O(V + E)', tags: ['Max-flow', 'BFS augmenting paths', 'Residual graph'] },
  kind: 'dag', weighted: true, usesSource: false,
  pseudocode: [
    'procedure EdmondsKarp(G, s, t)',                              // 1
    '  f(e) ← 0 for every edge',                                   // 2
    '  loop',                                                      // 3
    '    BFS the residual graph for an s→t path P',                // 4
    '    if no path then break',                                   // 5
    '    b ← min residual capacity along P',                       // 6
    '    augment: f += b forward, f −= b on used back-edges',      // 7
    '  return |f| = total flow out of s',                          // 8
  ],
  *run(g) {
    const n = g.nodes.length;
    const s = 0, t = n - 1;
    const flow = new Array<number>(g.edges.length).fill(0);
    const labelAll = () => Object.fromEntries(g.edges.map(e => [e.id, `${flow[e.id]}/${e.w}`]));
    let total = 0, iteration = 0;
    yield { edgeLabels: labelAll(), labels: { [s]: 's', [t]: 't' }, nodes: [[s, GNODE.result], [t, GNODE.result]], line: 2, variables: { source: s, sink: t } };

    for (;;) {
      iteration++;
      // Reset transient node states, keep s/t marked.
      yield { nodes: g.nodes.map(v => [v.id, v.id === s || v.id === t ? GNODE.result : GNODE.default] as [number, number]), line: 4, variables: { iteration, 'total flow': total } };
      // BFS on the residual graph. prev[v] = [edgeId, forward?]
      const prev = new Array<[number, boolean] | null>(n).fill(null);
      const seen = new Uint8Array(n);
      seen[s] = 1;
      const queue = [s];
      let head = 0, reached = false;
      while (head < queue.length && !reached) {
        const u = queue[head++];
        yield { nodes: [[u, u === s ? GNODE.result : GNODE.current]], line: 4, variables: { iteration, expanding: u } };
        for (const e of g.edges) {
          let v = -1, forward = true;
          if (e.u === u && flow[e.id] < e.w) { v = e.v; forward = true; }
          else if (e.v === u && flow[e.id] > 0) { v = e.u; forward = false; }
          if (v === -1 || seen[v]) continue;
          seen[v] = 1;
          prev[v] = [e.id, forward];
          queue.push(v);
          yield { nodes: [[v, GNODE.frontier]], edges: [[e.id, GEDGE.active]], line: 4, variables: { iteration, from: u, to: v, residual: forward ? e.w - flow[e.id] : flow[e.id], direction: forward ? 'forward' : 'backward' } };
          if (v === t) { reached = true; break; }
        }
      }
      if (!reached) {
        yield { edges: g.edges.map(e => [e.id, flow[e.id] > 0 ? GEDGE.tree : GEDGE.default] as [number, number]), line: 5, variables: { iterations: iteration, 'max flow': total } };
        break;
      }
      // Bottleneck along the path.
      const pathEdges: [number, boolean][] = [];
      let b = Infinity;
      for (let v = t; v !== s;) {
        const [eid, fwd] = prev[v]!;
        const e = g.edges[eid];
        pathEdges.push([eid, fwd]);
        b = Math.min(b, fwd ? e.w - flow[eid] : flow[eid]);
        v = fwd ? e.u : e.v;
      }
      pathEdges.reverse();
      yield { edges: pathEdges.map(([id]) => [id, GEDGE.tree] as [number, number]), line: 6, variables: { iteration, bottleneck: b } };
      for (const [eid, fwd] of pathEdges) flow[eid] += fwd ? b : -b;
      total += b;
      yield { edgeLabels: labelAll(), line: 7, variables: { iteration, pushed: b, 'total flow': total } };
      yield { edges: pathEdges.map(([id]) => [id, GEDGE.default] as [number, number]), line: 3, variables: { 'total flow': total } };
    }
    yield { line: 8, variables: { 'max flow': total, iterations: iteration } };
  },
};
