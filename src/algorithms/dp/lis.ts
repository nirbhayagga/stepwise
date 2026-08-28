import type { DPAlgorithm } from './types';

export const lis: DPAlgorithm = {
  id: 'lis',
  name: 'Longest Increasing Subsequence',
  summary: 'L[i] is the length of the longest strictly increasing subsequence ending at A[i]; each entry looks back at every smaller earlier element.',
  complexity: { time: { worst: 'O(n²)' }, space: 'O(n)', tags: ['Bottom-up', '1-D table'] },
  inputs: [
    { key: 'a', label: 'Sequence A', kind: 'ints', default: '10, 9, 2, 5, 3, 7, 101, 18', maxLength: 16 },
  ],
  pseudocode: [
    'procedure LIS(A[0..n−1])',                              // 1
    '  L[i] ← 1 for all i',                                  // 2
    '  for i ← 1 to n−1',                                    // 3
    '    for j ← 0 to i−1',                                  // 4
    '      if A[j] < A[i] and L[j] + 1 > L[i] then',         // 5
    '        L[i] ← L[j] + 1',                               // 6
    '  return max(L)',                                       // 7
  ],
  setup(d) {
    const a = d.a as number[];
    if (!a.length) return { error: 'Enter at least one value' };
    const n = a.length;
    return {
      rows: 2, cols: n,
      rowLabels: ['A[i]', 'L[i]'],
      colLabels: Array.from({ length: n }, (_, i) => String(i)),
      cellMeaning: 'L[i] = length of the longest increasing subsequence ending at A[i]',
      *run() {
        for (let i = 0; i < n; i++) yield { row: 0, col: i, value: a[i], line: 1, variables: { i } };
        const L = new Array<number>(n).fill(1);
        for (let i = 0; i < n; i++) yield { row: 1, col: i, value: 1, line: 2, variables: { i } };
        for (let i = 1; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] < a[i] && L[j] + 1 > L[i]) {
              L[i] = L[j] + 1;
              yield { row: 1, col: i, value: L[i], sources: [[1, j], [0, j]], line: 6, variables: { i, j, 'A[i]': a[i], 'A[j]': a[j], 'L[j]': L[j], 'L[i]': L[i] } };
            } else {
              yield { row: 1, col: i, value: L[i], sources: [[1, j], [0, j]], line: 5, variables: { i, j, 'A[i]': a[i], 'A[j]': a[j], 'L[j]': L[j], 'L[i]': L[i] } };
            }
          }
        }
        const best = Math.max(...L), at = L.indexOf(best);
        yield { row: 1, col: at, value: best, line: 7, variables: { result: best } };
      },
    };
  },
};
