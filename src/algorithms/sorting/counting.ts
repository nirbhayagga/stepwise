import type { SortingAlgorithm } from './types';

export const countingSort: SortingAlgorithm = {
  id: 'counting',
  name: 'Counting Sort',
  summary: 'Non-comparison sort for small integer keys: tallies occurrences of each value, then writes values back in order (simple, unstable variant).',
  complexity: { time: { best: 'Ω(n + k)', average: 'Θ(n + k)', worst: 'O(n + k)' }, space: 'O(k)', tags: ['Non-comparison', 'Integer keys', 'Not in-place'] },
  pseudocode: [
    'procedure CountingSort(A[0..n−1], k)   ▷ keys in 0..k',   // 1
    '  count[0..k] ← 0',                                       // 2
    '  for i ← 0 to n−1',                                      // 3
    '    count[A[i]] ← count[A[i]] + 1',                       // 4
    '  idx ← 0',                                               // 5
    '  for v ← 0 to k',                                        // 6
    '    while count[v] > 0',                                  // 7
    '      A[idx] ← v; idx ← idx+1',                           // 8
    '      count[v] ← count[v] − 1',                           // 9
    '  return A',                                              // 10
  ],
  *run(a) {
    const n = a.length;
    const k = n ? Math.max(...a) : 0;
    const count = new Array<number>(k + 1).fill(0);
    yield { type: 'compare', indices: [], line: 2, variables: { n, k } };
    for (let i = 0; i < n; i++) {
      count[a[i]]++;
      yield { type: 'compare', indices: [], marks: [i], line: 4, variables: { i, value: a[i], 'count[value]': count[a[i]] } };
    }
    let idx = 0;
    for (let v = 0; v <= k; v++) {
      if (count[v] === 0) continue;
      yield { type: 'compare', indices: [], marks: [idx], line: 7, variables: { v, 'count[v]': count[v], idx } };
      while (count[v] > 0) {
        a[idx] = v;
        count[v]--;
        yield { type: 'write', indices: [idx], line: 8, variables: { v, 'count[v]': count[v], idx } };
        yield { type: 'sorted', indices: [idx], line: 9, variables: { v, 'count[v]': count[v], idx } };
        idx++;
      }
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, i) => i), line: 10 };
  },
};
