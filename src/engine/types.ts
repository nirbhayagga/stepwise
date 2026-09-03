/** Shared metadata every visualised algorithm declares. */
export interface Complexity {
  time: { best?: string; average?: string; worst: string };
  space: string;
  /** Divide-and-conquer recurrence with its solution, e.g. "T(n) = 2T(n/2) + Θ(n) ⇒ Θ(n log n)". */
  recurrence?: string;
  /** Short qualitative properties, e.g. "Stable", "In-place", "Optimal". */
  tags?: string[];
}

export interface AlgorithmMeta {
  /** Stable identifier used in selects, routes and registries. */
  id: string;
  name: string;
  /** One factual sentence. */
  summary: string;
  complexity: Complexity;
  /**
   * Pseudocode listing. Generators reference these lines with a 1-based
   * `line` field on the actions they yield.
   */
  pseudocode: string[];
}

/** Fields common to every action a generator can yield. */
export interface BaseAction {
  /** 1-based index into `pseudocode`. Omit to keep the previous line. */
  line?: number;
  /** Values shown in the watch window for this step. */
  variables?: Record<string, unknown>;
}

/** Fields common to every recorded frame. */
export interface BaseFrame {
  line: number;
  variables: Record<string, unknown>;
}

export type Registry<T extends AlgorithmMeta> = Record<string, T>;

export function toRegistry<T extends AlgorithmMeta>(list: T[]): Registry<T> {
  const out: Registry<T> = {};
  for (const item of list) {
    if (out[item.id]) throw new Error(`Duplicate algorithm id: ${item.id}`);
    out[item.id] = item;
  }
  return out;
}

/** Warn (dev only) when an action references a pseudocode line that does not exist. */
export function checkLine(meta: AlgorithmMeta, line: number | undefined): void {
  if (import.meta.env?.DEV && line !== undefined && (line < 1 || line > meta.pseudocode.length)) {
    console.warn(`[${meta.id}] highlight line ${line} is outside 1..${meta.pseudocode.length}`);
  }
}

/** Declarative description of one user input for algorithms that take parameters. */
export interface InputSpec {
  key: string;
  label: string;
  kind: 'text' | 'int' | 'ints';
  default: string;
  hint?: string;
  min?: number;
  max?: number;
  /** For 'ints' / 'text': maximum number of elements / characters. */
  maxLength?: number;
}

export type InputValues = Record<string, string>;
export type ParsedInputs = Record<string, string | number | number[]>;

export function defaultInputs(specs: InputSpec[]): InputValues {
  return Object.fromEntries(specs.map(s => [s.key, s.default]));
}

/** Validate raw form strings against their specs. */
export function parseInputs(specs: InputSpec[], values: InputValues): { ok: true; data: ParsedInputs } | { ok: false; error: string } {
  const data: ParsedInputs = {};
  for (const s of specs) {
    const raw = (values[s.key] ?? '').trim();
    if (s.kind === 'text') {
      if (s.maxLength && raw.length > s.maxLength) return { ok: false, error: `${s.label}: at most ${s.maxLength} characters` };
      data[s.key] = raw;
    } else if (s.kind === 'int') {
      if (!/^-?\d+$/.test(raw)) return { ok: false, error: `${s.label}: expected an integer` };
      const v = parseInt(raw, 10);
      if (s.min !== undefined && v < s.min) return { ok: false, error: `${s.label}: minimum ${s.min}` };
      if (s.max !== undefined && v > s.max) return { ok: false, error: `${s.label}: maximum ${s.max}` };
      data[s.key] = v;
    } else {
      const parts = raw.split(/[\s,]+/).filter(Boolean);
      const list: number[] = [];
      for (const p of parts) {
        if (!/^-?\d+$/.test(p)) return { ok: false, error: `${s.label}: "${p}" is not an integer` };
        const v = parseInt(p, 10);
        if (s.min !== undefined && v < s.min) return { ok: false, error: `${s.label}: values must be ≥ ${s.min}` };
        if (s.max !== undefined && v > s.max) return { ok: false, error: `${s.label}: values must be ≤ ${s.max}` };
        list.push(v);
      }
      if (s.maxLength && list.length > s.maxLength) return { ok: false, error: `${s.label}: at most ${s.maxLength} values` };
      data[s.key] = list;
    }
  }
  return { ok: true, data };
}
