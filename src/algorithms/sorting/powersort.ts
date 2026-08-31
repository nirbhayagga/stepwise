import type { SortAction, SortingAlgorithm } from './types';

/**
 * Powersort (Munro & Wild 2018): TimSort's run machinery with a provably
 * near-optimal merge policy — each run boundary gets a "power" from the
 * midpoints of the adjacent runs, and boundaries are merged in power order.
 * This is the merge policy CPython's sorted() uses since Python 3.11.
 */
function minrunFor(n: number): number {
  let r = 0;
  while (n >= 32) { r |= n & 1; n >>= 1; }
  return n + r;
}

/** CPython's powerloop(): node power of the boundary between two adjacent runs. */
function power(s1: number, n1: number, n2: number, n: number): number {
  let result = 0;
  let a = 2 * s1 + n1;
  let b = a + n1 + n2;
  for (;;) {
    result++;
    if (a >= n) { a -= n; b -= n; }
    else if (b >= n) break;
    a <<= 1; b <<= 1;
  }
  return result;
}

export const powerSort: SortingAlgorithm = {
  id: 'powersort',
  name: 'Powersort',
  summary: "TimSort's successor as CPython's merge policy (Python ≥ 3.11, also PyPy): identical runs, but merge order is chosen by boundary \"powers\" derived from run midpoints, which is provably within a constant of the optimal merge tree.",
  complexity: { time: { best: 'Ω(n)', average: 'Θ(n log n)', worst: 'O(n log n)' }, space: 'O(n)', tags: ['Stable', 'Adaptive', 'Hybrid', 'Python ≥ 3.11 sorted()', 'Near-optimal merges'] },
  pseudocode: [
    'procedure PowerSort(A[0..n−1])',                                 // 1
    '  minrun ← MinRun(n)',                                           // 2
    '  i ← 0',                                                        // 3
    '  while i < n',                                                  // 4
    '    r ← next run (reverse if descending, extend to minrun)',     // 5
    '    p ← Power(top run, r)      ▷ from the runs’ midpoints', // 6
    '    while top boundary power > p',                               // 7
    '      merge the top two runs',                                   // 8
    '    push r with boundary power p',                               // 9
    '  merge all remaining runs',                                     // 10
    '  return A',                                                     // 11
  ],
  *run(a) {
    const n = a.length;
    if (n === 0) return;
    const minrun = minrunFor(n);
    // Each entry's `power` is the power of the boundary to its left.
    const stack: { start: number; len: number; power: number }[] = [];
    const lens = () => stack.map(r => `${r.len}(p${r.power})`);
    yield { type: 'compare', indices: [], line: 2, variables: { n, minrun } };

    function* merge(x: { start: number; len: number; power: number }, y: { start: number; len: number }): Generator<SortAction, void, unknown> {
      const lo = x.start, mid = x.start + x.len - 1, hi = y.start + y.len - 1;
      const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < L.length && j < R.length) {
        yield { type: 'compare', indices: [k], marks: [lo, hi], line: 8, variables: { merging: `[${lo}..${mid}] + [${mid + 1}..${hi}]`, runs: lens() } };
        a[k] = L[i] <= R[j] ? L[i++] : R[j++];
        yield { type: 'write', indices: [k], marks: [lo, hi], line: 8 };
        k++;
      }
      while (i < L.length) { a[k] = L[i++]; yield { type: 'write', indices: [k], marks: [lo, hi], line: 8 }; k++; }
      while (j < R.length) { a[k] = R[j++]; yield { type: 'write', indices: [k], marks: [lo, hi], line: 8 }; k++; }
      x.len += y.len;
    }

    let i = 0;
    while (i < n) {
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
      const target = Math.min(minrun, n - i);
      while (runLen < target) {
        const key = a[i + runLen];
        let lo = i, hi = i + runLen;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          yield { type: 'compare', indices: [mid], marks: [i + runLen], line: 5, variables: { i, key } };
          if (a[mid] <= key) lo = mid + 1; else hi = mid;
        }
        for (let k = i + runLen; k > lo; k--) { a[k] = a[k - 1]; yield { type: 'write', indices: [k], line: 5, variables: { i, key } }; }
        a[lo] = key;
        yield { type: 'write', indices: [lo], line: 5, variables: { i, key } };
        runLen++;
      }

      if (stack.length) {
        const top = stack[stack.length - 1];
        const p = power(top.start, top.len, runLen, n);
        yield { type: 'compare', indices: [], marks: [i, i + runLen - 1], line: 6, variables: { boundary: `[${top.start}..] | [${i}..]`, power: p, runs: lens() } };
        while (stack.length > 1 && stack[stack.length - 1].power > p) {
          const y = stack.pop()!;
          yield* merge(stack[stack.length - 1], y);
        }
        stack.push({ start: i, len: runLen, power: p });
      } else {
        stack.push({ start: i, len: runLen, power: 0 });
      }
      yield { type: 'compare', indices: [], marks: [i, i + runLen - 1], line: 9, variables: { runs: lens() } };
      i += runLen;
    }
    while (stack.length > 1) {
      yield { type: 'compare', indices: [], line: 10, variables: { runs: lens() } };
      const y = stack.pop()!;
      yield* merge(stack[stack.length - 1], y);
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, k) => k), line: 11 };
  },
};
