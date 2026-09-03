import type { SortAction, SortingAlgorithm } from './types';

function* partition(a: number[], lo: number, hi: number): Generator<SortAction, number, unknown> {
  const pivot = a[hi];
  let i = lo - 1;
  yield { type: 'compare', indices: [], marks: [hi], line: 7, variables: { lo, hi, pivot, i } };
  for (let j = lo; j < hi; j++) {
    yield { type: 'compare', indices: [j], marks: [hi], line: 9, variables: { lo, hi, pivot, i, j } };
    if (a[j] < pivot) {
      i++;
      [a[i], a[j]] = [a[j], a[i]];
      yield { type: 'swap', indices: [i, j], marks: [hi], line: 10, variables: { lo, hi, pivot, i, j } };
    }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  yield { type: 'swap', indices: [i + 1, hi], line: 11, variables: { lo, hi, pivot, i } };
  yield { type: 'sorted', indices: [i + 1], line: 12, variables: { lo, hi, pivot, p: i + 1 } };
  return i + 1;
}

function* sort(a: number[], lo: number, hi: number): Generator<SortAction, void, unknown> {
  if (lo < hi) {
    yield { type: 'compare', indices: [], marks: [lo, hi], line: 2, variables: { lo, hi } };
    const p = yield* partition(a, lo, hi);
    yield* sort(a, lo, p - 1);
    yield* sort(a, p + 1, hi);
  } else if (lo === hi) {
    yield { type: 'sorted', indices: [lo], line: 2, variables: { lo, hi } };
  }
}

export const quickSort: SortingAlgorithm = {
  id: 'quick',
  name: 'Quick Sort',
  summary: 'Partitions around a pivot (Lomuto scheme, last element) and recurses on both sides; quadratic only on adversarial input.',
  complexity: { time: { best: 'Ω(n log n)', average: 'Θ(n log n)', worst: 'O(n²)' }, space: 'O(log n)', recurrence: 'T(n) = 2T(n/2) + Θ(n) on average ⇒ Θ(n log n); T(n) = T(n−1) + Θ(n) ⇒ Θ(n²) worst', tags: ['In-place', 'Not stable', 'Divide & conquer'] },
  pseudocode: [
    'procedure QuickSort(A, lo, hi)',              // 1
    '  if lo < hi then',                           // 2
    '    p ← Partition(A, lo, hi)',                // 3
    '    QuickSort(A, lo, p−1)',                   // 4
    '    QuickSort(A, p+1, hi)',                   // 5
    'procedure Partition(A, lo, hi)',              // 6
    '  pivot ← A[hi]; i ← lo−1',                   // 7
    '  for j ← lo to hi−1',                        // 8
    '    if A[j] < pivot then',                    // 9
    '      i ← i+1; swap A[i], A[j]',              // 10
    '  swap A[i+1], A[hi]',                        // 11
    '  return i+1',                                // 12
  ],
  *run(a) {
    yield* sort(a, 0, a.length - 1);
    yield { type: 'sorted', indices: Array.from({ length: a.length }, (_, k) => k), line: 5 };
  },
};
