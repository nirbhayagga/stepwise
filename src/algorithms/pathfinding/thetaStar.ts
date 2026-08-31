import type { PathfindingAlgorithm } from './types';
import { MinHeap, passable, idx, rowOf, colOf, label } from './grid';

/**
 * Basic Theta* (Daniel, Nash, Koenig & Felner 2010): A* on an 8-connected
 * grid where a vertex may take its parent's parent as predecessor whenever
 * there is line of sight, so paths follow straight lines at any angle.
 * Uniform cost — weighted cells are treated as ordinary passable cells.
 */
export const thetaStar: PathfindingAlgorithm = {
  id: 'theta',
  name: 'Theta* (any-angle)',
  summary: 'A* variant that shortcuts to a grandparent whenever line of sight exists, producing any-angle paths shorter than the best 8-connected grid path. Uniform cost.',
  complexity: { time: { worst: 'O(E log V · L)' }, space: 'O(V)', tags: ['Any-angle', 'Complete', 'Near-optimal', 'Uniform cost only'] },
  weighted: false,
  diagonal: 'always',
  pseudocode: [
    'procedure ThetaStar(G, s, t)',                                    // 1
    '  g[s] ← 0; parent[s] ← s; Q.push(s, h(s))',                      // 2
    '  while Q not empty',                                             // 3
    '    u ← Q.pop-min()',                                             // 4
    '    if u = t then return path(t)',                                // 5
    '    for each neighbour v of u',                                   // 6
    '      if LineOfSight(parent[u], v) then                ▷ path 2', // 7
    '        relax v via parent[u] with straight-line cost',           // 8
    '      else                                             ▷ path 1', // 9
    '        relax v via u',                                           // 10
    '  return no path',                                                // 11
  ],
  *run(t, start, target) {
    const n = t.rows * t.cols;
    const g = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const q = new MinHeap();
    const euclid = (a: number, b: number) => Math.hypot(rowOf(t, a) - rowOf(t, b), colOf(t, a) - colOf(t, b));
    const W = (r: number, c: number) => passable(t, r, c);

    /** Line of sight between cell centres; corners may not be squeezed through. */
    const lineOfSight = (a: number, b: number): boolean => {
      let r0 = rowOf(t, a), c0 = colOf(t, a);
      const r1 = rowOf(t, b), c1 = colOf(t, b);
      const dr = Math.abs(r1 - r0), dc = Math.abs(c1 - c0);
      const sr = r0 < r1 ? 1 : -1, sc = c0 < c1 ? 1 : -1;
      let err = dc - dr;
      for (;;) {
        if (!W(r0, c0)) return false;
        if (r0 === r1 && c0 === c1) return true;
        const e2 = 2 * err;
        if (e2 === 0 && dr && dc) {
          // Exactly through a corner: both adjacent cells must be open.
          if (!W(r0, c0 + sc) || !W(r0 + sr, c0)) return false;
          err += dc - dr; r0 += sr; c0 += sc;
        } else if (e2 > -dr) {
          err -= dr; c0 += sc;
        } else {
          err += dc; r0 += sr;
        }
      }
    };

    g[start] = 0;
    parent[start] = start;
    q.push(start, euclid(start, target));
    yield { frontier: [start], line: 2, variables: { s: label(t, start) } };

    while (q.size) {
      const { item: u, key } = q.pop()!;
      if (closed[u] || key > g[u] + euclid(u, target) + 1e-9) continue;
      closed[u] = 1;
      yield { visiting: [u], line: 4, variables: { u: label(t, u), g: g[u], 'parent[u]': parent[u] >= 0 ? label(t, parent[u]) : '—' } };
      if (u === target) {
        const waypoints: number[] = [];
        for (let c = u; ; c = parent[c]) { waypoints.push(c); if (parent[c] === c) break; }
        waypoints.reverse();
        yield { visited: [u], line: 5, variables: { waypoints: waypoints.length, 'g[t]': g[u] } };
        // Trace each straight segment through the cells it crosses.
        let cost = 0, edges = 0;
        yield { path: [waypoints[0]], cost: 0, line: 5, variables: { waypoints: waypoints.length } };
        for (let w = 1; w < waypoints.length; w++) {
          cost += euclid(waypoints[w - 1], waypoints[w]);
          let r0 = rowOf(t, waypoints[w - 1]), c0 = colOf(t, waypoints[w - 1]);
          const r1 = rowOf(t, waypoints[w]), c1 = colOf(t, waypoints[w]);
          const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
          const cells: number[] = [];
          for (let sIdx = 1; sIdx <= steps; sIdx++) {
            const rr = Math.round(r0 + ((r1 - r0) * sIdx) / steps);
            const cc = Math.round(c0 + ((c1 - c0) * sIdx) / steps);
            const cell = idx(t, rr, cc);
            if (cells[cells.length - 1] !== cell) cells.push(cell);
          }
          for (const cell of cells) { edges++; yield { path: [cell], cost, line: 5, variables: { segment: w, 'g[t]': g[u], edges } }; }
        }
        return;
      }
      const r = rowOf(t, u), c = colOf(t, u);
      for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (!W(nr, nc)) continue;
        if (dr !== 0 && dc !== 0 && (!W(r + dr, c) || !W(r, c + dc))) continue;
        const v = idx(t, nr, nc);
        if (closed[v]) continue;
        const p = parent[u];
        let via: number, cand: number, usedLos = false;
        if (p >= 0 && lineOfSight(p, v)) {
          via = p; cand = g[p] + euclid(p, v); usedLos = true;
        } else {
          via = u; cand = g[u] + euclid(u, v);
        }
        if (cand < g[v]) {
          g[v] = cand;
          parent[v] = via;
          q.push(v, cand + euclid(v, target));
          yield { frontier: [v], line: usedLos ? 8 : 10, variables: { u: label(t, u), v: label(t, v), via: label(t, via), 'line of sight': usedLos, 'g[v]': cand } };
        }
      }
      yield { visited: [u], line: 3, variables: { u: label(t, u), '|Q|': q.size } };
    }
    yield { line: 11, variables: { result: 'no path' } };
  },
};
