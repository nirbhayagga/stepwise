import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from '../../engine/types';
import { checkLine } from '../../engine/types';
import { mulberry32 } from '../../engine/random';

/**
 * Simulated thread interleavings. Every "thread" runs the same tiny program
 * against shared memory; a seeded RNG decides which runnable thread executes
 * its next instruction at each step. Once the seed is fixed the execution is
 * fully deterministic, so it records into the ordinary frame timeline and can
 * be scrubbed backwards — the whole point of simulating instead of racing
 * real workers.
 */

export type ThreadPhase = 'ready' | 'blocked' | 'done';

export interface ThreadSnap {
  id: number;
  /** 1-based pseudocode line of the next instruction; null when finished. */
  nextLine: number | null;
  nextText: string | null;
  /** Private register (null before the first LOAD). */
  reg: number | null;
  /** Current loop iteration, 1-based. */
  iter: number;
  phase: ThreadPhase;
}

export interface ConcAction extends BaseAction {
  type: 'init' | 'exec' | 'block' | 'result';
  tid?: number;
  threads: ThreadSnap[];
  counter: number;
  /** Lock holder tid, or null when free / no lock in this program. */
  lock: number | null;
}

export interface ConcPlan {
  threadCount: number;
  expected: number;
  run: () => Generator<ConcAction, void, unknown>;
}

export interface ConcurrencyAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  setup(data: ParsedInputs): ConcPlan | { error: string };
}

export interface ConcFrame extends BaseFrame {
  threads: ThreadSnap[];
  counter: number;
  lock: number | null;
  /** Executed-instruction history: tid per step. */
  strip: Int8Array;
  executed: number;
  switches: number;
  expected: number;
  /** expected − final counter; filled by the terminal 'result' action. */
  lost: number | null;
}

export const tname = (tid: number) => `T${tid + 1}`;

export const THREAD_INPUTS: InputSpec[] = [
  { key: 'threads', label: 'Threads', kind: 'int', default: '2', min: 2, max: 4 },
  { key: 'increments', label: 'Increments k', kind: 'int', default: '2', min: 1, max: 4, hint: 'counter++ repetitions per thread' },
  { key: 'seed', label: 'Interleaving seed', kind: 'int', default: '7', min: 0, max: 9999, hint: 'Same seed = same interleaving' },
];

/** One machine instruction of the per-thread program. `line` indexes the pseudocode listing. */
export interface Instr {
  op: 'load' | 'inc' | 'store' | 'acquire' | 'release' | 'atomic';
  line: number;
  text: string;
}

/**
 * Build the shared counter simulation: every thread runs `iteration`
 * k times; a seeded RNG picks which runnable thread steps next.
 */
export function makeCounterSim(data: ParsedInputs, iteration: Instr[]): ConcPlan {
  const threadCount = data.threads as number;
  const k = data.increments as number;
  const seed = data.seed as number;
  const flat: Instr[] = [];
  for (let i = 0; i < k; i++) flat.push(...iteration);
  const expected = threadCount * k;

  return {
    threadCount,
    expected,
    *run(): Generator<ConcAction, void, unknown> {
      const rnd = mulberry32(0x51ed + seed * 2654435761);
      const pc = new Array<number>(threadCount).fill(0);
      const reg = new Array<number | null>(threadCount).fill(null);
      const phase = new Array<ThreadPhase>(threadCount).fill('ready');
      let counter = 0;
      let lock: number | null = null;
      let step = 0;

      const snap = (): ThreadSnap[] => Array.from({ length: threadCount }, (_, id) => ({
        id,
        nextLine: pc[id] < flat.length ? flat[pc[id]].line : null,
        nextText: pc[id] < flat.length ? flat[pc[id]].text : null,
        reg: reg[id],
        iter: Math.min(k, Math.floor(pc[id] / iteration.length) + 1),
        phase: phase[id],
      }));
      const lockLabel = () => (lock === null ? 'free' : tname(lock));

      yield { type: 'init', threads: snap(), counter, lock, variables: { expected } };

      for (;;) {
        const runnable: number[] = [];
        for (let id = 0; id < threadCount; id++) {
          if (phase[id] === 'done') continue;
          if (phase[id] === 'blocked' && lock !== null) continue;
          runnable.push(id);
        }
        if (!runnable.length) break;
        const tid = runnable[Math.floor(rnd() * runnable.length)];
        const instr = flat[pc[tid]];

        if (instr.op === 'acquire' && lock !== null && lock !== tid) {
          phase[tid] = 'blocked';
          yield {
            type: 'block', tid, threads: snap(), counter, lock, line: instr.line,
            variables: { step, thread: tname(tid), blockedOn: `lock held by ${lockLabel()}` },
          };
          continue;
        }

        switch (instr.op) {
          case 'load': reg[tid] = counter; break;
          case 'inc': reg[tid] = (reg[tid] ?? 0) + 1; break;
          case 'store': counter = reg[tid] ?? 0; break;
          case 'acquire': lock = tid; phase[tid] = 'ready'; break;
          case 'release':
            lock = null;
            for (let id = 0; id < threadCount; id++) if (phase[id] === 'blocked') phase[id] = 'ready';
            break;
          case 'atomic': counter++; break;
        }
        pc[tid]++;
        if (pc[tid] === flat.length) phase[tid] = 'done';
        step++;
        yield {
          type: 'exec', tid, threads: snap(), counter, lock, line: instr.line,
          variables: { step, thread: tname(tid), instr: instr.text, counter, lock: lockLabel() },
        };
      }

      yield {
        type: 'result', threads: snap(), counter, lock,
        variables: { final: counter, expected, lost: expected - counter },
      };
    },
  };
}

/** Run a concurrency generator to completion and record one frame per step. */
export function buildConcFrames(meta: ConcurrencyAlgorithm, plan: ConcPlan): ConcFrame[] {
  const strip: number[] = [];
  const frames: ConcFrame[] = [];
  let switches = 0, lastTid = -1, line = 0;
  let lost: number | null = null;

  for (const action of plan.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.type === 'exec' && action.tid !== undefined) {
      if (lastTid !== -1 && lastTid !== action.tid) switches++;
      lastTid = action.tid;
      strip.push(action.tid);
    }
    if (action.type === 'result') lost = plan.expected - action.counter;
    frames.push({
      threads: action.threads, counter: action.counter, lock: action.lock,
      strip: Int8Array.from(strip), executed: strip.length, switches,
      expected: plan.expected, lost, variables: action.variables ?? {}, line,
    });
  }
  return frames;
}
