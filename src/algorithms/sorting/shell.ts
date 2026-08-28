import type { SortingAlgorithm } from './types';

export const shellSort: SortingAlgorithm = {
  id: 'shell',
  name: 'Shell Sort',
  summary: 'Insertion sort over elements a gap apart, with the gap halving each round (Shell’s original sequence).',
  complexity: { time: { best: 'Ω(n log n)', average: '≈ Θ(n^1.5)', worst: 'O(n²)' }, space: 'O(1)', tags: ['In-place', 'Not stable', 'Adaptive'] },
  pseudocode: [
    'procedure ShellSort(A[0..n−1])',           // 1
    '  gap ← ⌊n/2⌋',                             // 2
    '  while gap > 0',                           // 3
    '    for i ← gap to n−1',                    // 4
    '      tmp ← A[i]; j ← i',                   // 5
    '      while j ≥ gap and A[j−gap] > tmp',    // 6
    '        A[j] ← A[j−gap]',                   // 7
    '        j ← j−gap',                         // 8
    '      A[j] ← tmp',                          // 9
    '    gap ← ⌊gap/2⌋',                         // 10
    '  return A',                                // 11
  ],
  *run(a) {
    const n = a.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      yield { type: 'compare', indices: [], line: 3, variables: { gap } };
      for (let i = gap; i < n; i++) {
        const tmp = a[i];
        let j = i;
        yield { type: 'compare', indices: [], marks: [i], line: 5, variables: { gap, i, j, tmp } };
        while (j >= gap) {
          yield { type: 'compare', indices: [j - gap], marks: [j], line: 6, variables: { gap, i, j, tmp } };
          if (a[j - gap] <= tmp) break;
          a[j] = a[j - gap];
          yield { type: 'write', indices: [j], line: 7, variables: { gap, i, j, tmp } };
          j -= gap;
        }
        a[j] = tmp;
        yield { type: 'write', indices: [j], line: 9, variables: { gap, i, j, tmp } };
      }
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, k) => k), line: 11 };
  },
};
