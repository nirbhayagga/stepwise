import type { SortingAlgorithm } from './types';

export const insertionSort: SortingAlgorithm = {
  id: 'insertion',
  name: 'Insertion Sort',
  summary: 'Grows a sorted prefix by shifting larger elements right and inserting each key at its position.',
  complexity: { time: { best: 'Ω(n)', average: 'Θ(n²)', worst: 'O(n²)' }, space: 'O(1)', tags: ['Stable', 'In-place', 'Adaptive', 'Online'] },
  pseudocode: [
    'procedure InsertionSort(A[0..n−1])',     // 1
    '  for i ← 1 to n−1',                      // 2
    '    key ← A[i]; j ← i−1',                 // 3
    '    while j ≥ 0 and A[j] > key',          // 4
    '      A[j+1] ← A[j]',                     // 5
    '      j ← j−1',                           // 6
    '    A[j+1] ← key',                        // 7
    '  return A',                              // 8
  ],
  *run(a) {
    const n = a.length;
    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      yield { type: 'compare', indices: [], marks: [i], line: 3, variables: { i, j, key } };
      while (j >= 0) {
        yield { type: 'compare', indices: [j], marks: [j + 1], line: 4, variables: { i, j, key } };
        if (a[j] <= key) break;
        a[j + 1] = a[j];
        yield { type: 'write', indices: [j + 1], line: 5, variables: { i, j, key } };
        j--;
      }
      a[j + 1] = key;
      yield { type: 'write', indices: [j + 1], line: 7, variables: { i, j, key } };
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, k) => k), line: 8 };
  },
};
