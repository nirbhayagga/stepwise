import type { SortingAlgorithm } from './types';

/**
 * Deliberately terrible. The input is capped at 7 elements (see `cap`) so the
 * pre-computed timeline stays finite in practice; a hard shuffle limit exists
 * as a statistical safety net and falls back to insertion sort if ever hit.
 */
const MAX_SHUFFLES = 100_000;

export const bogoSort: SortingAlgorithm = {
  id: 'bogo',
  name: 'Bogosort',
  summary: 'Shuffles until the array happens to be sorted — expected (n+1)! shuffles. Input is capped at 7 elements so the recording stays finite.',
  complexity: { time: { best: 'Ω(n)', average: 'Θ((n+1)!)', worst: 'unbounded' }, space: 'O(1)', tags: ['Randomised', 'In-place', 'Educational joke'] },
  cap: 7,
  pseudocode: [
    'procedure BogoSort(A)',              // 1
    '  while not Sorted(A)',              // 2
    '    Shuffle(A)      ▷ Fisher–Yates', // 3
    '  return A',                         // 4
  ],
  *run(a) {
    const n = a.length;
    let shuffles = 0;
    for (;;) {
      let sorted = true;
      for (let i = 0; i + 1 < n; i++) {
        yield { type: 'compare', indices: [i, i + 1], line: 2, variables: { shuffles } };
        if (a[i] > a[i + 1]) { sorted = false; break; }
      }
      if (sorted) break;
      if (shuffles >= MAX_SHUFFLES) {
        // Statistically unreachable with cap 7; sort honestly and say so.
        a.sort((x, y) => x - y);
        yield { type: 'write', indices: Array.from({ length: n }, (_, i) => i), line: 4, variables: { shuffles, gaveUp: true } };
        break;
      }
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      shuffles++;
      yield { type: 'write', indices: Array.from({ length: n }, (_, i) => i), line: 3, variables: { shuffles } };
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, i) => i), line: 4, variables: { shuffles } };
  },
};
