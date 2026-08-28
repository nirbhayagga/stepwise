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
        const frames = buildSortFrames(algo, input);
        const last = frames[frames.length - 1];
        expect(Array.from(last.values)).toEqual(input.slice().sort((a, b) => a - b));
        expect(Array.from(last.states).every(s => s === SORT_STATE.sorted)).toBe(true);
        for (const f of frames) expect(f.values.length).toBe(n);
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
  const expected: Record<string, number> = { knapsack: 9, lcs: 4, 'edit-distance': 3, 'coin-change': 3, lis: 4, 'matrix-chain': 15125 };
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
        const gg = algo.kind === 'dag' ? generateGraph(12, 0.5, seed, 'dag') : g;
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
