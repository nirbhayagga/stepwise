import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from './types';
import { checkLine } from './types';

/**
 * Generic cell-board timeline (N-Queens, Sudoku, the sieve, …): persistent
 * text + state per cell, plus transient per-frame flashes.
 */
export const BOARD_STATE = { empty: 0, fixed: 1, placed: 2, trying: 3, conflict: 4, removed: 5, note: 6 } as const;

export interface BoardAction extends BaseAction {
  /** Persistent writes: cell text + state. `null` text clears the cell. */
  set?: [index: number, text: string | null, state: number][];
  /** Transient highlights for this frame only. */
  flash?: [index: number, state: number][];
}

export interface BoardSetup {
  rows: number;
  cols: number;
  /** Draw thicker borders every `boxSize` cells (Sudoku). */
  boxSize?: number;
  run: () => Generator<BoardAction, void, unknown>;
}

export interface BoardAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  setup(data: ParsedInputs): BoardSetup | { error: string };
}

export interface BoardFrame extends BaseFrame {
  cells: string[];
  states: Uint8Array;
}

export function buildBoardFrames(meta: BoardAlgorithm, setup: BoardSetup): BoardFrame[] {
  const n = setup.rows * setup.cols;
  const cells = new Array<string>(n).fill('');
  const persist = new Uint8Array(n);
  let line = 0;
  const frames: BoardFrame[] = [];
  const push = (action: BoardAction | null) => {
    const states = Uint8Array.from(persist);
    if (action?.flash) for (const [i, s] of action.flash) if (i >= 0 && i < n) states[i] = s;
    frames.push({ cells: cells.slice(), states, variables: action?.variables ?? {}, line });
  };
  push(null);
  for (const action of setup.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.set) for (const [i, text, s] of action.set) {
      if (i < 0 || i >= n) continue;
      cells[i] = text ?? '';
      persist[i] = s;
    }
    push(action);
  }
  // Terminal frame: transient flashes cleared, last variables kept.
  frames.push({ ...frames[frames.length - 1], states: Uint8Array.from(persist), cells: cells.slice() });
  return frames;
}
