import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from '../../engine/types';
import { checkLine } from '../../engine/types';

export interface SchedProcess {
  /** 0-based index; shown to the user as P1..Pn. */
  id: number;
  arrival: number;
  burst: number;
  priority: number;
}

/**
 * One scheduler step. 'run' and 'idle' advance the clock by one tick; the
 * others are instantaneous decisions.
 */
export interface SchedAction extends BaseAction {
  type: 'arrive' | 'pick' | 'run' | 'idle' | 'preempt' | 'finish';
  pid?: number;
  /** Ready-queue order after this step (pids), for display. */
  queue?: number[];
}

export interface SchedPlan {
  procs: SchedProcess[];
  run: () => Generator<SchedAction, void, unknown>;
}

export interface SchedulingAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  preemptive: boolean;
  setup(data: ParsedInputs): SchedPlan | { error: string };
}

export const PROC_STATE = { future: 0, ready: 1, running: 2, done: 3 } as const;

export interface SchedFrame extends BaseFrame {
  time: number;
  /** One entry per elapsed tick: process id, or -1 for an idle CPU. */
  gantt: Int8Array;
  states: Uint8Array;
  remaining: Uint8Array;
  queue: number[];
  completion: (number | null)[];
  contextSwitches: number;
  /** Filled once every process has finished. */
  avgWaiting: number | null;
  avgTurnaround: number | null;
}

/** Inputs shared by every scheduling algorithm (priority/quantum are added per algorithm). */
export const PROC_INPUTS: InputSpec[] = [
  { key: 'arrivals', label: 'Arrival times', kind: 'ints', default: '0, 1, 2, 5, 9', min: 0, max: 50, maxLength: 8, hint: 'One per process, P1..Pn' },
  { key: 'bursts', label: 'Burst times', kind: 'ints', default: '5, 3, 8, 2, 4', min: 1, max: 25, maxLength: 8, hint: 'CPU time each process needs' },
];

export function parseProcs(data: ParsedInputs): SchedProcess[] | { error: string } {
  const arrivals = data.arrivals as number[];
  const bursts = data.bursts as number[];
  const priorities = data.priorities as number[] | undefined;
  if (!arrivals.length) return { error: 'Enter at least one process' };
  if (arrivals.length !== bursts.length) return { error: `Arrival and burst lists must have the same length (${arrivals.length} vs ${bursts.length})` };
  if (priorities && priorities.length !== arrivals.length) return { error: `Priorities must have one value per process (${priorities.length} vs ${arrivals.length})` };
  return arrivals.map((a, i) => ({ id: i, arrival: a, burst: bursts[i], priority: priorities ? priorities[i] : 0 }));
}

export const pname = (pid: number) => `P${pid + 1}`;

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Run a scheduler generator to completion and record one frame per step. */
export function buildSchedFrames(meta: SchedulingAlgorithm, plan: SchedPlan): SchedFrame[] {
  const procs = plan.procs;
  const n = procs.length;
  const gantt: number[] = [];
  const states = new Uint8Array(n); // all 'future'
  const remaining = Uint8Array.from(procs.map(p => p.burst));
  const completion = new Array<number | null>(n).fill(null);
  let queue: number[] = [];
  let time = 0, contextSwitches = 0, lastRun = -1, line = 0;
  const frames: SchedFrame[] = [];

  const push = (variables: Record<string, unknown>) => {
    let avgWaiting: number | null = null, avgTurnaround: number | null = null;
    if (n && completion.every(c => c !== null)) {
      const turnarounds = procs.map((p, i) => completion[i]! - p.arrival);
      avgTurnaround = round2(turnarounds.reduce((a, b) => a + b, 0) / n);
      avgWaiting = round2(turnarounds.reduce((a, t, i) => a + t - procs[i].burst, 0) / n);
    }
    frames.push({
      time, gantt: Int8Array.from(gantt), states: Uint8Array.from(states),
      remaining: Uint8Array.from(remaining), queue: queue.slice(), completion: completion.slice(),
      contextSwitches, avgWaiting, avgTurnaround, variables, line,
    });
  };
  push({});

  for (const action of plan.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.queue) queue = action.queue.slice();
    const pid = action.pid ?? -1;
    switch (action.type) {
      case 'arrive': states[pid] = PROC_STATE.ready; break;
      case 'pick':
        // A switch is only counted between two different processes, not from idle.
        if (lastRun !== -1 && lastRun !== pid) contextSwitches++;
        states[pid] = PROC_STATE.running;
        break;
      case 'run': gantt.push(pid); remaining[pid]--; time++; lastRun = pid; break;
      case 'idle': gantt.push(-1); time++; break;
      case 'preempt': states[pid] = PROC_STATE.ready; break;
      case 'finish': states[pid] = PROC_STATE.done; completion[pid] = time; break;
    }
    push(action.variables ?? {});
  }

  push(frames[frames.length - 1]?.variables ?? {});
  return frames;
}
