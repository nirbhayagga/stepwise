import type { AlgorithmMeta, BaseAction, BaseFrame } from '../../engine/types';
import { checkLine } from '../../engine/types';

/** Static terrain. `cells` holds one CELL value per (row-major) node. */
export const CELL = { empty: 0, wall: 1, weight: 2 } as const;
export type CellType = (typeof CELL)[keyof typeof CELL];

export interface Terrain {
  rows: number;
  cols: number;
  cells: Uint8Array;
}

export interface PathOptions {
  diagonal: boolean;
}

/** Per-node search state recorded in each frame. */
export const NODE_STATE = { unvisited: 0, frontier: 1, visiting: 2, visited: 3, path: 4 } as const;

/**
 * One step of a search. Each list is applied in the order
 * frontier → visiting → visited → path, so a node can move between states
 * in a single action.
 */
export interface PathAction extends BaseAction {
  frontier?: number[];
  visiting?: number[];
  visited?: number[];
  path?: number[];
  /** Cumulative cost of the path emitted so far (path actions only). */
  cost?: number;
}

export type PathGenerator = (t: Terrain, start: number, target: number, opts: PathOptions) => Generator<PathAction, void, unknown>;

export interface PathfindingAlgorithm extends AlgorithmMeta {
  /** Honors weighted cells. Unweighted searches treat every step as cost 1. */
  weighted: boolean;
  /** 'optional' → user toggle; 'always' → 8-connected only; 'never' → 4-connected only. */
  diagonal: 'optional' | 'always' | 'never';
  run: PathGenerator;
}

export interface PathFrame extends BaseFrame {
  states: Uint8Array;
  explored: number;
  frontier: number;
  pathLength: number;
  pathCost: number;
}

export function resolveDiagonal(meta: PathfindingAlgorithm, wanted: boolean): boolean {
  if (meta.diagonal === 'always') return true;
  if (meta.diagonal === 'never') return false;
  return wanted;
}

/** Run a search generator to completion and record one compact frame per step. */
export function buildPathFrames(meta: PathfindingAlgorithm, t: Terrain, start: number, target: number, opts: PathOptions): PathFrame[] {
  const n = t.rows * t.cols;
  const states = new Uint8Array(n);
  const frames: PathFrame[] = [];
  let explored = 0, frontier = 0, pathNodes = 0, pathCost = 0, line = 0;

  const push = (variables: Record<string, unknown>) => {
    frames.push({
      states: Uint8Array.from(states), explored, frontier,
      pathLength: Math.max(0, pathNodes - 1), pathCost, variables, line,
    });
  };

  push({});
  for (const action of meta.run(t, start, target, opts)) {
    if (action.line !== undefined) {
      checkLine(meta, action.line);
      line = action.line;
    }
    if (action.frontier) for (const i of action.frontier) {
      if (states[i] === NODE_STATE.unvisited) frontier++;
      if (states[i] < NODE_STATE.visiting) states[i] = NODE_STATE.frontier;
    }
    if (action.visiting) for (const i of action.visiting) {
      if (states[i] === NODE_STATE.frontier) frontier--;
      if (states[i] < NODE_STATE.visited) states[i] = NODE_STATE.visiting;
    }
    if (action.visited) for (const i of action.visited) {
      if (states[i] === NODE_STATE.frontier) frontier--;
      if (states[i] !== NODE_STATE.visited) explored++;
      states[i] = NODE_STATE.visited;
    }
    if (action.path) {
      for (const i of action.path) { states[i] = NODE_STATE.path; pathNodes++; }
      if (action.cost !== undefined) pathCost = action.cost;
    }
    push(action.variables ?? {});
  }
  return frames;
}
