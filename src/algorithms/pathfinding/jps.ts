import type { PathfindingAlgorithm } from './types';
import { MinHeap, passable, idx, rowOf, colOf, heuristic, label, pathCosts, SQRT2 } from './grid';

/**
 * Jump Point Search (Harabor & Grastien 2011) on an 8-connected uniform-cost
 * grid, in the "diagonal only if no obstacles" variant so it never cuts wall
 * corners. Weighted cells are treated as ordinary passable cells.
 */
export const jps: PathfindingAlgorithm = {
  id: 'jps',
  name: 'Jump Point Search',
  summary: 'A* that skips symmetric grid paths by jumping straight along a direction until a forced neighbour or the target appears; expands far fewer nodes on open uniform-cost grids.',
  complexity: { time: { worst: 'O(E log V)' }, space: 'O(V)', tags: ['Optimal', 'Complete', 'Uniform cost only', '8-connected'] },
  weighted: false,
  diagonal: 'always',
  pseudocode: [
    'procedure JPS(G, s, t)',                                        // 1
    '  Q ← min-priority queue keyed by f = g + h; Q.push(s)',        // 2
    '  while Q not empty',                                           // 3
    '    u ← Q.pop-min(); mark u closed',                            // 4
    '    if u = t then return path(t)',                              // 5
    '    for each pruned neighbour direction d of u',                // 6
    '      j ← Jump(u, d)',                                          // 7
    '      if j exists and j not closed then',                       // 8
    '        g′ ← g[u] + dist(u, j)',                                // 9
    '        if g′ < g[j] then g[j] ← g′; parent[j] ← u; Q.push(j)', // 10
    'procedure Jump(x, d)',                                          // 11
    '  n ← x + d; if n blocked then return none',                    // 12
    '  if n = t or n has a forced neighbour then return n',          // 13
    '  if d diagonal and Jump(n, horizontal) or Jump(n, vertical) then return n', // 14
    '  return Jump(n, d)',                                           // 15
  ],
  *run(t, start, target) {
    const n = t.rows * t.cols;
    const g = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const q = new MinHeap();
    const tr = rowOf(t, target), tc = colOf(t, target);
    const W = (r: number, c: number) => passable(t, r, c);
    const h = (i: number) => heuristic(t, i, target, true);
    const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);

    const jump = (r: number, c: number, dr: number, dc: number): number | null => {
      r += dr; c += dc;
      if (!W(r, c)) return null;
      if (r === tr && c === tc) return idx(t, r, c);
      if (dr !== 0 && dc !== 0) {
        if (jump(r, c, dr, 0) !== null || jump(r, c, 0, dc) !== null) return idx(t, r, c);
      } else if (dr !== 0) {
        if ((W(r, c - 1) && !W(r - dr, c - 1)) || (W(r, c + 1) && !W(r - dr, c + 1))) return idx(t, r, c);
      } else {
        if ((W(r - 1, c) && !W(r - 1, c - dc)) || (W(r + 1, c) && !W(r + 1, c - dc))) return idx(t, r, c);
      }
      if (W(r + dr, c) && W(r, c + dc)) return jump(r, c, dr, dc);
      return null;
    };

    const prunedDirections = (u: number): [number, number][] => {
      const r = rowOf(t, u), c = colOf(t, u);
      const p = parent[u];
      const dirs: [number, number][] = [];
      if (p === -1) {
        for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) if (W(r + dr, c + dc)) dirs.push([dr, dc]);
        for (const [dr, dc] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
          if (W(r + dr, c + dc) && W(r + dr, c) && W(r, c + dc)) dirs.push([dr, dc]);
        }
        return dirs;
      }
      const dr = sgn(r - rowOf(t, p)), dc = sgn(c - colOf(t, p));
      if (dr !== 0 && dc !== 0) {
        const v = W(r + dr, c), hz = W(r, c + dc);
        if (v) dirs.push([dr, 0]);
        if (hz) dirs.push([0, dc]);
        if (v && hz && W(r + dr, c + dc)) dirs.push([dr, dc]);
      } else if (dr !== 0) {
        const next = W(r + dr, c), left = W(r, c - 1), right = W(r, c + 1);
        if (next) {
          dirs.push([dr, 0]);
          if (left && W(r + dr, c - 1)) dirs.push([dr, -1]);
          if (right && W(r + dr, c + 1)) dirs.push([dr, 1]);
        }
        if (left) dirs.push([0, -1]);
        if (right) dirs.push([0, 1]);
      } else {
        const next = W(r, c + dc), up = W(r - 1, c), down = W(r + 1, c);
        if (next) {
          dirs.push([0, dc]);
          if (up && W(r - 1, c + dc)) dirs.push([-1, dc]);
          if (down && W(r + 1, c + dc)) dirs.push([1, dc]);
        }
        if (up) dirs.push([-1, 0]);
        if (down) dirs.push([1, 0]);
      }
      return dirs;
    };

    const dist = (a: number, b: number) => {
      const dr = Math.abs(rowOf(t, a) - rowOf(t, b)), dc = Math.abs(colOf(t, a) - colOf(t, b));
      return Math.max(dr, dc) + (SQRT2 - 1) * Math.min(dr, dc);
    };

    /** Expand the jump-point path into every grid cell it crosses. */
    const expand = (jumpPoints: number[]): number[] => {
      const out: number[] = [];
      for (let k = 0; k < jumpPoints.length; k++) {
        if (k === 0) { out.push(jumpPoints[0]); continue; }
        let r = rowOf(t, jumpPoints[k - 1]), c = colOf(t, jumpPoints[k - 1]);
        const r2 = rowOf(t, jumpPoints[k]), c2 = colOf(t, jumpPoints[k]);
        const dr = sgn(r2 - r), dc = sgn(c2 - c);
        while (r !== r2 || c !== c2) { r += dr; c += dc; out.push(idx(t, r, c)); }
      }
      return out;
    };

    g[start] = 0;
    q.push(start, h(start));
    yield { frontier: [start], line: 2, variables: { s: label(t, start) } };

    while (q.size) {
      const { item: u, key: f } = q.pop()!;
      if (closed[u]) continue;
      closed[u] = 1;
      yield { visiting: [u], line: 4, variables: { u: label(t, u), g: g[u], f } };
      if (u === target) {
        const jumps: number[] = [];
        for (let cur = target; cur !== -1; cur = parent[cur]) jumps.push(cur);
        jumps.reverse();
        const path = expand(jumps);
        const costs = pathCosts(t, path, false);
        yield { visited: [u], line: 5, variables: { 'jump points': jumps.length, 'g[t]': g[u] } };
        for (let k = 0; k < path.length; k++) {
          yield { path: [path[k]], cost: costs[k], line: 5, variables: { edges: k, 'jump points': jumps.length } };
        }
        return;
      }
      const r = rowOf(t, u), c = colOf(t, u);
      for (const [dr, dc] of prunedDirections(u)) {
        const j = jump(r, c, dr, dc);
        if (j === null || closed[j]) continue;
        const ng = g[u] + dist(u, j);
        if (ng < g[j]) {
          g[j] = ng;
          parent[j] = u;
          q.push(j, ng + h(j));
          yield { frontier: [j], line: 10, variables: { u: label(t, u), direction: `(${dr}, ${dc})`, j: label(t, j), 'g[j]': ng, 'f[j]': ng + h(j) } };
        }
      }
      yield { visited: [u], line: 3, variables: { u: label(t, u), '|Q|': q.size } };
    }
    yield { line: 3, variables: { result: 'no path' } };
  },
};
