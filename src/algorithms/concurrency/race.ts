import type { ConcurrencyAlgorithm } from './types';
import { THREAD_INPUTS, makeCounterSim } from './types';

export const raceCounter: ConcurrencyAlgorithm = {
  id: 'race-counter',
  name: 'Counter Without a Lock',
  summary: 'Every thread increments a shared counter, but counter++ is really three instructions — interleave two threads between the LOAD and the STORE and one increment silently vanishes.',
  complexity: {
    time: { worst: 'O(k) per thread' }, space: 'O(1) shared',
    tags: ['Data race', 'Lost updates', 'Result depends on interleaving'],
  },
  inputs: THREAD_INPUTS,
  pseudocode: [
    'shared counter ← 0            ▷ every thread runs this code',   // 1
    'for i ← 1 to k',                                                // 2
    '  r ← counter        ▷ LOAD into a private register',           // 3
    '  r ← r + 1          ▷ INC the private copy',                   // 4
    '  counter ← r        ▷ STORE — may overwrite a newer value',    // 5
  ],
  setup(data) {
    return makeCounterSim(data, [
      { op: 'load', line: 3, text: 'r ← counter' },
      { op: 'inc', line: 4, text: 'r ← r + 1' },
      { op: 'store', line: 5, text: 'counter ← r' },
    ]);
  },
};
