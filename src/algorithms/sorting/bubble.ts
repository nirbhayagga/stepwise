import type { SortingAlgorithm } from './types';

export const bubbleSort: SortingAlgorithm = {
  id: 'bubble',
  name: 'Bubble Sort',
  summary: 'Repeatedly swaps adjacent out-of-order pairs; each pass moves the largest remaining element to its final position.',
  complexity: { time: { best: 'Ω(n)', average: 'Θ(n²)', worst: 'O(n²)' }, space: 'O(1)', tags: ['Stable', 'In-place', 'Adaptive'] },
  pseudocode: [
    'procedure BubbleSort(A[0..n−1])',        // 1
    '  for i ← 0 to n−2',                      // 2
    '    swapped ← false',                     // 3
    '    for j ← 0 to n−i−2',                  // 4
    '      if A[j] > A[j+1] then',             // 5
    '        swap A[j], A[j+1]',               // 6
    '        swapped ← true',                  // 7
    '    if not swapped then break',           // 8
    '  return A',                              // 9
  ],
  *run(a) {
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        yield { type: 'compare', indices: [j, j + 1], line: 5, variables: { i, j, swapped } };
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          yield { type: 'swap', indices: [j, j + 1], line: 6, variables: { i, j, swapped } };
        }
      }
      yield { type: 'sorted', indices: [n - i - 1], line: 8, variables: { i, swapped } };
      if (!swapped) break;
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, k) => k), line: 9 };
  },
};
