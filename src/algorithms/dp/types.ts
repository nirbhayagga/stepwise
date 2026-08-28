import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from '../../engine/types';
import { checkLine } from '../../engine/types';

/** Fill one table cell (0-based indices). `sources` are the cells it was computed from. */
export interface DPAction extends BaseAction {
  row: number;
  col: number;
  value: number | string;
  sources?: [number, number][];
}

export interface DPTable {
  rows: number;
  cols: number;
  rowLabels: string[];
  colLabels: string[];
  /** Optional caption shown above the table (e.g. what the cell means). */
  cellMeaning: string;
  run: () => Generator<DPAction, void, unknown>;
}

export interface DPAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  /** Build the table shape and generator from validated inputs, or explain why not. */
  setup(data: ParsedInputs): DPTable | { error: string };
}

export const DP_STATE = { empty: 0, filled: 1, current: 2, source: 3 } as const;

export interface DPFrame extends BaseFrame {
  values: string[];
  states: Uint8Array;
}

const fmt = (v: number | string) => (v === Infinity ? '∞' : String(v));

export function buildDPFrames(meta: DPAlgorithm, table: DPTable): DPFrame[] {
  const n = table.rows * table.cols;
  const values = new Array<string>(n).fill('');
  const filled = new Uint8Array(n);
  const frames: DPFrame[] = [];
  let line = 0;

  const push = (states: Uint8Array, variables: Record<string, unknown>) => {
    frames.push({ values: values.slice(), states, variables, line });
  };
  push(new Uint8Array(n), {});

  for (const action of table.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    const at = action.row * table.cols + action.col;
    values[at] = fmt(action.value);
    filled[at] = 1;
    const states = Uint8Array.from(filled);
    if (action.sources) for (const [r, c] of action.sources) {
      const s = r * table.cols + c;
      if (s >= 0 && s < n) states[s] = DP_STATE.source;
    }
    states[at] = DP_STATE.current;
    push(states, action.variables ?? {});
  }
  push(Uint8Array.from(filled), frames[frames.length - 1]?.variables ?? {});
  return frames;
}
