import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from '../../engine/types';
import { checkLine } from '../../engine/types';

export const HASH_STATE = { default: 0, probe: 1, placed: 2, hit: 3, miss: 4, moving: 5 } as const;

export interface HashAction extends BaseAction {
  /** Replace a slot's contents (chaining appends by passing the whole list). */
  set?: [slot: number, values: number[]][];
  /** Transient slot highlights. */
  states?: [slot: number, state: number][];
  /** Grow the table to this many slots (clears contents). */
  resize?: number;
}

export interface HashSetup {
  slots: number;
  run: () => Generator<HashAction, void, unknown>;
}

export interface HashAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  setup(data: ParsedInputs): HashSetup | { error: string };
}

export interface HashFrame extends BaseFrame {
  slots: number[][];
  states: Uint8Array;
  loadFactor: number;
}

export function buildHashFrames(meta: HashAlgorithm, setup: HashSetup): HashFrame[] {
  let slots: number[][] = Array.from({ length: setup.slots }, () => []);
  let line = 0;
  const frames: HashFrame[] = [];
  const push = (action: HashAction | null) => {
    const states = new Uint8Array(slots.length);
    if (action?.states) for (const [i, s] of action.states) if (i >= 0 && i < slots.length) states[i] = s;
    const filled = slots.reduce((a, s) => a + s.length, 0);
    frames.push({ slots: slots.map(s => s.slice()), states, loadFactor: filled / slots.length, variables: action?.variables ?? {}, line });
  };
  push(null);
  for (const action of setup.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.resize !== undefined) slots = Array.from({ length: action.resize }, () => []);
    if (action.set) for (const [i, values] of action.set) slots[i] = values.slice();
    push(action);
  }
  const lastVars = frames[frames.length - 1].variables;
  push(null);
  frames[frames.length - 1].variables = lastVars;
  return frames;
}

export const KEYS_INPUT: InputSpec = { key: 'keys', label: 'Insert keys', kind: 'ints', default: '18, 41, 22, 44, 59, 32, 31, 73', min: 0, maxLength: 14 };
export const SEARCH_INPUT: InputSpec = { key: 'searches', label: 'Search keys', kind: 'ints', default: '44, 32, 99', min: 0, maxLength: 6 };
export const SIZE_INPUT: InputSpec = { key: 'size', label: 'Slots m', kind: 'int', default: '11', min: 5, max: 19 };
