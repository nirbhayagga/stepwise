import type { SortingAlgorithm } from './types';

export const bucketSort: SortingAlgorithm = {
  id: 'bucket',
  name: 'Bucket Sort',
  summary: 'Distributes values into √n buckets by range, insertion-sorts each bucket, and concatenates; linear on average when input is uniformly distributed.',
  complexity: { time: { best: 'Ω(n + k)', average: 'Θ(n + k)', worst: 'O(n²)' }, space: 'O(n + k)', tags: ['Non-comparison distribution', 'Stable', 'Uniform input assumed'] },
  pseudocode: [
    'procedure BucketSort(A[0..n−1], k)',           // 1
    '  B[0..k−1] ← empty buckets',                  // 2
    '  for i ← 0 to n−1',                           // 3
    '    j ← ⌊k · A[i] / (max + 1)⌋',               // 4
    '    append A[i] to B[j]',                      // 5
    '  pos ← 0',                                    // 6
    '  for j ← 0 to k−1',                           // 7
    '    copy B[j] into A[pos..]',                  // 8
    '    InsertionSort(A[pos..pos+|B[j]|−1])',      // 9
    '    pos ← pos + |B[j]|',                       // 10
    '  return A',                                   // 11
  ],
  *run(a) {
    const n = a.length;
    if (n === 0) return;
    const k = Math.max(1, Math.floor(Math.sqrt(n)));
    const max = Math.max(...a);
    const buckets: number[][] = Array.from({ length: k }, () => []);
    yield { type: 'compare', indices: [], line: 2, variables: { n, k, max } };
    for (let i = 0; i < n; i++) {
      const j = Math.min(k - 1, Math.floor((k * a[i]) / (max + 1)));
      buckets[j].push(a[i]);
      yield { type: 'compare', indices: [], marks: [i], line: 5, variables: { i, value: a[i], bucket: j, sizes: buckets.map(b => b.length) } };
    }
    let pos = 0;
    for (let j = 0; j < k; j++) {
      const start = pos;
      for (const v of buckets[j]) {
        a[pos] = v;
        yield { type: 'write', indices: [pos], line: 8, variables: { bucket: j, pos } };
        pos++;
      }
      // Insertion sort within the bucket's segment.
      for (let i = start + 1; i < pos; i++) {
        const key = a[i];
        let m = i - 1;
        while (m >= start) {
          yield { type: 'compare', indices: [m], marks: [start, pos - 1], line: 9, variables: { bucket: j, key } };
          if (a[m] <= key) break;
          a[m + 1] = a[m];
          yield { type: 'write', indices: [m + 1], marks: [start, pos - 1], line: 9, variables: { bucket: j, key } };
          m--;
        }
        a[m + 1] = key;
        yield { type: 'write', indices: [m + 1], marks: [start, pos - 1], line: 9, variables: { bucket: j, key } };
      }
      for (let s = start; s < pos; s++) yield { type: 'sorted', indices: [s], line: 10, variables: { bucket: j } };
    }
    yield { type: 'sorted', indices: Array.from({ length: n }, (_, m) => m), line: 11 };
  },
};
