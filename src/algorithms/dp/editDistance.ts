import type { DPAlgorithm } from './types';

export const editDistance: DPAlgorithm = {
  id: 'edit-distance',
  name: 'Edit Distance (Levenshtein)',
  summary: 'D[i][j] is the minimum number of insertions, deletions and substitutions turning A[1..i] into B[1..j].',
  complexity: { time: { worst: 'O(m·n)' }, space: 'O(m·n)', tags: ['Bottom-up', 'String'] },
  inputs: [
    { key: 'a', label: 'String A', kind: 'text', default: 'KITTEN', maxLength: 14 },
    { key: 'b', label: 'String B', kind: 'text', default: 'SITTING', maxLength: 14 },
  ],
  pseudocode: [
    'procedure EditDistance(A[1..m], B[1..n])',            // 1
    '  D[i][0] ← i;  D[0][j] ← j',                         // 2
    '  for i ← 1 to m',                                    // 3
    '    for j ← 1 to n',                                  // 4
    '      cost ← 0 if A[i] = B[j] else 1',                // 5
    '      D[i][j] ← min(D[i−1][j] + 1,       ▷ delete',   // 6
    '                    D[i][j−1] + 1,       ▷ insert',   // 7
    '                    D[i−1][j−1] + cost)  ▷ replace',  // 8
    '  return D[m][n]',                                    // 9
  ],
  setup(d) {
    const a = d.a as string, b = d.b as string;
    const m = a.length, n = b.length;
    return {
      rows: m + 1, cols: n + 1,
      rowLabels: ['ε', ...a.split('')],
      colLabels: ['ε', ...b.split('')],
      cellMeaning: 'D[i][j] = edit distance between A[1..i] and B[1..j]',
      *run() {
        const D = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
        for (let j = 0; j <= n; j++) { D[0][j] = j; yield { row: 0, col: j, value: j, line: 2, variables: { i: 0, j } }; }
        for (let i = 1; i <= m; i++) {
          D[i][0] = i;
          yield { row: i, col: 0, value: i, line: 2, variables: { i, j: 0 } };
          for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const del = D[i - 1][j] + 1, ins = D[i][j - 1] + 1, rep = D[i - 1][j - 1] + cost;
            D[i][j] = Math.min(del, ins, rep);
            const op = D[i][j] === rep ? (cost ? 'replace' : 'match') : D[i][j] === del ? 'delete' : 'insert';
            yield { row: i, col: j, value: D[i][j], sources: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], line: cost ? 8 : 5, variables: { i, j, 'A[i]': a[i - 1], 'B[j]': b[j - 1], cost, delete: del, insert: ins, replace: rep, op } };
          }
        }
        yield { row: m, col: n, value: D[m][n], line: 9, variables: { result: D[m][n] } };
      },
    };
  },
};
