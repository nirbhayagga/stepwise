import type { DPAlgorithm } from './types';

export const coinChange: DPAlgorithm = {
  id: 'coin-change',
  name: 'Coin Change (min coins)',
  summary: 'C[i][s] is the fewest coins from the first i denominations that sum to s; each coin may be reused, so the "take" case looks left in the same row.',
  complexity: { time: { worst: 'O(k·S)' }, space: 'O(k·S)', tags: ['Unbounded', 'Bottom-up'] },
  inputs: [
    { key: 'coins', label: 'Denominations', kind: 'ints', default: '1, 3, 4', min: 1, maxLength: 8 },
    { key: 'sum', label: 'Target sum S', kind: 'int', default: '10', min: 1, max: 30 },
  ],
  pseudocode: [
    'procedure CoinChange(coin[1..k], S)',                                      // 1
    '  C[0][0] ← 0;  C[0][s] ← ∞ for s > 0',                                    // 2
    '  for i ← 1 to k',                                                         // 3
    '    for s ← 0 to S',                                                       // 4
    '      C[i][s] ← C[i−1][s]                              ▷ skip coin i',     // 5
    '      if coin[i] ≤ s and C[i][s − coin[i]] + 1 < C[i][s] then',            // 6
    '        C[i][s] ← C[i][s − coin[i]] + 1               ▷ use coin i again', // 7
    '  return C[k][S]',                                                         // 8
  ],
  setup(d) {
    const coins = d.coins as number[], S = d.sum as number;
    if (!coins.length) return { error: 'Enter at least one denomination' };
    const k = coins.length;
    return {
      rows: k + 1, cols: S + 1,
      rowLabels: ['∅', ...coins.map(c => `coin ${c}`)],
      colLabels: Array.from({ length: S + 1 }, (_, s) => String(s)),
      cellMeaning: 'C[i][s] = fewest coins from the first i denominations summing to s',
      *run() {
        const C = Array.from({ length: k + 1 }, () => new Array<number>(S + 1).fill(Infinity));
        C[0][0] = 0;
        for (let s = 0; s <= S; s++) yield { row: 0, col: s, value: C[0][s], line: 2, variables: { i: 0, s } };
        for (let i = 1; i <= k; i++) {
          const coin = coins[i - 1];
          for (let s = 0; s <= S; s++) {
            C[i][s] = C[i - 1][s];
            if (coin <= s && C[i][s - coin] + 1 < C[i][s]) {
              C[i][s] = C[i][s - coin] + 1;
              yield { row: i, col: s, value: C[i][s], sources: [[i - 1, s], [i, s - coin]], line: 7, variables: { i, s, coin, skip: C[i - 1][s], use: C[i][s] } };
            } else {
              yield { row: i, col: s, value: C[i][s], sources: coin <= s ? [[i - 1, s], [i, s - coin]] : [[i - 1, s]], line: 5, variables: { i, s, coin, skip: C[i - 1][s], use: coin <= s ? C[i][s - coin] + 1 : '—' } };
            }
          }
        }
        yield { row: k, col: S, value: C[k][S], line: 8, variables: { result: C[k][S] } };
      },
    };
  },
};
