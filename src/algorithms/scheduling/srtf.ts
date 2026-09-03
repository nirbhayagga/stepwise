import type { SchedAction, SchedulingAlgorithm } from './types';
import { PROC_INPUTS, parseProcs, pname } from './types';

export const srtf: SchedulingAlgorithm = {
  id: 'srtf',
  name: 'Shortest Remaining Time First',
  summary: 'Preemptive SJF: after every tick the ready process with the least remaining work runs, preempting the current one if a shorter job arrives — optimal average waiting time overall.',
  complexity: { time: { worst: 'O(T·n)' }, space: 'O(n)', tags: ['Preemptive', 'Optimal avg waiting', 'Starvation possible'] },
  preemptive: true,
  inputs: PROC_INPUTS,
  pseudocode: [
    'procedure SRTF(P[1..n])              ▷ preemptive SJF',   // 1
    '  t ← 0',                                                 // 2
    '  while some process is unfinished',                      // 3
    '    R ← arrived, unfinished processes',                   // 4
    '    if R = ∅: idle one tick; continue',                   // 5
    '    p ← process in R with least remaining time',          // 6
    '    if p ≠ current: preempt current   ▷ context switch',  // 7
    '    run p for one tick',                                  // 8
    '    if remaining[p] = 0: completion[p] ← t',              // 9
  ],
  setup(data) {
    const procs = parseProcs(data);
    if ('error' in procs) return procs;
    return {
      procs,
      *run(): Generator<SchedAction, void, unknown> {
        const n = procs.length;
        const arrived = new Uint8Array(n);
        const remaining = procs.map(p => p.burst);
        let t = 0, current = -1, left = n;
        const readyQueue = () => {
          const r: number[] = [];
          for (const p of procs) if (arrived[p.id] && remaining[p.id] > 0 && p.id !== current) r.push(p.id);
          r.sort((a, b) => remaining[a] - remaining[b] || procs[a].arrival - procs[b].arrival || a - b);
          return r;
        };
        const admit = function* (now: number): Generator<SchedAction, void, unknown> {
          for (const p of procs) if (!arrived[p.id] && p.arrival <= now) {
            arrived[p.id] = 1;
            yield { type: 'arrive', pid: p.id, queue: readyQueue(), line: 4, variables: { t: now, arrived: pname(p.id), burst: p.burst } };
          }
        }
        yield* admit(0);
        while (left > 0) {
          const candidates = procs.filter(p => arrived[p.id] && remaining[p.id] > 0)
            .sort((a, b) => remaining[a.id] - remaining[b.id] || a.arrival - b.arrival || a.id - b.id);
          if (!candidates.length) {
            yield { type: 'idle', line: 5, variables: { t } };
            t++;
            yield* admit(t);
            continue;
          }
          const pid = candidates[0].id;
          if (pid !== current) {
            if (current !== -1 && remaining[current] > 0) {
              yield { type: 'preempt', pid: current, queue: readyQueue(), line: 7, variables: { t, preempted: pname(current), by: pname(pid) } };
            }
            current = pid;
            yield { type: 'pick', pid, queue: readyQueue(), line: 6, variables: { t, picked: pname(pid), remaining: remaining[pid] } };
          }
          remaining[pid]--;
          yield { type: 'run', pid, line: 8, variables: { t, running: pname(pid), remaining: remaining[pid] } };
          t++;
          yield* admit(t);
          if (remaining[pid] === 0) {
            left--;
            current = -1;
            yield { type: 'finish', pid, line: 9, variables: { t, finished: pname(pid), completion: t } };
          }
        }
      },
    };
  },
};
