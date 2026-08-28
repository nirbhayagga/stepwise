import type { SortingAlgorithm } from './types';

export const cocktailSort: SortingAlgorithm = {
  id: 'cocktail',
  name: 'Cocktail Shaker Sort',
  summary: 'Bidirectional bubble sort: alternating forward and backward passes settle both the maximum and minimum each round.',
  complexity: { time: { best: 'Ω(n)', average: 'Θ(n²)', worst: 'O(n²)' }, space: 'O(1)', tags: ['Stable', 'In-place', 'Adaptive'] },
  pseudocode: [
    'procedure CocktailSort(A[0..n−1])',                       // 1
    '  lo ← 0; hi ← n−1; swapped ← true',                       // 2
    '  while swapped',                                          // 3
    '    swapped ← false',                                      // 4
    '    for j ← lo to hi−1',                                   // 5
    '      if A[j] > A[j+1] then swap; swapped ← true',         // 6
    '    hi ← hi−1',                                            // 7
    '    if not swapped then break',                            // 8
    '    for j ← hi−1 downto lo',                               // 9
    '      if A[j] > A[j+1] then swap; swapped ← true',         // 10
    '    lo ← lo+1',                                            // 11
    '  return A',                                               // 12
  ],
  *run(a) {
    const n = a.length;
    let lo = 0, hi = n - 1, swapped = true;
    while (swapped) {
      swapped = false;
      for (let j = lo; j < hi; j++) {
        yield { type: 'compare', indices: [j, j + 1], line: 6, variables: { lo, hi, j, pass: 'forward' } };
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          yield { type: 'swap', indices: [j, j + 1], line: 6, variables: { lo, hi, j, pass: 'forward' } };
        }
      }
      yield { type: 'sorted', indices: [hi], line: 7, variables: { lo, hi, swapped } };
      hi--;
      if (!swapped) break;
      swapped = false;
      for (let j = hi - 1; j >= lo; j--) {
        yield { type: 'compare', indices: [j, j + 1], line: 10, variables: { lo, hi, j, pass: 'backward' } };
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          yield { type: 'swap', indices: [j, j + 1], line: 10, variables: { lo, hi, j, pass: 'backward' } };
        }
      }
      yield { type: 'sorted', indices: [lo], line: 11, variables: { lo, hi, swapped } };
      lo++;
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, k) => k), line: 12 };
  },
};
