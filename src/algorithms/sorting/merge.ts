import type { SortAction, SortingAlgorithm } from './types';

function* merge(a: number[], lo: number, mid: number, hi: number): Generator<SortAction, void, unknown> {
  const L = a.slice(lo, mid + 1);
  const R = a.slice(mid + 1, hi + 1);
  let i = 0, j = 0, k = lo;
  yield { type: 'compare', indices: [], marks: [lo, mid, hi], line: 8, variables: { lo, mid, hi } };
  while (i < L.length && j < R.length) {
    yield { type: 'compare', indices: [lo + i, mid + 1 + j], marks: [lo, hi], line: 10, variables: { lo, mid, hi, i, j, k } };
    if (L[i] <= R[j]) {
      a[k] = L[i++];
      yield { type: 'write', indices: [k], marks: [lo, hi], line: 11, variables: { lo, mid, hi, i, j, k } };
    } else {
      a[k] = R[j++];
      yield { type: 'write', indices: [k], marks: [lo, hi], line: 12, variables: { lo, mid, hi, i, j, k } };
    }
    k++;
  }
  while (i < L.length) {
    a[k] = L[i++];
    yield { type: 'write', indices: [k], marks: [lo, hi], line: 14, variables: { lo, mid, hi, i, j, k } };
    k++;
  }
  while (j < R.length) {
    a[k] = R[j++];
    yield { type: 'write', indices: [k], marks: [lo, hi], line: 14, variables: { lo, mid, hi, i, j, k } };
    k++;
  }
}

function* sort(a: number[], lo: number, hi: number): Generator<SortAction, void, unknown> {
  if (lo >= hi) return;
  const mid = lo + Math.floor((hi - lo) / 2);
  yield { type: 'compare', indices: [], marks: [lo, mid, hi], line: 3, variables: { lo, mid, hi } };
  yield* sort(a, lo, mid);
  yield* sort(a, mid + 1, hi);
  yield* merge(a, lo, mid, hi);
}

export const mergeSort: SortingAlgorithm = {
  id: 'merge',
  name: 'Merge Sort',
  summary: 'Divides the array in half recursively and merges the sorted halves; guarantees n log n comparisons.',
  complexity: { time: { best: 'Ω(n log n)', average: 'Θ(n log n)', worst: 'O(n log n)' }, space: 'O(n)', tags: ['Stable', 'Not in-place', 'Divide & conquer'] },
  pseudocode: [
    'procedure MergeSort(A, lo, hi)',                          // 1
    '  if lo ≥ hi then return',                                // 2
    '  mid ← ⌊(lo+hi)/2⌋',                                     // 3
    '  MergeSort(A, lo, mid)',                                 // 4
    '  MergeSort(A, mid+1, hi)',                               // 5
    '  Merge(A, lo, mid, hi)',                                 // 6
    'procedure Merge(A, lo, mid, hi)',                         // 7
    '  L ← A[lo..mid]; R ← A[mid+1..hi]',                      // 8
    '  i ← 0; j ← 0; k ← lo',                                  // 9
    '  while i < |L| and j < |R|',                             // 10
    '    if L[i] ≤ R[j] then A[k] ← L[i]; i ← i+1',            // 11
    '    else A[k] ← R[j]; j ← j+1',                           // 12
    '    k ← k+1',                                             // 13
    '  copy remaining L, then R, into A[k..hi]',               // 14
  ],
  *run(a) {
    yield* sort(a, 0, a.length - 1);
    yield { type: 'sorted', indices: Array.from({ length: a.length }, (_, k) => k), line: 6 };
  },
};
