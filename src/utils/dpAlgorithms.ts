export interface DPAction {
  type: 'eval' | 'set';
  row: number;
  col: number;
  value: string | number;
  compareSource?: { r: number; c: number }[];
  variables?: Record<string, any>;
  highlightLine?: number;
}

export function* knapsackGenerator(weights: number[], values: number[], W: number): Generator<DPAction, void, unknown> {
  const n = weights.length;
  const K: number[][] = Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));
  
  for (let i = 0; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (i === 0 || w === 0) {
        K[i][w] = 0;
        yield { type: 'set', row: i+1, col: w+1, value: 0, highlightLine: 4, variables: { i, w } };
      } else if (weights[i - 1] <= w) {
        const opt1 = values[i - 1] + K[i - 1][w - weights[i - 1]];
        const opt2 = K[i - 1][w];
        K[i][w] = Math.max(opt1, opt2);
        yield { 
          type: 'set', row: i+1, col: w+1, value: K[i][w], highlightLine: 9, 
          compareSource: [{r: i, c: w - weights[i - 1] + 1}, {r: i, c: w + 1}],
          variables: { i, w, weight: weights[i-1], value: values[i-1], capacityLeft: w, opt1, opt2, maxChosen: K[i][w] } 
        };
      } else {
        K[i][w] = K[i - 1][w];
        yield { 
          type: 'set', row: i+1, col: w+1, value: K[i][w], highlightLine: 12,
          compareSource: [{r: i, c: w + 1}],
          variables: { i, w, weight: weights[i-1], capacityTooSmall: true, carriedVal: K[i][w] } 
        };
      }
    }
  }
}

export function* lcsGenerator(s1: string, s2: string): Generator<DPAction, void, unknown> {
  const m = s1.length;
  const n = s2.length;
  const L: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0 || j === 0) {
        L[i][j] = 0;
        yield { type: 'set', row: i+1, col: j+1, value: 0, highlightLine: 4, variables: { i, j } };
      } else if (s1[i - 1] === s2[j - 1]) {
        L[i][j] = L[i - 1][j - 1] + 1;
        yield { type: 'set', row: i+1, col: j+1, value: L[i][j], highlightLine: 7, compareSource: [{r: i, c: j}], variables: { i, j, "match": s1[i-1] } };
      } else {
        L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
        yield { type: 'set', row: i+1, col: j+1, value: L[i][j], highlightLine: 9, compareSource: [{r: i, c: j+1}, {r: i+1, c: j}], variables: { i, j, max: L[i][j], s1Char: s1[i-1], s2Char: s2[j-1] } };
      }
    }
  }
}

export const dpAlgorithms = {
  knapsack: knapsackGenerator,
  lcs: lcsGenerator
};
