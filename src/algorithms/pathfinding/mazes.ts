import { CELL, type Terrain } from './types';
import { idx } from './grid';
import { shuffle } from '../../engine/random';

export interface MazeGenerator {
  id: string;
  name: string;
  summary: string;
  /** Returns a fresh cells array; never mutates the input terrain. */
  generate(t: Terrain, rnd: () => number): Uint8Array;
}

/** Odd-coordinate lattice used by the perfect-maze generators. */
function lattice(t: Terrain) {
  const cells = new Uint8Array(t.rows * t.cols).fill(CELL.wall);
  const rows = Math.floor((t.rows - 1) / 2), cols = Math.floor((t.cols - 1) / 2);
  const rc = (r: number, c: number) => idx(t, 2 * r + 1, 2 * c + 1);
  const open = (r: number, c: number) => { cells[rc(r, c)] = CELL.empty; };
  const link = (r1: number, c1: number, r2: number, c2: number) => {
    cells[idx(t, (2 * r1 + 1 + 2 * r2 + 1) / 2, (2 * c1 + 1 + 2 * c2 + 1) / 2)] = CELL.empty;
  };
  return { cells, rows, cols, open, link };
}

const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

export const randomWalls: MazeGenerator = {
  id: 'random-walls',
  name: 'Random walls (28%)',
  summary: 'Independent Bernoulli walls.',
  generate(t, rnd) {
    const cells = new Uint8Array(t.rows * t.cols);
    for (let i = 0; i < cells.length; i++) if (rnd() < 0.28) cells[i] = CELL.wall;
    return cells;
  },
};

export const randomWeights: MazeGenerator = {
  id: 'random-weights',
  name: 'Random weights (35%)',
  summary: 'Weighted terrain with a few walls; separates weighted from unweighted searches.',
  generate(t, rnd) {
    const cells = new Uint8Array(t.rows * t.cols);
    for (let i = 0; i < cells.length; i++) {
      const x = rnd();
      if (x < 0.35) cells[i] = CELL.weight;
      else if (x < 0.42) cells[i] = CELL.wall;
    }
    return cells;
  },
};

export const recursiveBacktracker: MazeGenerator = {
  id: 'backtracker',
  name: 'Recursive backtracker',
  summary: 'Randomised depth-first carve; long winding corridors, few branches.',
  generate(t, rnd) {
    const L = lattice(t);
    if (L.rows < 1 || L.cols < 1) return L.cells;
    const seen = new Uint8Array(L.rows * L.cols);
    const stack: [number, number][] = [[0, 0]];
    seen[0] = 1; L.open(0, 0);
    while (stack.length) {
      const [r, c] = stack[stack.length - 1];
      const options = shuffle(DIRS.slice(), rnd)
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < L.rows && nc < L.cols && !seen[nr * L.cols + nc]);
      if (!options.length) { stack.pop(); continue; }
      const [nr, nc] = options[0];
      seen[nr * L.cols + nc] = 1;
      L.open(nr, nc); L.link(r, c, nr, nc);
      stack.push([nr, nc]);
    }
    return L.cells;
  },
};

export const randomizedPrim: MazeGenerator = {
  id: 'prim',
  name: "Randomised Prim's",
  summary: 'Grows a spanning tree from a random frontier; short dead ends, bushy structure.',
  generate(t, rnd) {
    const L = lattice(t);
    if (L.rows < 1 || L.cols < 1) return L.cells;
    const inTree = new Uint8Array(L.rows * L.cols);
    const frontier: [number, number, number, number][] = []; // [r, c, fromR, fromC]
    const addFrontier = (r: number, c: number) => {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < L.rows && nc < L.cols && !inTree[nr * L.cols + nc]) frontier.push([nr, nc, r, c]);
      }
    };
    const sr = Math.floor(rnd() * L.rows), sc = Math.floor(rnd() * L.cols);
    inTree[sr * L.cols + sc] = 1; L.open(sr, sc); addFrontier(sr, sc);
    while (frontier.length) {
      const k = Math.floor(rnd() * frontier.length);
      const [r, c, fr, fc] = frontier[k];
      frontier[k] = frontier[frontier.length - 1]; frontier.pop();
      if (inTree[r * L.cols + c]) continue;
      inTree[r * L.cols + c] = 1;
      L.open(r, c); L.link(fr, fc, r, c);
      addFrontier(r, c);
    }
    return L.cells;
  },
};

export const randomizedKruskal: MazeGenerator = {
  id: 'kruskal',
  name: "Randomised Kruskal's",
  summary: 'Joins cells in random order with a union–find structure; uniform texture, many short branches.',
  generate(t, rnd) {
    const L = lattice(t);
    if (L.rows < 1 || L.cols < 1) return L.cells;
    const parent = Int32Array.from({ length: L.rows * L.cols }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const edges: [number, number, number, number][] = [];
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      L.open(r, c);
      if (r + 1 < L.rows) edges.push([r, c, r + 1, c]);
      if (c + 1 < L.cols) edges.push([r, c, r, c + 1]);
    }
    shuffle(edges, rnd);
    for (const [r1, c1, r2, c2] of edges) {
      const a = find(r1 * L.cols + c1), b = find(r2 * L.cols + c2);
      if (a === b) continue;
      parent[a] = b;
      L.link(r1, c1, r2, c2);
    }
    return L.cells;
  },
};

export const recursiveDivision: MazeGenerator = {
  id: 'division',
  name: 'Recursive division',
  summary: 'Splits open space with walls that each have one gap; produces rooms and long straight corridors.',
  generate(t, rnd) {
    const cells = new Uint8Array(t.rows * t.cols);
    for (let r = 0; r < t.rows; r++) for (let c = 0; c < t.cols; c++) {
      if (r === 0 || c === 0 || r === t.rows - 1 || c === t.cols - 1) cells[idx(t, r, c)] = CELL.wall;
    }
    const evens = (lo: number, hi: number) => { const a: number[] = []; for (let v = lo; v <= hi; v++) if (v % 2 === 0) a.push(v); return a; };
    const odds = (lo: number, hi: number) => { const a: number[] = []; for (let v = lo; v <= hi; v++) if (v % 2 === 1) a.push(v); return a; };
    const pick = (a: number[]) => a[Math.floor(rnd() * a.length)];
    const divide = (r1: number, c1: number, r2: number, c2: number) => {
      const h = r2 - r1, w = c2 - c1;
      if (h < 3 || w < 3) return;
      const horizontal = h > w ? true : w > h ? false : rnd() < 0.5;
      if (horizontal) {
        const rows = evens(r1 + 1, r2 - 1); if (!rows.length) return;
        const wr = pick(rows), gap = pick(odds(c1, c2));
        for (let c = c1; c <= c2; c++) if (c !== gap) cells[idx(t, wr, c)] = CELL.wall;
        divide(r1, c1, wr - 1, c2); divide(wr + 1, c1, r2, c2);
      } else {
        const cols = evens(c1 + 1, c2 - 1); if (!cols.length) return;
        const wc = pick(cols), gap = pick(odds(r1, r2));
        for (let r = r1; r <= r2; r++) if (r !== gap) cells[idx(t, r, wc)] = CELL.wall;
        divide(r1, c1, r2, wc - 1); divide(r1, wc + 1, r2, c2);
      }
    };
    divide(1, 1, t.rows - 2, t.cols - 2);
    return cells;
  },
};

export const MAZES: MazeGenerator[] = [randomWalls, randomWeights, recursiveBacktracker, randomizedPrim, randomizedKruskal, recursiveDivision];
export const MAZE_BY_ID: Record<string, MazeGenerator> = Object.fromEntries(MAZES.map(m => [m.id, m]));
