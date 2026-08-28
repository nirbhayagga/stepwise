import type { DPAlgorithm } from './types';

export const lcs: DPAlgorithm = {
  id: 'lcs',
  name: 'Longest Common Subsequence',
  summary: 'L[i][j] is the LCS length of the prefixes X[1..i] and Y[1..j]; a match extends the diagonal, otherwise the better neighbour is carried over.',
  complexity: { time: { worst: 'O(m·n)' }, space: 'O(m·n)', tags: ['Bottom-up', 'String'] },
  inputs: [
    { key: 'x', label: 'String X', kind: 'text', default: 'AGGTAB', maxLength: 14 },
    { key: 'y', label: 'String Y', kind: 'text', default: 'GXTXAYB', maxLength: 14 },
  ],
  pseudocode: [
    'procedure LCS(X[1..m], Y[1..n])',                    // 1
    '  L[i][0] ← 0;  L[0][j] ← 0',                        // 2
    '  for i ← 1 to m',                                   // 3
    '    for j ← 1 to n',                                 // 4
    '      if X[i] = Y[j] then',                          // 5
    '        L[i][j] ← L[i−1][j−1] + 1',                  // 6
    '      else',                                         // 7
    '        L[i][j] ← max(L[i−1][j], L[i][j−1])',        // 8
    '  return L[m][n]',                                   // 9
  ],
  setup(d) {
    const x = d.x as string, y = d.y as string;
    if (!x.length || !y.length) return { error: 'Both strings must be non-empty' };
    const m = x.length, n = y.length;
    return {
      rows: m + 1, cols: n + 1,
      rowLabels: ['ε', ...x.split('')],
      colLabels: ['ε', ...y.split('')],
      cellMeaning: 'L[i][j] = LCS length of X[1..i] and Y[1..j]',
      *run() {
        const L = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
        for (let j = 0; j <= n; j++) yield { row: 0, col: j, value: 0, line: 2, variables: { i: 0, j } };
        for (let i = 1; i <= m; i++) {
          yield { row: i, col: 0, value: 0, line: 2, variables: { i, j: 0 } };
          for (let j = 1; j <= n; j++) {
            if (x[i - 1] === y[j - 1]) {
              L[i][j] = L[i - 1][j - 1] + 1;
              yield { row: i, col: j, value: L[i][j], sources: [[i - 1, j - 1]], line: 6, variables: { i, j, 'X[i]': x[i - 1], 'Y[j]': y[j - 1], match: true } };
            } else {
              L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
              yield { row: i, col: j, value: L[i][j], sources: [[i - 1, j], [i, j - 1]], line: 8, variables: { i, j, 'X[i]': x[i - 1], 'Y[j]': y[j - 1], match: false, up: L[i - 1][j], left: L[i][j - 1] } };
            }
          }
        }
        yield { row: m, col: n, value: L[m][n], line: 9, variables: { result: L[m][n] } };
      },
    };
  },
};
