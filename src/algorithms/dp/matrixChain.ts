import type { DPAlgorithm } from './types';

export const matrixChain: DPAlgorithm = {
  id: 'matrix-chain',
  name: 'Matrix-Chain Multiplication',
  summary: 'm[i][j] is the minimum scalar multiplications to compute Aᵢ⋯Aⱼ; the table is filled by increasing chain length along the diagonals.',
  complexity: { time: { worst: 'O(n³)' }, space: 'O(n²)', tags: ['Interval DP', 'Bottom-up'] },
  inputs: [
    { key: 'p', label: 'Dimensions p₀..pₙ', kind: 'ints', default: '30, 35, 15, 5, 10, 20, 25', min: 1, maxLength: 9, hint: 'Aᵢ is pᵢ₋₁ × pᵢ' },
  ],
  pseudocode: [
    'procedure MatrixChain(p[0..n])            ▷ Aᵢ is p[i−1] × p[i]',   // 1
    '  m[i][i] ← 0 for all i',                                           // 2
    '  for len ← 2 to n',                                                // 3
    '    for i ← 1 to n − len + 1',                                      // 4
    '      j ← i + len − 1;  m[i][j] ← ∞',                               // 5
    '      for k ← i to j − 1',                                          // 6
    '        q ← m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j]',                // 7
    '        if q < m[i][j] then m[i][j] ← q;  s[i][j] ← k',             // 8
    '  return m[1][n]',                                                  // 9
  ],
  setup(d) {
    const p = d.p as number[];
    if (p.length < 3) return { error: 'Enter at least three dimensions (two matrices)' };
    const n = p.length - 1;
    const lab = Array.from({ length: n }, (_, i) => `A${i + 1}`);
    return {
      rows: n, cols: n,
      rowLabels: lab, colLabels: lab,
      cellMeaning: 'm[i][j] = minimum scalar multiplications for Aᵢ⋯Aⱼ',
      *run() {
        const m = Array.from({ length: n + 1 }, () => new Array<number>(n + 1).fill(0));
        for (let i = 1; i <= n; i++) yield { row: i - 1, col: i - 1, value: 0, line: 2, variables: { i } };
        for (let len = 2; len <= n; len++) {
          for (let i = 1; i <= n - len + 1; i++) {
            const j = i + len - 1;
            m[i][j] = Infinity;
            yield { row: i - 1, col: j - 1, value: Infinity, line: 5, variables: { len, i, j } };
            let best = -1;
            for (let k = i; k < j; k++) {
              const q = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
              const improved = q < m[i][j];
              if (improved) { m[i][j] = q; best = k; }
              yield { row: i - 1, col: j - 1, value: m[i][j], sources: [[i - 1, k - 1], [k, j - 1]], line: improved ? 8 : 7, variables: { len, i, j, k, q, 'm[i][k]': m[i][k], 'm[k+1][j]': m[k + 1][j], 'p[i−1]·p[k]·p[j]': p[i - 1] * p[k] * p[j], 's[i][j]': best } };
            }
          }
        }
        yield { row: 0, col: n - 1, value: m[1][n], line: 9, variables: { result: m[1][n] } };
      },
    };
  },
};
