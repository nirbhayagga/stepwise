import { CELL, type Terrain } from './types';

export const SQRT2 = Math.SQRT2;
/** Cost multiplier for entering a weighted cell. */
export const WEIGHT_COST = 5;

export const idx = (t: Terrain, r: number, c: number) => r * t.cols + c;
export const rowOf = (t: Terrain, i: number) => Math.floor(i / t.cols);
export const colOf = (t: Terrain, i: number) => i % t.cols;
export const label = (t: Terrain, i: number) => `(${rowOf(t, i)}, ${colOf(t, i)})`;

export function passable(t: Terrain, r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < t.rows && c < t.cols && t.cells[idx(t, r, c)] !== CELL.wall;
}

/** Cost of stepping into node `i` along a unit (1) or diagonal (√2) move. */
export function stepCost(t: Terrain, i: number, diagonalMove: boolean, weighted: boolean): number {
  const base = diagonalMove ? SQRT2 : 1;
  return weighted && t.cells[i] === CELL.weight ? base * WEIGHT_COST : base;
}

const ORTHO = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const DIAG = [[-1, 1], [1, 1], [1, -1], [-1, -1]];

export interface Neighbor { i: number; diagonal: boolean }

/** Passable neighbours; diagonal moves never cut a wall corner. */
export function neighbors(t: Terrain, i: number, diagonal: boolean): Neighbor[] {
  const r = rowOf(t, i), c = colOf(t, i);
  const out: Neighbor[] = [];
  for (const [dr, dc] of ORTHO) {
    if (passable(t, r + dr, c + dc)) out.push({ i: idx(t, r + dr, c + dc), diagonal: false });
  }
  if (diagonal) {
    for (const [dr, dc] of DIAG) {
      if (passable(t, r + dr, c + dc) && passable(t, r + dr, c) && passable(t, r, c + dc)) {
        out.push({ i: idx(t, r + dr, c + dc), diagonal: true });
      }
    }
  }
  return out;
}

/** Manhattan distance for 4-connected grids, octile distance for 8-connected. */
export function heuristic(t: Terrain, a: number, b: number, diagonal: boolean): number {
  const dr = Math.abs(rowOf(t, a) - rowOf(t, b));
  const dc = Math.abs(colOf(t, a) - colOf(t, b));
  return diagonal ? Math.max(dr, dc) + (SQRT2 - 1) * Math.min(dr, dc) : dr + dc;
}

export function reconstruct(parent: Int32Array, target: number): number[] {
  const path: number[] = [];
  for (let cur = target; cur !== -1; cur = parent[cur]) path.push(cur);
  return path.reverse();
}

/** Cumulative cost of a node path (for the path-cost metric). */
export function pathCosts(t: Terrain, path: number[], weighted: boolean): number[] {
  const out: number[] = [0];
  for (let k = 1; k < path.length; k++) {
    const diag = rowOf(t, path[k]) !== rowOf(t, path[k - 1]) && colOf(t, path[k]) !== colOf(t, path[k - 1]);
    out.push(out[k - 1] + stepCost(t, path[k], diag, weighted));
  }
  return out;
}

/** Binary min-heap keyed by a number, with decrease-key via re-insertion + stale check. */
export class MinHeap {
  private keys: number[] = [];
  private items: number[] = [];
  get size() { return this.items.length; }
  push(item: number, key: number) {
    this.keys.push(key); this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= this.keys[i]) break;
      this.swap(i, p); i = p;
    }
  }
  pop(): { item: number; key: number } | undefined {
    if (!this.items.length) return undefined;
    const top = { item: this.items[0], key: this.keys[0] };
    const lastItem = this.items.pop()!, lastKey = this.keys.pop()!;
    if (this.items.length) {
      this.items[0] = lastItem; this.keys[0] = lastKey;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < this.items.length && this.keys[l] < this.keys[m]) m = l;
        if (r < this.items.length && this.keys[r] < this.keys[m]) m = r;
        if (m === i) break;
        this.swap(i, m); i = m;
      }
    }
    return top;
  }
  private swap(a: number, b: number) {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
  }
}
