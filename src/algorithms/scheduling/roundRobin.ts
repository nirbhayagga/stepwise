import type { SchedAction, SchedulingAlgorithm } from './types';
import { PROC_INPUTS, parseProcs, pname } from './types';

export const roundRobin: SchedulingAlgorithm = {
  id: 'rr',
  name: 'Round Robin',
  summary: 'Every ready process gets the CPU for at most one quantum, then goes to the back of a circular queue — no starvation and good response time, at the cost of context switches.',
  complexity: { time: { worst: 'O(T)' }, space: 'O(n)', tags: ['Preemptive', 'Fair', 'No starvation', 'Quantum trade-off'] },
  preemptive: true,
  inputs: [
    ...PROC_INPUTS,
    { key: 'quantum', label: 'Quantum q', kind: 'int', default: '2', min: 1, max: 12 },
  ],
  pseudocode: [
    'procedure RoundRobin(P[1..n], q)',                        // 1
    '  t ← 0;  Q ← empty FIFO queue',                          // 2
    '  while some process is unfinished',                      // 3
    '    add processes arriving by t to the back of Q',        // 4
    '    if Q = ∅: idle one tick; continue',                   // 5
    '    p ← pop front of Q',                                  // 6
    '    run p for min(q, remaining[p]) ticks',                // 7
    '    if remaining[p] = 0: completion[p] ← t',              // 8
    '    else: push p to the back of Q   ▷ after new arrivals',// 9
  ],
  setup(data) {
    const procs = parseProcs(data);
    if ('error' in procs) return procs;
    const q = data.quantum as number;
    return {
      procs,
      *run(): Generator<SchedAction, void, unknown> {
        const n = procs.length;
        const arrived = new Uint8Array(n);
        const remaining = procs.map(p => p.burst);
        const queue: number[] = [];
        let t = 0, left = n;
        const admit = function* (now: number): Generator<SchedAction, void, unknown> {
          const order = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
          for (const p of order) if (!arrived[p.id] && p.arrival <= now) {
            arrived[p.id] = 1;
            queue.push(p.id);
            yield { type: 'arrive', pid: p.id, queue: [...queue], line: 4, variables: { t: now, arrived: pname(p.id) } };
          }
        }
        yield* admit(0);
        while (left > 0) {
          if (!queue.length) {
            yield { type: 'idle', line: 5, variables: { t } };
            t++;
            yield* admit(t);
            continue;
          }
          const pid = queue.shift()!;
          const slice = Math.min(q, remaining[pid]);
          yield { type: 'pick', pid, queue: [...queue], line: 6, variables: { t, picked: pname(pid), slice, remaining: remaining[pid] } };
          for (let k = 0; k < slice; k++) {
            remaining[pid]--;
            yield { type: 'run', pid, line: 7, variables: { t, running: pname(pid), remaining: remaining[pid], sliceLeft: slice - k - 1 } };
            t++;
            yield* admit(t);
          }
          if (remaining[pid] === 0) {
            left--;
            yield { type: 'finish', pid, line: 8, variables: { t, finished: pname(pid), completion: t } };
          } else {
            queue.push(pid);
            yield { type: 'preempt', pid, queue: [...queue], line: 9, variables: { t, requeued: pname(pid), remaining: remaining[pid] } };
          }
        }
      },
    };
  },
};
