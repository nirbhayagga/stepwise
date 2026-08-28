import type { TreeAlgorithm, TreeNode } from './types';
import { KEYS_INPUT } from './types';

/** Render an array-backed heap as a complete binary tree. */
function heapTree(h: number[], size: number, marks: Record<number, TreeNode['state']> = {}): TreeNode | null {
  const build = (i: number): TreeNode | null => {
    if (i >= size) return null;
    return { id: i + 1, key: h[i], left: build(2 * i + 1), right: build(2 * i + 2), state: marks[i] ?? 'default' };
  };
  return build(0);
}

export const heapInsert: TreeAlgorithm = {
  id: 'heap-insert',
  name: 'Binary Max-Heap · Insert',
  summary: 'Array-backed complete binary tree where every parent ≥ its children. A new key is appended as the last leaf and sifted up along its ancestor path.',
  complexity: { time: { worst: 'O(log n) per insert' }, space: 'O(n)', tags: ['Complete tree', 'Array-backed', 'Priority queue'] },
  inputs: [KEYS_INPUT],
  pseudocode: [
    'procedure Insert(H, k)',                                  // 1
    '  i ← size; H[i] ← k; size ← size + 1',                   // 2
    '  while i > 0 and H[⌊(i−1)/2⌋] < H[i]',                   // 3
    '    swap H[i], H[⌊(i−1)/2⌋]',                             // 4
    '    i ← ⌊(i−1)/2⌋',                                       // 5
  ],
  setup(d) {
    const keys = d.keys as number[];
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const h: number[] = [];
        for (const k of keys) {
          let i = h.length;
          h.push(k);
          yield { root: heapTree(h, h.length, { [i]: 'inserted' }), line: 2, variables: { k, i, size: h.length, array: h.slice() } };
          while (i > 0) {
            const p = (i - 1) >> 1;
            yield { root: heapTree(h, h.length, { [i]: 'visiting', [p]: 'visiting' }), line: 3, variables: { k, i, parent: p, 'H[parent]': h[p], 'H[i]': h[i], array: h.slice() } };
            if (h[p] >= h[i]) break;
            [h[p], h[i]] = [h[i], h[p]];
            yield { root: heapTree(h, h.length, { [i]: 'rotating', [p]: 'rotating' }), line: 4, variables: { k, i, parent: p, swapped: true, array: h.slice() } };
            i = p;
          }
        }
        yield { root: heapTree(h, h.length), line: 5, variables: { size: h.length, array: h.slice() } };
      },
    };
  },
};

export const heapExtract: TreeAlgorithm = {
  id: 'heap-extract',
  name: 'Binary Max-Heap · Extract-Max',
  summary: 'Builds the heap, then repeatedly removes the root: the last leaf replaces it and is sifted down toward the larger child. The output sequence is heap sort.',
  complexity: { time: { worst: 'O(log n) per extraction' }, space: 'O(n)', tags: ['Complete tree', 'Array-backed', 'Priority queue'] },
  inputs: [KEYS_INPUT],
  pseudocode: [
    'procedure ExtractMax(H)',                                 // 1
    '  max ← H[0]; H[0] ← H[size−1]; size ← size − 1',         // 2
    '  i ← 0',                                                 // 3
    '  loop',                                                  // 4
    '    l ← 2i+1; r ← 2i+2; m ← i',                           // 5
    '    if l < size and H[l] > H[m] then m ← l',              // 6
    '    if r < size and H[r] > H[m] then m ← r',              // 7
    '    if m = i then break',                                 // 8
    '    swap H[i], H[m]; i ← m',                              // 9
    '  return max',                                            // 10
  ],
  setup(d) {
    const keys = d.keys as number[];
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const h = keys.slice();
        // Bottom-up heapify (Floyd), shown as a single step.
        const sift = (i: number, size: number) => {
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < size && h[l] > h[m]) m = l;
            if (r < size && h[r] > h[m]) m = r;
            if (m === i) return;
            [h[i], h[m]] = [h[m], h[i]];
            i = m;
          }
        };
        for (let i = (h.length >> 1) - 1; i >= 0; i--) sift(i, h.length);
        let size = h.length;
        const output: number[] = [];
        yield { root: heapTree(h, size), output, line: 1, variables: { heapified: h.slice() } };
        while (size > 0) {
          const max = h[0];
          h[0] = h[size - 1];
          size--;
          output.push(max);
          yield { root: heapTree(h, size, { 0: 'inserted' }), output: output.slice(), line: 2, variables: { max, size, array: h.slice(0, size) } };
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < size && h[l] > h[m]) m = l;
            if (r < size && h[r] > h[m]) m = r;
            if (size > 0) yield { root: heapTree(h, size, { [i]: 'visiting', ...(l < size ? { [l]: 'visiting' as const } : {}), ...(r < size ? { [r]: 'visiting' as const } : {}) }), output: output.slice(), line: 7, variables: { i, l, r, m, array: h.slice(0, size) } };
            if (m === i) break;
            [h[i], h[m]] = [h[m], h[i]];
            yield { root: heapTree(h, size, { [i]: 'rotating', [m]: 'rotating' }), output: output.slice(), line: 9, variables: { i, m, swapped: true, array: h.slice(0, size) } };
            i = m;
          }
        }
        yield { root: null, output: output.slice(), line: 10, variables: { output: output.slice() } };
      },
    };
  },
};
