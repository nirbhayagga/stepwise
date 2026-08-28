import type { DPAlgorithm } from './types';

export const knapsack: DPAlgorithm = {
  id: 'knapsack',
  name: '0/1 Knapsack',
  summary: 'K[i][c] is the best value using the first i items within capacity c; each item is either skipped or taken once.',
  complexity: { time: { worst: 'O(n·W)' }, space: 'O(n·W)', tags: ['Pseudo-polynomial', 'Bottom-up'] },
  inputs: [
    { key: 'weights', label: 'Weights', kind: 'ints', default: '1, 3, 4, 5', min: 1, maxLength: 12 },
    { key: 'values', label: 'Values', kind: 'ints', default: '1, 4, 5, 7', min: 0, maxLength: 12 },
    { key: 'capacity', label: 'Capacity W', kind: 'int', default: '7', min: 1, max: 30 },
  ],
  pseudocode: [
    'procedure Knapsack(w[1..n], v[1..n], W)',                       // 1
    '  K[0][c] ← 0 for c = 0..W;  K[i][0] ← 0 for i = 0..n',         // 2
    '  for i ← 1 to n',                                              // 3
    '    for c ← 1 to W',                                            // 4
    '      if w[i] > c then',                                        // 5
    '        K[i][c] ← K[i−1][c]                     ▷ cannot take', // 6
    '      else',                                                    // 7
    '        K[i][c] ← max(K[i−1][c], v[i] + K[i−1][c − w[i]])',     // 8
    '  return K[n][W]',                                              // 9
  ],
  setup(d) {
    const w = d.weights as number[], v = d.values as number[], W = d.capacity as number;
    if (w.length !== v.length) return { error: 'Weights and values must have the same length' };
    if (w.length === 0) return { error: 'Enter at least one item' };
    const n = w.length;
    return {
      rows: n + 1, cols: W + 1,
      rowLabels: ['∅', ...w.map((wi, i) => `w${i + 1}=${wi} v=${v[i]}`)],
      colLabels: Array.from({ length: W + 1 }, (_, c) => String(c)),
      cellMeaning: 'K[i][c] = max value using items 1..i with capacity c',
      *run() {
        const K = Array.from({ length: n + 1 }, () => new Array<number>(W + 1).fill(0));
        for (let c = 0; c <= W; c++) yield { row: 0, col: c, value: 0, line: 2, variables: { i: 0, c } };
        for (let i = 1; i <= n; i++) {
          yield { row: i, col: 0, value: 0, line: 2, variables: { i, c: 0 } };
          for (let c = 1; c <= W; c++) {
            if (w[i - 1] > c) {
              K[i][c] = K[i - 1][c];
              yield { row: i, col: c, value: K[i][c], sources: [[i - 1, c]], line: 6, variables: { i, c, 'w[i]': w[i - 1], 'v[i]': v[i - 1], skip: K[i - 1][c] } };
            } else {
              const take = v[i - 1] + K[i - 1][c - w[i - 1]];
              const skip = K[i - 1][c];
              K[i][c] = Math.max(take, skip);
              yield { row: i, col: c, value: K[i][c], sources: [[i - 1, c], [i - 1, c - w[i - 1]]], line: 8, variables: { i, c, 'w[i]': w[i - 1], 'v[i]': v[i - 1], skip, take, chosen: take > skip ? 'take' : 'skip' } };
            }
          }
        }
        yield { row: n, col: W, value: K[n][W], line: 9, variables: { result: K[n][W] } };
      },
    };
  },
};
