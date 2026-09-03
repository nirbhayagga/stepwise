import type { SchedAction, SchedulingAlgorithm } from './types';
import { PROC_INPUTS, parseProcs, pname } from './types';

export const sjf: SchedulingAlgorithm = {
  id: 'sjf',
  name: 'Shortest Job First',
  summary: 'At every decision point runs the ready process with the smallest burst to completion — provably the best average waiting time among non-preemptive schedulers, but long jobs can starve.',
  complexity: { time: { worst: 'O(n²)' }, space: 'O(n)', tags: ['Non-preemptive', 'Min avg waiting (non-preemptive)', 'Starvation possible'] },
  preemptive: false,
  inputs: PROC_INPUTS,
  pseudocode: [
    'procedure SJF(P[1..n])                ▷ non-preemptive',   // 1
    '  t ← 0',                                                  // 2
    '  while some process is unfinished',                       // 3
    '    R ← arrived, unstarted processes',                     // 4
    '    if R = ∅: idle one tick; continue',                    // 5
    '    p ← process in R with smallest burst',                 // 6
    '    run p for p.burst ticks',                              // 7
    '    completion[p] ← t',                                    // 8
  ],
  setup(data) {
    const procs = parseProcs(data);
    if ('error' in procs) return procs;
    return {
      procs,
      *run(): Generator<SchedAction, void, unknown> {
        const arrived = new Uint8Array(procs.length);
        let ready: number[] = [];
        let t = 0;
        const sortReady = () => { ready.sort((a, b) => procs[a].burst - procs[b].burst || procs[a].arrival - procs[b].arrival || a - b); };
        const admit = function* (now: number): Generator<SchedAction, void, unknown> {
          for (const p of procs) if (!arrived[p.id] && p.arrival <= now) {
            arrived[p.id] = 1;
            ready.push(p.id);
            sortReady();
            yield { type: 'arrive', pid: p.id, queue: [...ready], line: 4, variables: { t: now, arrived: pname(p.id), burst: p.burst } };
          }
        }
        yield* admit(0);
        let left = procs.length;
        while (left > 0) {
          if (!ready.length) {
            yield { type: 'idle', line: 5, variables: { t } };
            t++;
            yield* admit(t);
            continue;
          }
          const pid = ready.shift()!;
          const p = procs[pid];
          yield { type: 'pick', pid, queue: [...ready], line: 6, variables: { t, picked: pname(pid), burst: p.burst } };
          for (let k = 0; k < p.burst; k++) {
            yield { type: 'run', pid, line: 7, variables: { t, running: pname(pid), remaining: p.burst - k - 1 } };
            t++;
            yield* admit(t);
          }
          left--;
          yield { type: 'finish', pid, line: 8, variables: { t, finished: pname(pid), completion: t } };
        }
      },
    };
  },
};
