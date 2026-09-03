import type { ConcurrencyAlgorithm } from './types';
import { THREAD_INPUTS, makeCounterSim } from './types';

export const atomicCounter: ConcurrencyAlgorithm = {
  id: 'atomic-counter',
  name: 'Atomic Counter',
  summary: 'The increment becomes one indivisible hardware instruction (fetch-and-add), so there is nothing to interleave inside it — correct without a lock, and no thread ever blocks.',
  complexity: {
    time: { worst: 'O(k) per thread' }, space: 'O(1) shared',
    tags: ['Lock-free', 'Always correct', 'Hardware atomics'],
  },
  inputs: THREAD_INPUTS,
  pseudocode: [
    'shared counter ← 0',                                                  // 1
    'for i ← 1 to k',                                                      // 2
    '  fetch_add(counter, 1)   ▷ one indivisible instruction',             // 3
  ],
  setup(data) {
    return makeCounterSim(data, [
      { op: 'atomic', line: 3, text: 'fetch_add(counter, 1)' },
    ]);
  },
};
