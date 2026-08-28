import type { AlgorithmMeta, BaseAction, BaseFrame } from '../../engine/types';
import { checkLine } from '../../engine/types';

export type SortActionType = 'compare' | 'swap' | 'write' | 'sorted';

export interface SortAction extends BaseAction {
  type: SortActionType;
  /** Elements involved in this step (already mutated for swap/write). */
  indices: number[];
  /** Extra elements to draw as markers (pivot, key, gap partner …). */
  marks?: number[];
}

/** Generators receive a private copy of the array and mutate it in place. */
export type SortGenerator = (a: number[]) => Generator<SortAction, void, unknown>;

export interface SortingAlgorithm extends AlgorithmMeta {
  run: SortGenerator;
}

export const SORT_STATE = { default: 0, compare: 1, write: 2, sorted: 3, mark: 4 } as const;

export interface SortFrame extends BaseFrame {
  values: Uint16Array;
  states: Uint8Array;
  comparisons: number;
  swaps: number;
  writes: number;
}

export function randomValues(size: number, min = 5, max = 100): number[] {
  return Array.from({ length: size }, () => min + Math.floor(Math.random() * (max - min + 1)));
}

/** Run a sorting generator to completion and record one compact frame per step. */
export function buildSortFrames(meta: SortingAlgorithm, initial: number[]): SortFrame[] {
  const n = initial.length;
  const a = initial.slice();
  const sortedMask = new Uint8Array(n);
  const frames: SortFrame[] = [];
  let comparisons = 0, swaps = 0, writes = 0, line = 0;

  const push = (states: Uint8Array, variables: Record<string, unknown>) => {
    frames.push({ values: Uint16Array.from(a), states, comparisons, swaps, writes, variables, line });
  };

  push(new Uint8Array(n), {});

  for (const action of meta.run(a)) {
    if (action.line !== undefined) {
      checkLine(meta, action.line);
      line = action.line;
    }
    if (action.type === 'compare') comparisons++;
    else if (action.type === 'swap') swaps++;
    else if (action.type === 'write') writes++;
    else if (action.type === 'sorted') for (const i of action.indices) sortedMask[i] = 1;

    const states = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (sortedMask[i]) states[i] = SORT_STATE.sorted;
    if (action.marks) for (const i of action.marks) if (i >= 0 && i < n) states[i] = SORT_STATE.mark;
    const s = action.type === 'compare' ? SORT_STATE.compare
      : action.type === 'swap' || action.type === 'write' ? SORT_STATE.write
      : SORT_STATE.sorted;
    for (const i of action.indices) if (i >= 0 && i < n) states[i] = s;
    push(states, action.variables ?? {});
  }

  // Terminal frame: everything sorted, nothing highlighted.
  const done = new Uint8Array(n).fill(SORT_STATE.sorted);
  frames.push({ values: Uint16Array.from(a), states: done, comparisons, swaps, writes, variables: {}, line });
  return frames;
}
