import type { SortingAlgorithm } from './types';

export const radixSort: SortingAlgorithm = {
  id: 'radix',
  name: 'Radix Sort (LSD)',
  summary: 'Distributes elements into ten buckets by each decimal digit, least significant first; stable bucketing makes each pass preserve the previous order.',
  complexity: { time: { best: 'Ω(d·n)', average: 'Θ(d·n)', worst: 'O(d·n)' }, space: 'O(n + 10)', tags: ['Non-comparison', 'Stable', 'Integer keys'] },
  pseudocode: [
    'procedure RadixSort(A[0..n−1])',                         // 1
    '  for exp ← 1; ⌊max/exp⌋ > 0; exp ← exp·10',              // 2
    '    buckets[0..9] ← empty',                               // 3
    '    for i ← 0 to n−1',                                    // 4
    '      d ← ⌊A[i]/exp⌋ mod 10',                             // 5
    '      append A[i] to buckets[d]',                         // 6
    '    i ← 0',                                               // 7
    '    for d ← 0 to 9',                                      // 8
    '      for each v in buckets[d]',                          // 9
    '        A[i] ← v; i ← i+1',                               // 10
    '  return A',                                              // 11
  ],
  *run(a) {
    const n = a.length;
    const max = n ? Math.max(...a) : 0;
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      yield { type: 'compare', indices: [], line: 3, variables: { exp, digit: Math.log10(exp) } };
      for (let i = 0; i < n; i++) {
        const d = Math.floor(a[i] / exp) % 10;
        buckets[d].push(a[i]);
        yield { type: 'compare', indices: [], marks: [i], line: 6, variables: { exp, i, value: a[i], d, 'bucket size': buckets[d].length } };
      }
      let i = 0;
      for (let d = 0; d < 10; d++) {
        for (const v of buckets[d]) {
          a[i] = v;
          yield { type: 'write', indices: [i], line: 10, variables: { exp, d, i, v } };
          i++;
        }
      }
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, i) => i), line: 11 };
  },
};
