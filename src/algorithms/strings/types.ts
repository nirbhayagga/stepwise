import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from '../../engine/types';
import { checkLine } from '../../engine/types';

export const STR_STATE = { none: 0, compare: 1, match: 2, mismatch: 3, matched: 4, mark: 5 } as const;

export interface StringAction extends BaseAction {
  /** Transient cell states on the text row. */
  text?: [index: number, state: number][];
  /** Transient cell states on the pattern row. */
  pattern?: [index: number, state: number][];
  /** New alignment of pattern[0] under the text (persists); -1 hides the row. */
  shift?: number;
  /** Text index where a full occurrence starts (marks m cells permanently). */
  foundAt?: number;
  /** Auxiliary row snapshot (failure function, Z array, …). */
  aux?: (number | string)[];
}

export interface StringSetup {
  /** Row shown as "text" (Z-algorithm shows the concatenation here). */
  text: string;
  pattern: string;
  auxLabel?: string;
  run: () => Generator<StringAction, void, unknown>;
}

export interface StringAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  setup(data: ParsedInputs): StringSetup | { error: string };
}

export interface StringFrame extends BaseFrame {
  textStates: Uint8Array;
  patternStates: Uint8Array;
  shift: number;
  aux: (number | string)[];
  found: number[];
  comparisons: number;
}

export function buildStringFrames(meta: StringAlgorithm, setup: StringSetup): StringFrame[] {
  const n = setup.text.length, m = setup.pattern.length;
  const found: number[] = [];
  let shift = m ? 0 : -1;
  let aux: (number | string)[] = [];
  let line = 0, comparisons = 0;
  const frames: StringFrame[] = [];

  const push = (action: StringAction | null) => {
    const textStates = new Uint8Array(n);
    for (const f of found) for (let k = 0; k < Math.max(1, m); k++) if (f + k < n) textStates[f + k] = STR_STATE.matched;
    const patternStates = new Uint8Array(m);
    if (action?.text) for (const [i, s] of action.text) if (i >= 0 && i < n) textStates[i] = s;
    if (action?.pattern) for (const [i, s] of action.pattern) if (i >= 0 && i < m) patternStates[i] = s;
    frames.push({ textStates, patternStates, shift, aux: aux.slice(), found: found.slice(), comparisons, variables: action?.variables ?? {}, line });
  };

  push(null);
  for (const action of setup.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.shift !== undefined) shift = action.shift;
    if (action.aux) aux = action.aux.slice();
    if (action.foundAt !== undefined) found.push(action.foundAt);
    if (action.text?.some(([, s]) => s === STR_STATE.compare)) comparisons += action.text.filter(([, s]) => s === STR_STATE.compare).length;
    push(action);
  }
  const lastVars = frames[frames.length - 1].variables;
  push(null);
  frames[frames.length - 1].variables = lastVars;
  return frames;
}

export const TEXT_INPUT: InputSpec = { key: 'text', label: 'Text', kind: 'text', default: 'ABABDABACDABABCABABCABAB', maxLength: 48 };
export const PATTERN_INPUT: InputSpec = { key: 'pattern', label: 'Pattern', kind: 'text', default: 'ABABC', maxLength: 16 };

export function validate(text: string, pattern: string): string | null {
  if (!text.length) return 'Text must be non-empty';
  if (!pattern.length) return 'Pattern must be non-empty';
  if (pattern.length > text.length) return 'Pattern longer than text';
  return null;
}
