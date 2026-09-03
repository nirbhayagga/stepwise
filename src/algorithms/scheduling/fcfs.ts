import type { SchedAction, SchedulingAlgorithm } from './types';
import { PROC_INPUTS, parseProcs, pname } from './types';

export const fcfs: SchedulingAlgorithm = {
  id: 'fcfs',
  name: 'First-Come First-Served',
  summary: 'Runs processes to completion in arrival order; simple and starvation-free, but one long burst at the front delays everything behind it (the convoy effect).',
  complexity: { time: { worst: 'O(n log n)' }, space: 'O(n)', tags: ['Non-preemptive', 'FIFO', 'Convoy effect'] },
  preemptive: false,
  inputs: PROC_INPUTS,
  pseudocode: [
    'procedure FCFS(P[1..n])',                                // 1
    '  sort P by arrival time',                               // 2
    '  t ← 0',                                                // 3
    '  for each process p in order',                          // 4
    '    while t < p.arrival: idle one tick   ▷ CPU waits',   // 5
    '    run p for p.burst ticks',                            // 6
    '    completion[p] ← t',                                  // 7
  ],
  setup(data) {
    const procs = parseProcs(data);
    if ('error' in procs) return procs;
    return {
      procs,
      *run(): Generator<SchedAction, void, unknown> {
        const order = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
        const queue: number[] = [];
        const arrived = new Uint8Array(procs.length);
        let t = 0;
        const admit = function* (now: number): Generator<SchedAction, void, unknown> {
          for (const p of order) if (!arrived[p.id] && p.arrival <= now) {
            arrived[p.id] = 1;
            queue.push(p.id);
            yield { type: 'arrive', pid: p.id, queue: [...queue], line: 2, variables: { t: now, arrived: pname(p.id) } };
          }
        }
        yield* admit(0);
        for (const p of order) {
          while (t < p.arrival) {
            yield { type: 'idle', line: 5, variables: { t, waitingFor: pname(p.id) } };
            t++;
            yield* admit(t);
          }
          queue.splice(queue.indexOf(p.id), 1);
          yield { type: 'pick', pid: p.id, queue: [...queue], line: 4, variables: { t, next: pname(p.id) } };
          for (let k = 0; k < p.burst; k++) {
            yield { type: 'run', pid: p.id, line: 6, variables: { t, running: pname(p.id), remaining: p.burst - k - 1 } };
            t++;
            yield* admit(t);
          }
          yield { type: 'finish', pid: p.id, line: 7, variables: { t, finished: pname(p.id), completion: t } };
        }
      },
    };
  },
};
