/**
 * Algorithm invariants. Pure Node tests (no browser): every generator is run
 * to completion through its frame builder and the final frame is checked
 * against an independent reference.
 */
import { test, expect } from '@playwright/test';
import { SORTING_LIST, buildSortFrames, SORT_STATE } from '../src/algorithms/sorting';
import { PATHFINDING_LIST, MAZES, buildPathFrames, resolveDiagonal, CELL, NODE_STATE, idx } from '../src/algorithms/pathfinding';
import type { Terrain } from '../src/algorithms/pathfinding';
import { DP_LIST, buildDPFrames } from '../src/algorithms/dp';
import { TREE_LIST, buildTreeFrames } from '../src/algorithms/tree';
import type { TreeNode } from '../src/algorithms/tree';
import { GRAPH_LIST, generateGraph, buildGraphFrames, GEDGE } from '../src/algorithms/graph';
import { defaultInputs, parseInputs } from '../src/engine/types';
import type { AlgorithmMeta } from '../src/engine/types';
import { mulberry32 } from '../src/engine/random';

const linesInRange = (meta: AlgorithmMeta, frames: { line: number }[]) => {
  for (const f of frames) expect(f.line, `${meta.id}: line ${f.line} outside 1..${meta.pseudocode.length}`).toBeLessThanOrEqual(meta.pseudocode.length);
};

test.describe('sorting', () => {
  for (const algo of SORTING_LIST) {
    test(`${algo.id} sorts and traces valid lines`, () => {
      for (const n of [0, 1, 2, 7, 60]) {
        const rnd = mulberry32(n * 7 + 1);
        const input = Array.from({ length: n }, () => 5 + Math.floor(rnd() * 96));
        const effective = algo.cap !== undefined ? input.slice(0, algo.cap) : input;
        const frames = buildSortFrames(algo, input);
        const last = frames[frames.length - 1];
        expect(Array.from(last.values)).toEqual(effective.slice().sort((a, b) => a - b));
        expect(Array.from(last.states).every(s => s === SORT_STATE.sorted)).toBe(true);
        for (const f of frames) expect(f.values.length).toBe(effective.length);
        linesInRange(algo, frames);
      }
    });
  }
});

test.describe('pathfinding', () => {
  const terrain = (rows: number, cols: number): Terrain => ({ rows, cols, cells: new Uint8Array(rows * cols) });
  const endpoints = (t: Terrain) => {
    const empties: number[] = [];
    t.cells.forEach((c, i) => { if (c !== CELL.wall) empties.push(i); });
    return [empties[0], empties[empties.length - 1]] as const;
  };

  for (const maze of MAZES) {
    test(`maze ${maze.id} has the right shape`, () => {
      const t = terrain(21, 41);
      const cells = maze.generate(t, mulberry32(3));
      expect(cells.length).toBe(21 * 41);
      expect(cells.some(c => c === CELL.wall)).toBe(true);
    });
  }

  for (const diagonal of [false, true]) {
    test(`all searches agree on a perfect maze (diagonal=${diagonal})`, () => {
      for (const seed of [1, 2, 3]) {
        const t = terrain(21, 41);
        t.cells = MAZES[seed % 2 === 0 ? 2 : 3].generate(t, mulberry32(seed));
        const [s, g] = endpoints(t);
        const dij = buildPathFrames(PATHFINDING_LIST.find(a => a.id === 'dijkstra')!, t, s, g, { diagonal });
        const optimal = dij[dij.length - 1].pathCost;
        expect(optimal).toBeGreaterThan(0);
        for (const algo of PATHFINDING_LIST) {
          const diag = resolveDiagonal(algo, diagonal);
          const frames = buildPathFrames(algo, t, s, g, { diagonal: diag });
          linesInRange(algo, frames);
          const last = frames[frames.length - 1];
          expect(last.pathLength, `${algo.id} found no path`).toBeGreaterThan(0);
          expect(last.states[s]).toBe(NODE_STATE.path);
          expect(last.states[g]).toBe(NODE_STATE.path);
          expect(Array.from(last.states).filter(v => v === NODE_STATE.path).length).toBe(last.pathLength + 1);
          if (algo.id === 'astar' || (algo.id === 'jps' && diagonal)) expect(last.pathCost).toBeCloseTo(optimal, 6);
          if (algo.id === 'bidir' || algo.id === 'bfs') expect(last.pathLength).toBe(dij[dij.length - 1].pathLength);
        }
      }
    });
  }

  test('dijkstra detours around weighted cells when cheaper', () => {
    const t = terrain(5, 9);
    for (let c = 1; c < 8; c++) t.cells[idx(t, 2, c)] = CELL.weight;
    const frames = buildPathFrames(PATHFINDING_LIST.find(a => a.id === 'dijkstra')!, t, idx(t, 2, 0), idx(t, 2, 8), { diagonal: false });
    const last = frames[frames.length - 1];
    expect(last.pathCost).toBeLessThan(8 * 5);
    expect(last.states[idx(t, 2, 4)]).not.toBe(NODE_STATE.path);
  });

  test('searches report no path when the target is walled off', () => {
    const t = terrain(5, 5);
    for (let r = 0; r < 5; r++) t.cells[idx(t, r, 2)] = CELL.wall;
    for (const algo of PATHFINDING_LIST) {
      const frames = buildPathFrames(algo, t, idx(t, 2, 0), idx(t, 2, 4), { diagonal: resolveDiagonal(algo, true) });
      expect(frames[frames.length - 1].pathLength, algo.id).toBe(0);
    }
  });
});

test.describe('dynamic programming', () => {
  const expected: Record<string, number> = { knapsack: 9, lcs: 4, 'edit-distance': 3, 'coin-change': 3, lis: 4, 'matrix-chain': 15125, 'floyd-warshall': 6 };
  for (const algo of DP_LIST) {
    test(`${algo.id} computes the reference answer for its default input`, () => {
      const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      const table = algo.setup(parsed.data);
      expect('error' in table).toBe(false);
      if ('error' in table) return;
      const frames = buildDPFrames(algo, table);
      linesInRange(algo, frames);
      const last = frames[frames.length - 1];
      expect(Number(last.variables.result)).toBe(expected[algo.id]);
      expect(last.values.length).toBe(table.rows * table.cols);
    });
  }
  test('inputs are validated', () => {
    const algo = DP_LIST[0];
    expect(parseInputs(algo.inputs, { weights: '1, x', values: '1', capacity: '5' }).ok).toBe(false);
    expect(parseInputs(algo.inputs, { weights: '1', values: '1', capacity: '999' }).ok).toBe(false);
  });
});

test.describe('trees', () => {
  const inorder = (n: TreeNode | null, out: number[] = []): number[] => { if (n) { inorder(n.left, out); out.push(n.key); inorder(n.right, out); } return out; };
  const height = (n: TreeNode | null): number => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);
  const avlOk = (n: TreeNode | null): boolean => !n || (Math.abs(height(n.left) - height(n.right)) <= 1 && avlOk(n.left) && avlOk(n.right));
  const blackHeight = (n: TreeNode | null): number => {
    if (!n) return 1;
    if (n.color === 'red' && (n.left?.color === 'red' || n.right?.color === 'red')) return -1;
    const l = blackHeight(n.left), r = blackHeight(n.right);
    return l < 0 || r < 0 || l !== r ? -1 : l + (n.color === 'black' ? 1 : 0);
  };
  const heapOk = (n: TreeNode | null): boolean => !n || ((!n.left || n.left.key <= n.key) && (!n.right || n.right.key <= n.key) && heapOk(n.left) && heapOk(n.right));
  const keys = Array.from({ length: 31 }, (_, i) => ((i * 17) % 31) + 1);
  const sorted = keys.slice().sort((a, b) => a - b);

  for (const algo of TREE_LIST) {
    test(`${algo.id} keeps its invariants`, () => {
      const parsed = parseInputs(algo.inputs, { ...defaultInputs(algo.inputs), keys: keys.join(', ') });
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      const r = algo.setup(parsed.data);
      expect('error' in r).toBe(false);
      if ('error' in r) return;
      const frames = buildTreeFrames(algo, r);
      linesInRange(algo, frames);
      const last = frames[frames.length - 1];
      switch (algo.id) {
        case 'bst': expect(inorder(last.root)).toEqual(sorted); break;
        case 'avl': expect(inorder(last.root)).toEqual(sorted); expect(avlOk(last.root)).toBe(true); expect(height(last.root)).toBeLessThanOrEqual(7); break;
        case 'red-black': expect(inorder(last.root)).toEqual(sorted); expect(last.root?.color).toBe('black'); expect(blackHeight(last.root)).toBeGreaterThan(0); break;
        case 'bst-delete': expect(inorder(last.root)).toEqual(sorted.filter(k => ![20, 30, 50].includes(k))); break;
        case 'heap-insert': expect(heapOk(last.root)).toBe(true); break;
        case 'heap-extract': expect(last.output).toEqual(sorted.slice().reverse()); break;
        case 'inorder': expect(last.output).toEqual(sorted); break;
        case 'preorder': case 'postorder': case 'levelorder': expect(last.output.slice().sort((a, b) => a - b)).toEqual(sorted); break;
      }
    });
  }
});

test.describe('graphs', () => {
  for (const seed of [1, 2, 3]) {
    test(`seed ${seed}: generated graph is connected and algorithms agree`, () => {
      const g = generateGraph(12, 0.5, seed, 'undirected');
      expect(g.nodes.length).toBe(12);
      const adj = g.nodes.map(() => [] as number[]);
      g.edges.forEach(e => { adj[e.u].push(e.v); adj[e.v].push(e.u); });
      const seen = new Set([0]); const stack = [0];
      while (stack.length) { const u = stack.pop()!; for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); stack.push(v); } }
      expect(seen.size).toBe(12);

      const weights: Record<string, number> = {};
      for (const algo of GRAPH_LIST) {
        const gg = algo.kind === 'undirected' ? g : generateGraph(12, 0.5, seed, algo.kind);
        const frames = buildGraphFrames(algo, gg, 0);
        linesInRange(algo, frames);
        const last = frames[frames.length - 1];
        const treeEdges = Array.from(last.edgeStates).filter(s => s === GEDGE.tree).length;
        if (algo.id === 'prim' || algo.id === 'kruskal') { expect(treeEdges).toBe(11); weights[algo.id] = Number(last.variables['weight(T)']); }
        if (algo.id === 'bfs' || algo.id === 'dfs') expect(last.output.length).toBe(12);
        if (algo.id === 'topo') {
          expect(last.output.length).toBe(12);
          const pos = new Map(last.output.map((v, i) => [v, i]));
          for (const e of gg.edges) expect(pos.get(e.u)!).toBeLessThan(pos.get(e.v)!);
        }
        if (algo.id === 'bellman-ford') {
          const dist = new Array(12).fill(Infinity); dist[0] = 0;
          for (let k = 0; k < 12; k++) for (const e of gg.edges) if (dist[e.u] + e.w < dist[e.v]) dist[e.v] = dist[e.u] + e.w;
          const got = (last.variables.dist as string[]).map(v => (v === '∞' ? Infinity : Number(v)));
          expect(got).toEqual(dist);
          expect(last.variables['negative cycle']).toBe(false);
        }
        if (algo.id === 'tarjan') {
          // Reference: Kosaraju.
          const n2 = gg.nodes.length;
          const fwd = gg.nodes.map(() => [] as number[]), rev = gg.nodes.map(() => [] as number[]);
          gg.edges.forEach(e => { fwd[e.u].push(e.v); rev[e.v].push(e.u); });
          const order: number[] = []; const seen1 = new Uint8Array(n2);
          const dfs1 = (u: number) => { seen1[u] = 1; for (const v of fwd[u]) if (!seen1[v]) dfs1(v); order.push(u); };
          for (let u = 0; u < n2; u++) if (!seen1[u]) dfs1(u);
          const compRef = new Int32Array(n2).fill(-1); let cRef = 0;
          const dfs2 = (u: number, c: number) => { compRef[u] = c; for (const v of rev[u]) if (compRef[v] === -1) dfs2(v, c); };
          for (const u of order.slice().reverse()) if (compRef[u] === -1) dfs2(u, cRef++);
          // Extract Tarjan's components from the recorded variables.
          const members = new Map<number, number>();
          for (const f of frames) for (const k of Object.keys(f.variables)) {
            if (/^C\d+$/.test(k)) for (const m of f.variables[k] as number[]) members.set(m, Number(k.slice(1)));
          }
          expect(members.size).toBe(n2);
          for (const e of gg.edges) {
            expect(members.get(e.u) !== undefined).toBe(true);
            expect((members.get(e.u) === members.get(e.v))).toBe(compRef[e.u] === compRef[e.v]);
          }
        }
        if (algo.id === 'edmonds-karp') {
          // Reference max-flow (BFS augmenting on a capacity matrix).
          const n2 = gg.nodes.length;
          const cap = Array.from({ length: n2 }, () => new Array<number>(n2).fill(0));
          for (const e of gg.edges) cap[e.u][e.v] += e.w;
          let flowRef = 0;
          for (;;) {
            const prev = new Array<number>(n2).fill(-1); prev[0] = 0;
            const q = [0];
            while (q.length) { const u = q.shift()!; for (let v = 0; v < n2; v++) if (prev[v] === -1 && cap[u][v] > 0) { prev[v] = u; q.push(v); } }
            if (prev[n2 - 1] === -1) break;
            let b = Infinity;
            for (let v = n2 - 1; v !== 0; v = prev[v]) b = Math.min(b, cap[prev[v]][v]);
            for (let v = n2 - 1; v !== 0; v = prev[v]) { cap[prev[v]][v] -= b; cap[v][prev[v]] += b; }
            flowRef += b;
          }
          expect(Number(last.variables['max flow'])).toBe(flowRef);
        }
        if (algo.id === 'dijkstra') {
          const dist = new Array(12).fill(Infinity); dist[0] = 0;
          for (let k = 0; k < 12; k++) for (const e of g.edges) { dist[e.v] = Math.min(dist[e.v], dist[e.u] + e.w); dist[e.u] = Math.min(dist[e.u], dist[e.v] + e.w); }
          expect((last.variables.dist as string[]).map(Number)).toEqual(dist);
        }
      }
      expect(weights.prim).toBe(weights.kruskal);
    });
  }
});

// ---------------------------------------------------------------------------
import { STRING_LIST, buildStringFrames } from '../src/algorithms/strings';
import { HASH_LIST, buildHashFrames } from '../src/algorithms/hashing';
import { GEOMETRY_LIST, generatePoints, buildGeoFrames, GPT, cross as geoCross, dist as geoDist } from '../src/algorithms/geometry';
import type { GeoPoint } from '../src/algorithms/geometry';
import { BACKTRACKING, buildBoardFrames as buildBT } from '../src/algorithms/backtracking';
import { NUMBERS } from '../src/algorithms/numbers';

test.describe('strings', () => {
  const cases: [string, string][] = [
    ['ABABDABACDABABCABABCABAB', 'ABABC'],
    ['AAAAAAAA', 'AAA'],
    ['ABCABCABC', 'XYZ'],
    ['MISSISSIPPI', 'ISSI'],
  ];
  for (const algo of STRING_LIST) {
    test(`${algo.id} finds every occurrence`, () => {
      for (const [text, pattern] of cases) {
        const parsed = parseInputs(algo.inputs, { text, pattern });
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) continue;
        const setup = algo.setup(parsed.data);
        expect('error' in setup).toBe(false);
        if ('error' in setup) continue;
        const frames = buildStringFrames(algo, setup);
        linesInRange(algo, frames);
        const reference: number[] = [];
        for (let i = 0; i + pattern.length <= text.length; i++) if (text.startsWith(pattern, i)) reference.push(i);
        const got = frames[frames.length - 1].found.slice().sort((a, b) => a - b);
        const expected = algo.id === 'z-algorithm' ? reference.map(i => i + pattern.length + 1) : reference;
        expect(got, `${algo.id} on "${text}"/"${pattern}"`).toEqual(expected.sort((a, b) => a - b));
      }
    });
  }
});

test.describe('hashing', () => {
  for (const algo of HASH_LIST) {
    test(`${algo.id} stores every key exactly once and searches correctly`, () => {
      const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      const setup = algo.setup(parsed.data);
      expect('error' in setup).toBe(false);
      if ('error' in setup) return;
      const frames = buildHashFrames(algo, setup);
      linesInRange(algo, frames);
      const last = frames[frames.length - 1];
      const stored = last.slots.flat().sort((a, b) => a - b);
      expect(stored).toEqual([18, 22, 31, 32, 41, 44, 59, 73]);
      if (algo.id !== 'chaining') for (const slot of last.slots) expect(slot.length).toBeLessThanOrEqual(1);
      const results = new Map<number, boolean>();
      for (const f of frames) {
        const k = f.variables.searching ?? f.variables.key;
        if (typeof f.variables.found === 'boolean' && typeof k === 'number') results.set(k, f.variables.found);
      }
      expect(results.get(44)).toBe(true);
      expect(results.get(32)).toBe(true);
      expect(results.get(99)).toBe(false);
    });
  }
});

test.describe('geometry', () => {
  const hullReference = (pts: GeoPoint[]): Set<number> => {
    const s = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const half = (list: GeoPoint[]) => {
      const out: GeoPoint[] = [];
      for (const p of list) {
        while (out.length >= 2 && geoCross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
        out.push(p);
      }
      return out;
    };
    const lower = half(s), upper = half(s.slice().reverse());
    return new Set([...lower.slice(0, -1), ...upper.slice(0, -1)].map(p => p.id));
  };
  for (const seed of [1, 2, 3]) {
    test(`seed ${seed}: hulls agree with reference, closest pair with brute force`, () => {
      const pts = generatePoints(16, seed);
      const ref = hullReference(pts);
      for (const algo of GEOMETRY_LIST) {
        const frames = buildGeoFrames(algo, pts);
        linesInRange(algo, frames);
        const last = frames[frames.length - 1];
        if (algo.id === 'graham' || algo.id === 'jarvis') {
          const hull = new Set<number>();
          last.pointStates.forEach((s, id) => { if (s === GPT.hull) hull.add(id); });
          expect([...hull].sort((a, b) => a - b), algo.id).toEqual([...ref].sort((a, b) => a - b));
        }
        if (algo.id === 'closest-pair') {
          let best = Infinity;
          for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) best = Math.min(best, geoDist(pts[i], pts[j]));
          expect(Number(last.variables.distance)).toBeCloseTo(best, 9);
        }
      }
    });
  }
});

test.describe('board (backtracking, numbers)', () => {
  test('n-queens solution is valid for several sizes', () => {
    for (const n of [4, 6, 8]) {
      const algo = BACKTRACKING['n-queens'];
      const parsed = parseInputs(algo.inputs, { n: String(n) });
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      const setup = algo.setup(parsed.data);
      if ('error' in setup) { expect(false).toBe(true); continue; }
      const frames = buildBT(algo, setup);
      linesInRange(algo, frames);
      const last = frames[frames.length - 1];
      const queens: [number, number][] = [];
      last.cells.forEach((c, i) => { if (c === '♛') queens.push([Math.floor(i / n), i % n]); });
      expect(queens.length).toBe(n);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const [r1, c1] = queens[i], [r2, c2] = queens[j];
        expect(r1 !== r2 && c1 !== c2 && Math.abs(r1 - r2) !== Math.abs(c1 - c2), `n=${n}`).toBe(true);
      }
    }
  });
  test('sudoku default puzzle is solved and respects the givens', () => {
    const algo = BACKTRACKING['sudoku'];
    const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const setup = algo.setup(parsed.data);
    if ('error' in setup) { expect(false).toBe(true); return; }
    const frames = buildBT(algo, setup);
    const last = frames[frames.length - 1];
    expect(last.variables.solved).toBe(true);
    const grid = last.cells.map(Number);
    const givens = defaultInputs(algo.inputs).puzzle;
    for (let i = 0; i < 81; i++) if (givens[i] !== '.') expect(grid[i]).toBe(Number(givens[i]));
    const seen = (vals: number[]) => new Set(vals).size === 9 && vals.every(v => v >= 1 && v <= 9);
    for (let r = 0; r < 9; r++) expect(seen(grid.slice(r * 9, r * 9 + 9))).toBe(true);
    for (let c = 0; c < 9; c++) expect(seen(Array.from({ length: 9 }, (_, r) => grid[r * 9 + c]))).toBe(true);
    expect(frames.length).toBeLessThan(60000);
  });
  test('sieve marks exactly the primes', () => {
    const algo = NUMBERS['sieve'];
    const parsed = parseInputs(algo.inputs, { n: '120' });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const setup = algo.setup(parsed.data);
    if ('error' in setup) { expect(false).toBe(true); return; }
    const frames = buildBT(algo, setup);
    linesInRange(algo, frames);
    const last = frames[frames.length - 1];
    const isPrime = (v: number) => { if (v < 2) return false; for (let d = 2; d * d <= v; d++) if (v % d === 0) return false; return true; };
    for (let v = 1; v <= 120; v++) {
      const placed = last.states[v - 1] === 2; // BOARD_STATE.placed
      expect(placed, `value ${v}`).toBe(isPrime(v));
    }
  });
});

test.describe('new sorting, pathfinding, tree and graph entries', () => {
  test('bidirectional dijkstra matches dijkstra cost on weighted terrain', () => {
    for (const seed of [1, 2, 3]) {
      const t = { rows: 21, cols: 41, cells: new Uint8Array(21 * 41) };
      t.cells = MAZES[1].generate(t, mulberry32(seed)); // random weights maze
      const empties: number[] = []; t.cells.forEach((c, i) => { if (c !== CELL.wall) empties.push(i); });
      const s = empties[0], g = empties[empties.length - 1];
      for (const diagonal of [false, true]) {
        const dij = buildPathFrames(PATHFINDING_LIST.find(a => a.id === 'dijkstra')!, t, s, g, { diagonal });
        const bi = buildPathFrames(PATHFINDING_LIST.find(a => a.id === 'bidir-dijkstra')!, t, s, g, { diagonal });
        const a = dij[dij.length - 1], b = bi[bi.length - 1];
        expect(b.pathLength > 0).toBe(a.pathLength > 0);
        if (a.pathLength > 0) expect(b.pathCost).toBeCloseTo(a.pathCost, 6);
      }
    }
  });
  test('theta* path is never longer than the 8-connected optimum', () => {
    for (const seed of [1, 2]) {
      const t = { rows: 21, cols: 41, cells: new Uint8Array(21 * 41) };
      t.cells = MAZES[0].generate(t, mulberry32(seed));
      const empties: number[] = []; t.cells.forEach((c, i) => { if (c !== CELL.wall) empties.push(i); });
      const s = empties[0], g = empties[empties.length - 1];
      const tu = { ...t, cells: Uint8Array.from(t.cells, c => (c === CELL.weight ? CELL.empty : c)) };
      const dij = buildPathFrames(PATHFINDING_LIST.find(a => a.id === 'dijkstra')!, tu, s, g, { diagonal: true });
      const th = buildPathFrames(PATHFINDING_LIST.find(a => a.id === 'theta')!, tu, s, g, { diagonal: true });
      const a = dij[dij.length - 1], b = th[th.length - 1];
      expect(b.pathLength > 0).toBe(a.pathLength > 0);
      if (a.pathLength > 0) {
        expect(b.pathCost).toBeLessThanOrEqual(a.pathCost + 1e-9);
        const dr = Math.abs(Math.floor(s / 41) - Math.floor(g / 41)), dc = Math.abs((s % 41) - (g % 41));
        expect(b.pathCost).toBeGreaterThanOrEqual(Math.hypot(dr, dc) - 1e-9);
      }
    }
  });
  test('directed graphs contain negative edges but no negative cycle', () => {
    let negatives = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const g = generateGraph(12, 0.5, seed, 'directed');
      negatives += g.edges.filter(e => e.w < 0).length;
    }
    expect(negatives).toBeGreaterThan(0);
  });
  test('segment tree, trie and huffman invariants', () => {
    {
      const algo = TREE_LIST.find(a => a.id === 'segment-tree')!;
      const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
      if (!parsed.ok) throw new Error(parsed.error);
      const r = algo.setup(parsed.data);
      if ('error' in r) throw new Error(r.error);
      const frames = buildTreeFrames(algo, r);
      const last = frames[frames.length - 1];
      expect(last.variables['query sum']).toBe(6 + 3 + 2 + 7);
      expect(last.variables['root sum']).toBe(5 + 8 + 6 + 9 + 2 + 7 + 4 + 6);
    }
    {
      const algo = TREE_LIST.find(a => a.id === 'trie')!;
      const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
      if (!parsed.ok) throw new Error(parsed.error);
      const r = algo.setup(parsed.data);
      if ('error' in r) throw new Error(r.error);
      const frames = buildTreeFrames(algo, r);
      const results = new Map<string, boolean>();
      for (const f of frames) if (typeof f.variables.found === 'boolean') results.set(String(f.variables.searching), f.variables.found);
      expect(results.get('trie')).toBe(true);
      expect(results.get('tram')).toBe(false);
      expect(results.get('tea')).toBe(true);
    }
    {
      const algo = TREE_LIST.find(a => a.id === 'huffman')!;
      const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
      if (!parsed.ok) throw new Error(parsed.error);
      const r = algo.setup(parsed.data);
      if ('error' in r) throw new Error(r.error);
      const frames = buildTreeFrames(algo, r);
      const last = frames[frames.length - 1];
      // Reference optimal cost by greedy merge of the same frequencies.
      const text = defaultInputs(algo.inputs).text;
      const freq = new Map<string, number>();
      for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
      const heap = [...freq.values()].sort((a, b) => a - b);
      let cost = 0;
      while (heap.length > 1) {
        const x = heap.shift()!, y = heap.shift()!;
        cost += x + y;
        heap.push(x + y);
        heap.sort((a, b) => a - b);
      }
      expect(last.variables['huffman bits']).toBe(cost);
    }
  });
});

// ---------------------------------------------------------------------------
import { RECURSION_LIST, RECURSION } from '../src/algorithms/recursion';

const validSudoku = (grid: number[]): boolean => {
  const ok = (vals: number[]) => new Set(vals).size === 9 && vals.every(v => v >= 1 && v <= 9);
  for (let r = 0; r < 9; r++) if (!ok(grid.slice(r * 9, r * 9 + 9))) return false;
  for (let c = 0; c < 9; c++) if (!ok(Array.from({ length: 9 }, (_, r) => grid[r * 9 + c]))) return false;
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
    const box: number[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box.push(grid[(br + r) * 9 + bc + c]);
    if (!ok(box)) return false;
  }
  return true;
};
const runSudoku = (id: string, puzzle?: string) => {
  const algo = BACKTRACKING[id];
  const values = puzzle ? { puzzle } : defaultInputs(algo.inputs);
  const parsed = parseInputs(algo.inputs, values);
  if (!parsed.ok) throw new Error(parsed.error);
  const setup = algo.setup(parsed.data);
  if ('error' in setup) throw new Error(setup.error);
  const frames = buildBT(algo, setup);
  linesInRange(algo, frames);
  return { frames, last: frames[frames.length - 1], givens: (values.puzzle as string) };
};

test.describe('sudoku: constraint propagation and human techniques', () => {
  test('cp+mrv solves its easy default with zero guesses', () => {
    const { last, givens } = runSudoku('sudoku-cp');
    expect(last.variables.solved).toBe(true);
    expect(last.variables.guesses).toBe(0);
    const grid = last.cells.map(Number);
    expect(validSudoku(grid)).toBe(true);
    for (let i = 0; i < 81; i++) if (givens[i] !== '.') expect(grid[i]).toBe(Number(givens[i]));
  });
  test('cp+mrv solves a hard puzzle by searching, naive and cp agree on the default', () => {
    const hard = '4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......';
    const { last } = runSudoku('sudoku-cp', hard);
    expect(last.variables.solved).toBe(true);
    expect(Number(last.variables.guesses)).toBeGreaterThan(0);
    expect(validSudoku(last.cells.map(Number))).toBe(true);
    const cp = runSudoku('sudoku-cp').last.cells.join('');
    const naive = runSudoku('sudoku', defaultInputs(BACKTRACKING['sudoku-cp'].inputs).puzzle).last.cells.join('');
    expect(cp).toBe(naive);
  });
  test('human techniques solve the default without guessing and use a pair', () => {
    const { last, givens } = runSudoku('sudoku-human');
    expect(last.variables.solved).toBe(true);
    expect(last.variables.stuck).toBeUndefined();
    const grid = last.cells.map(Number);
    expect(validSudoku(grid)).toBe(true);
    for (let i = 0; i < 81; i++) if (givens[i] !== '0' && givens[i] !== '.') expect(grid[i]).toBe(Number(givens[i]));
    expect(Number(last.variables['naked pair'])).toBeGreaterThan(0);
  });
});

test.describe('recursion', () => {
  const runRec = (id: string, overrides: Record<string, string> = {}) => {
    const algo = RECURSION[id];
    const parsed = parseInputs(algo.inputs, { ...defaultInputs(algo.inputs), ...overrides });
    if (!parsed.ok) throw new Error(parsed.error);
    const setup = algo.setup(parsed.data);
    if ('error' in setup) throw new Error(setup.error);
    const frames = buildTreeFrames(algo, setup);
    linesInRange(algo, frames);
    return frames[frames.length - 1];
  };
  const countNodes = (n: import('../src/algorithms/tree').TreeNode | null): number =>
    n ? 1 + (n.children ?? []).reduce((a, c) => a + countNodes(c), 0) : 0;

  test('naive fib call tree has 2·fib(n+1)−1 nodes and the right value', () => {
    const last = runRec('fib-naive', { n: '8' });
    expect(last.variables.result).toBe(21);
    expect(last.variables['total calls']).toBe(67); // 2·fib(9)−1
    expect(countNodes(last.root)).toBe(67);
  });
  test('memoized fib collapses to linear calls', () => {
    const last = runRec('fib-memo', { n: '8' });
    expect(last.variables.result).toBe(21);
    expect(last.variables['total calls']).toBe(15); // 2n−1
    expect(last.variables['memo hits']).toBe(6);
  });
  test('subsets and permutations hit their counting identities', () => {
    const s = runRec('subsets');
    expect(s.variables['subsets found']).toBe(8);
    expect(new Set((s.variables.all as string).split(' ')).size).toBe(8);
    const p = runRec('permutations');
    expect(p.variables['permutations found']).toBe(6);
  });
  test('hanoi makes 2ⁿ−1 legal moves', () => {
    const last = runRec('hanoi', { n: '4' });
    expect(last.variables['total moves']).toBe(15);
    const pegs: Record<string, number[]> = { A: [4, 3, 2, 1], B: [], C: [] };
    for (const mv of (last.variables.sequence as string).split(' ')) {
      const [from, to] = mv.split('→');
      const disc = pegs[from].pop()!;
      const top = pegs[to][pegs[to].length - 1];
      expect(top === undefined || top > disc, mv).toBe(true);
      pegs[to].push(disc);
    }
    expect(pegs.C).toEqual([4, 3, 2, 1]);
  });
  test('ackermann values are right and explosive inputs are refused', () => {
    expect(runRec('ackermann', { m: '2', n: '2' }).variables.result).toBe(7);
    expect(runRec('ackermann', { m: '2', n: '3' }).variables.result).toBe(9);
    const algo = RECURSION['ackermann'];
    const parsed = parseInputs(algo.inputs, { m: '3', n: '3' });
    if (!parsed.ok) throw new Error(parsed.error);
    const setup = algo.setup(parsed.data);
    expect('error' in setup).toBe(true);
  });
  test('every recursion entry runs its defaults with valid lines', () => {
    for (const algo of RECURSION_LIST) {
      const parsed = parseInputs(algo.inputs, defaultInputs(algo.inputs));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      const setup = algo.setup(parsed.data);
      expect('error' in setup).toBe(false);
      if ('error' in setup) continue;
      linesInRange(algo, buildTreeFrames(algo, setup));
    }
  });
});

// ---------------------------------------------------------------------------
// Growth measurement (src/algorithms/sorting/measure.ts)

import { SORTING } from '../src/algorithms/sorting';
import { countOps, estimateOrder, makeInput, measureGrowth } from '../src/algorithms/sorting/measure';

test.describe('growth measurement', () => {
  test('countOps agrees with the frame builder metrics', () => {
    const input = makeInput(60, 'random', 42);
    for (const algo of SORTING_LIST.filter(a => a.cap === undefined)) {
      const last = buildSortFrames(algo, input).at(-1)!;
      const ops = countOps(algo, input);
      expect(ops.comparisons, algo.id).toBe(last.comparisons);
      expect(ops.swaps, algo.id).toBe(last.swaps);
      expect(ops.writes, algo.id).toBe(last.writes);
    }
  });

  test('empirical order matches theory on stereotypical inputs', () => {
    const insertion = estimateOrder(measureGrowth(SORTING['insertion'], 'reversed'))!;
    expect(insertion.model.id).toBe('n2');
    expect(insertion.exponent).toBeGreaterThan(1.8);

    const merge = estimateOrder(measureGrowth(SORTING['merge'], 'random'))!;
    expect(merge.model.id).toBe('nlogn');

    const counting = estimateOrder(measureGrowth(SORTING['counting'], 'random'))!;
    expect(counting.model.id).toBe('n');
  });

  test('adaptive sorts are linear on already-sorted input', () => {
    for (const id of ['bubble', 'insertion', 'timsort']) {
      const est = estimateOrder(measureGrowth(SORTING[id], 'sorted'))!;
      expect(est.model.id, id).toBe('n');
    }
  });
});

// ---------------------------------------------------------------------------
// CPU scheduling

import { SCHEDULING_LIST, SCHEDULING, buildSchedFrames } from '../src/algorithms/scheduling';
import type { SchedProcess, SchedFrame } from '../src/algorithms/scheduling';

const schedule = (id: string, values: Record<string, string>) => {
  const algo = SCHEDULING[id];
  const parsed = parseInputs(algo.inputs, { ...defaultInputs(algo.inputs), ...values });
  expect(parsed.ok, id).toBe(true);
  if (!parsed.ok) throw new Error(parsed.error);
  const plan = algo.setup(parsed.data);
  if ('error' in plan) throw new Error(plan.error);
  return { algo, plan, frames: buildSchedFrames(algo, plan) };
};

const finalChecks = (id: string, procs: SchedProcess[], frames: SchedFrame[]) => {
  const last = frames[frames.length - 1];
  const gantt = Array.from(last.gantt);
  // Every process ran exactly its burst and finished after arrival + burst.
  for (const p of procs) {
    expect(gantt.filter(g => g === p.id).length, `${id} ${p.id} runs`).toBe(p.burst);
    expect(last.completion[p.id], `${id} ${p.id} completion`).not.toBeNull();
    expect(last.completion[p.id]!, `${id} ${p.id} completion time`).toBeGreaterThanOrEqual(p.arrival + p.burst);
    expect(gantt.lastIndexOf(p.id) + 1, `${id} ${p.id} completion = last run tick`).toBe(last.completion[p.id]);
  }
  // Work-conserving: the CPU never idles while an arrived process is unfinished.
  for (let t = 0; t < gantt.length; t++) {
    if (gantt[t] !== -1) continue;
    for (const p of procs) {
      const doneBy = gantt.slice(0, t).filter(g => g === p.id).length === p.burst;
      expect(p.arrival <= t && !doneBy, `${id}: idle at t=${t} while P${p.id + 1} ready`).toBe(false);
    }
  }
  // Averages match an independent recomputation.
  const n = procs.length;
  const turn = procs.map(p => last.completion[p.id]! - p.arrival);
  expect(last.avgTurnaround).toBeCloseTo(turn.reduce((a, b) => a + b, 0) / n, 2);
  expect(last.avgWaiting).toBeCloseTo(turn.reduce((a, b, i) => a + b - procs[i].burst, 0) / n, 2);
  return last;
};

test.describe('scheduling', () => {
  for (const algo of SCHEDULING_LIST) {
    test(`${algo.id} produces a valid schedule with valid lines`, () => {
      const { plan, frames } = schedule(algo.id, {});
      linesInRange(algo, frames);
      const last = finalChecks(algo.id, plan.procs, frames);
      if (!algo.preemptive) {
        // Non-preemptive: each process's ticks are contiguous.
        const gantt = Array.from(last.gantt);
        for (const p of plan.procs) {
          expect(gantt.lastIndexOf(p.id) - gantt.indexOf(p.id) + 1, `${algo.id} P${p.id + 1} contiguous`).toBe(p.burst);
        }
      }
    });
  }

  test('fcfs runs in arrival order and never switches back', () => {
    const { plan, frames } = schedule('fcfs', {});
    const gantt = Array.from(frames[frames.length - 1].gantt).filter(g => g >= 0);
    const firstRun = new Map<number, number>();
    gantt.forEach((pid, k) => { if (!firstRun.has(pid)) firstRun.set(pid, k); });
    const order = [...plan.procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id).map(p => p.id);
    expect([...firstRun.keys()]).toEqual(order);
  });

  test('srtf has the lowest average waiting time on random instances', () => {
    const rnd = mulberry32(1234);
    for (let trial = 0; trial < 12; trial++) {
      const n = 3 + Math.floor(rnd() * 5);
      const arrivals = Array.from({ length: n }, () => Math.floor(rnd() * 12)).join(', ');
      const bursts = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 9)).join(', ');
      const priorities = Array.from({ length: n }, () => Math.floor(rnd() * 9)).join(', ');
      const wait = (id: string) => {
        const extra = id === 'priority' ? { priorities } : id === 'rr' ? { quantum: '2' } : {};
        const { frames } = schedule(id, { arrivals, bursts, ...extra });
        return frames[frames.length - 1].avgWaiting!;
      };
      const srtfW = wait('srtf');
      for (const other of ['fcfs', 'sjf', 'rr', 'priority']) {
        expect(srtfW, `trial ${trial}: srtf vs ${other} (${arrivals} | ${bursts})`).toBeLessThanOrEqual(wait(other));
      }
    }
  });

  test('round robin matches an independent reference simulation', () => {
    const refRR = (procs: SchedProcess[], q: number) => {
      const rem = procs.map(p => p.burst);
      const completion = new Array<number>(procs.length).fill(0);
      const queued = new Array<boolean>(procs.length).fill(false);
      const queue: number[] = [];
      let t = 0, done = 0;
      const admit = (now: number) => {
        [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id)
          .forEach(p => { if (!queued[p.id] && p.arrival <= now) { queued[p.id] = true; queue.push(p.id); } });
      };
      admit(0);
      while (done < procs.length) {
        if (!queue.length) { t++; admit(t); continue; }
        const pid = queue.shift()!;
        for (let k = Math.min(q, rem[pid]); k > 0; k--) { rem[pid]--; t++; admit(t); }
        if (rem[pid] === 0) { completion[pid] = t; done++; } else queue.push(pid);
      }
      return completion;
    };
    const rnd = mulberry32(77);
    for (let trial = 0; trial < 10; trial++) {
      const n = 2 + Math.floor(rnd() * 6);
      const q = 1 + Math.floor(rnd() * 4);
      const arrivals = Array.from({ length: n }, () => Math.floor(rnd() * 10));
      const bursts = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 8));
      const { plan, frames } = schedule('rr', { arrivals: arrivals.join(', '), bursts: bursts.join(', '), quantum: String(q) });
      const last = finalChecks(`rr q=${q}`, plan.procs, frames);
      expect(last.completion, `trial ${trial}`).toEqual(refRR(plan.procs, q));
    }
  });

  test('mismatched input lengths are rejected', () => {
    const algo = SCHEDULING['fcfs'];
    const parsed = parseInputs(algo.inputs, { ...defaultInputs(algo.inputs), arrivals: '0, 1' });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const plan = algo.setup(parsed.data);
    expect('error' in plan).toBe(true);
  });
});
