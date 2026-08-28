import type { SortingAlgorithm } from './types';

export const selectionSort: SortingAlgorithm = {
  id: 'selection',
  name: 'Selection Sort',
  summary: 'Selects the minimum of the unsorted suffix and swaps it into place; performs at most n−1 swaps.',
  complexity: { time: { best: 'Ω(n²)', average: 'Θ(n²)', worst: 'O(n²)' }, space: 'O(1)', tags: ['In-place', 'Not stable'] },
  pseudocode: [
    'procedure SelectionSort(A[0..n−1])',           // 1
    '  for i ← 0 to n−2',                            // 2
    '    min ← i',                                   // 3
    '    for j ← i+1 to n−1',                        // 4
    '      if A[j] < A[min] then',                   // 5
    '        min ← j',                               // 6
    '    if min ≠ i then swap A[i], A[min]',         // 7
    '  return A',                                    // 8
  ],
  *run(a) {
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      yield { type: 'compare', indices: [], marks: [min], line: 3, variables: { i, min } };
      for (let j = i + 1; j < n; j++) {
        yield { type: 'compare', indices: [j], marks: [min], line: 5, variables: { i, j, min } };
        if (a[j] < a[min]) {
          min = j;
          yield { type: 'compare', indices: [], marks: [min], line: 6, variables: { i, j, min } };
        }
      }
      if (min !== i) {
        [a[i], a[min]] = [a[min], a[i]];
        yield { type: 'swap', indices: [i, min], line: 7, variables: { i, min } };
      }
      yield { type: 'sorted', indices: [i], line: 7, variables: { i, min } };
    }
    yield { type: 'sorted', indices: [n - 1], line: 8 };
  },
};
