import type { SortAction, SortingAlgorithm } from './types';

function* siftDown(a: number[], start: number, size: number): Generator<SortAction, void, unknown> {
  let i = start;
  while (2 * i + 1 < size) {
    let child = 2 * i + 1;
    yield { type: 'compare', indices: [], marks: [i, child], line: 9, variables: { i, child, size } };
    if (child + 1 < size) {
      yield { type: 'compare', indices: [child, child + 1], marks: [i], line: 10, variables: { i, child, size } };
      if (a[child + 1] > a[child]) child++;
    }
    yield { type: 'compare', indices: [i, child], line: 11, variables: { i, child, size } };
    if (a[i] >= a[child]) return;
    [a[i], a[child]] = [a[child], a[i]];
    yield { type: 'swap', indices: [i, child], line: 12, variables: { i, child, size } };
    i = child;
  }
}

export const heapSort: SortingAlgorithm = {
  id: 'heap',
  name: 'Heap Sort',
  summary: 'Builds a max-heap in place, then repeatedly moves the root to the end of the array and restores the heap.',
  complexity: { time: { best: 'Ω(n log n)', average: 'Θ(n log n)', worst: 'O(n log n)' }, space: 'O(1)', tags: ['In-place', 'Not stable'] },
  pseudocode: [
    'procedure HeapSort(A[0..n−1])',                                  // 1
    '  for i ← ⌊n/2⌋−1 downto 0        ▷ build max-heap',             // 2
    '    SiftDown(A, i, n)',                                          // 3
    '  for end ← n−1 downto 1',                                       // 4
    '    swap A[0], A[end]',                                          // 5
    '    SiftDown(A, 0, end)',                                        // 6
    'procedure SiftDown(A, i, size)',                                 // 7
    '  while 2i+1 < size',                                            // 8
    '    child ← 2i+1',                                               // 9
    '    if child+1 < size and A[child+1] > A[child] then child++',   // 10
    '    if A[i] ≥ A[child] then return',                             // 11
    '    swap A[i], A[child]; i ← child',                             // 12
  ],
  *run(a) {
    const n = a.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      yield { type: 'compare', indices: [], marks: [i], line: 3, variables: { phase: 'build-heap', i } };
      yield* siftDown(a, i, n);
    }
    for (let end = n - 1; end >= 1; end--) {
      [a[0], a[end]] = [a[end], a[0]];
      yield { type: 'swap', indices: [0, end], line: 5, variables: { phase: 'extract', end } };
      yield { type: 'sorted', indices: [end], line: 6, variables: { phase: 'extract', end } };
      yield* siftDown(a, 0, end);
    }
    yield { type: 'sorted', indices: [0], line: 4 };
  },
};
