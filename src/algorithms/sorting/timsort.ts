import type { SortAction, SortingAlgorithm } from './types';

/**
 * Simplified TimSort: natural runs, binary-insertion extension to minrun,
 * run-stack merge invariants. Galloping mode is omitted for clarity.
 */
function minrunFor(n: number): number {
  let r = 0;
  while (n >= 32) { r |= n & 1; n >>= 1; }
  return n + r;
}

export const timSort: SortingAlgorithm = {
  id: 'timsort',
  name: 'TimSort',
  summary: 'The hybrid merge/insertion sort used by Java and JavaScript (V8), and by Python up to 3.10: finds natural runs, extends short ones with binary insertion, and merges runs under stack invariants (galloping omitted here).',
  complexity: { time: { best: 'Ω(n)', average: 'Θ(n log n)', worst: 'O(n log n)' }, space: 'O(n)', tags: ['Stable', 'Adaptive', 'Hybrid', 'Java & JS built-in sort', 'Python ≤ 3.10'] },
  pseudocode: [
    'procedure TimSort(A[0..n−1])',                              // 1
    '  minrun ← MinRun(n)                    ▷ 16..32 here',     // 2
    '  i ← 0',                                                   // 3
    '  while i < n',                                             // 4
    '    r ← longest ordered run from i (reverse if descending)',// 5
    '    extend r to ≥ minrun by binary insertion',              // 6
    '    push r on the run stack',                               // 7
    '    while stack violates |X| > |Y|+|Z| and |Y| > |Z|',      // 8
    '      merge Y with the smaller of X and Z',                 // 9
    '    i ← end of r',                                          // 10
    '  merge all remaining runs top-down',                       // 11
    '  return A',                                                // 12
  ],
  *run(a) {
    const n = a.length;
    if (n === 0) return;
    const minrun = minrunFor(n);
    const stack: { start: number; len: number }[] = [];
    const lens = () => stack.map(r => r.len);
    yield { type: 'compare', indices: [], line: 2, variables: { n, minrun } };

    function* merge(x: { start: number; len: number }, y: { start: number; len: number }): Generator<SortAction, { start: number; len: number }, unknown> {
      const lo = x.start, mid = x.start + x.len - 1, hi = y.start + y.len - 1;
      const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < L.length && j < R.length) {
        yield { type: 'compare', indices: [k], marks: [lo, hi], line: 9, variables: { merging: `[${lo}..${mid}] + [${mid + 1}..${hi}]`, runs: lens() } };
        a[k] = L[i] <= R[j] ? L[i++] : R[j++];
        yield { type: 'write', indices: [k], marks: [lo, hi], line: 9, variables: { runs: lens() } };
        k++;
      }
      while (i < L.length) { a[k] = L[i++]; yield { type: 'write', indices: [k], marks: [lo, hi], line: 9 }; k++; }
      while (j < R.length) { a[k] = R[j++]; yield { type: 'write', indices: [k], marks: [lo, hi], line: 9 }; k++; }
      return { start: lo, len: x.len + y.len };
    }

    function* mergeAt(idx: number): Generator<SortAction, void, unknown> {
      const merged = yield* merge(stack[idx], stack[idx + 1]);
      stack.splice(idx, 2, merged);
    }

    let i = 0;
    while (i < n) {
      // 1. Find the natural run starting at i.
      let end = i + 1;
      if (end < n) {
        yield { type: 'compare', indices: [i, end], line: 5, variables: { i } };
        if (a[end] < a[i]) {
          while (end + 1 < n && a[end + 1] < a[end]) { yield { type: 'compare', indices: [end, end + 1], line: 5, variables: { i, run: 'descending' } }; end++; }
          for (let l = i, r = end; l < r; l++, r--) {
            [a[l], a[r]] = [a[r], a[l]];
            yield { type: 'swap', indices: [l, r], line: 5, variables: { i, reversing: true } };
          }
        } else {
          while (end + 1 < n && a[end + 1] >= a[end]) { yield { type: 'compare', indices: [end, end + 1], line: 5, variables: { i, run: 'ascending' } }; end++; }
        }
      }
      let runLen = end - i + (end < n ? 1 : 0);
      if (i + runLen > n) runLen = n - i;

      // 2. Extend to minrun with binary insertion sort.
      const target = Math.min(minrun, n - i);
      while (runLen < target) {
        const key = a[i + runLen];
        let lo = i, hi = i + runLen;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          yield { type: 'compare', indices: [mid], marks: [i + runLen], line: 6, variables: { i, key, lo: lo - i, hi: hi - i } };
          if (a[mid] <= key) lo = mid + 1; else hi = mid;
        }
        for (let k = i + runLen; k > lo; k--) {
          a[k] = a[k - 1];
          yield { type: 'write', indices: [k], line: 6, variables: { i, key } };
        }
        a[lo] = key;
        yield { type: 'write', indices: [lo], line: 6, variables: { i, key } };
        runLen++;
      }

      stack.push({ start: i, len: runLen });
      yield { type: 'compare', indices: [], marks: [i, i + runLen - 1], line: 7, variables: { pushed: `[${i}..${i + runLen - 1}]`, runs: lens() } };
      i += runLen;

      // 3. Restore the stack invariants.
      for (;;) {
        const s = stack.length;
        if (s >= 3 && stack[s - 3].len <= stack[s - 2].len + stack[s - 1].len) {
          if (stack[s - 3].len < stack[s - 1].len) { yield* mergeAt(s - 3); } else { yield* mergeAt(s - 2); }
        } else if (s >= 2 && stack[s - 2].len <= stack[s - 1].len) {
          yield* mergeAt(s - 2);
        } else break;
      }
    }
    while (stack.length > 1) {
      yield { type: 'compare', indices: [], line: 11, variables: { runs: lens() } };
      yield* mergeAt(stack.length - 2);
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, k) => k), line: 12 };
  },
};
