import type { ConcurrencyAlgorithm } from './types';
import { THREAD_INPUTS, makeCounterSim } from './types';

export const mutexCounter: ConcurrencyAlgorithm = {
  id: 'mutex-counter',
  name: 'Counter With a Mutex',
  summary: 'The same racy program with the read–modify–write wrapped in a lock: threads that arrive while it is held block, so the critical section is executed by one thread at a time and no update is lost.',
  complexity: {
    time: { worst: 'O(k) per thread + blocking' }, space: 'O(1) shared',
    tags: ['Mutual exclusion', 'Always correct', 'Threads may block'],
  },
  inputs: THREAD_INPUTS,
  pseudocode: [
    'shared counter ← 0;  lock ← free',                                // 1
    'for i ← 1 to k',                                                  // 2
    '  acquire(lock)      ▷ blocks while another thread holds it',     // 3
    '  r ← counter',                                                   // 4
    '  r ← r + 1',                                                     // 5
    '  counter ← r',                                                   // 6
    '  release(lock)      ▷ wakes every blocked thread',               // 7
  ],
  setup(data) {
    return makeCounterSim(data, [
      { op: 'acquire', line: 3, text: 'acquire(lock)' },
      { op: 'load', line: 4, text: 'r ← counter' },
      { op: 'inc', line: 5, text: 'r ← r + 1' },
      { op: 'store', line: 6, text: 'counter ← r' },
      { op: 'release', line: 7, text: 'release(lock)' },
    ]);
  },
};
