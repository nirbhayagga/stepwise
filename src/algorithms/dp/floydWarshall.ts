import type { DPAlgorithm } from './types';

function parseMatrix(text: string): number[][] | string {
  const rows = text.split(';').map(r => r.trim()).filter(Boolean);
  const n = rows.length;
  if (n < 2) return 'Enter at least two rows (rows separated by ";")';
  if (n > 8) return 'At most 8 vertices';
  const out: number[][] = [];
  for (const row of rows) {
    const cells = row.split(/[\s,]+/).filter(Boolean);
    if (cells.length !== n) return `Each row needs exactly ${n} entries (matrix must be square)`;
    const parsed: number[] = [];
    for (const c of cells) {
      if (c === '-' || c === '∞') parsed.push(Infinity);
      else if (/^-?\d+$/.test(c)) parsed.push(parseInt(c, 10));
      else return `"${c}" is not a weight (use integers or "-" for no edge)`;
    }
    out.push(parsed);
  }
  for (let i = 0; i < n; i++) if (out[i][i] !== 0) return 'Diagonal entries must be 0';
  return out;
}

export const floydWarshall: DPAlgorithm = {
  id: 'floyd-warshall',
  name: 'Floyd–Warshall',
  summary: 'All-pairs shortest paths by dynamic programming over intermediate vertices: after round k, d[i][j] is the shortest path using only intermediates 1..k. Negative edges are fine; a negative diagonal reveals a negative cycle.',
  complexity: { time: { worst: 'O(V³)' }, space: 'O(V²)', tags: ['All-pairs', 'Handles negative edges', 'Bottom-up'] },
  inputs: [
    {
      key: 'matrix', label: 'Weight matrix', kind: 'text',
      default: '0, 3, -, 7;  8, 0, 2, -;  5, -, 0, 1;  2, -, -, 0',
      hint: 'Rows separated by ";", entries by ",". Use "-" for no edge.', maxLength: 400,
    },
  ],
  pseudocode: [
    'procedure FloydWarshall(W[1..n][1..n])',                   // 1
    '  d ← W                        ▷ direct edges',            // 2
    '  for k ← 1 to n               ▷ allowed intermediate',    // 3
    '    for i ← 1 to n',                                       // 4
    '      for j ← 1 to n',                                     // 5
    '        if d[i][k] + d[k][j] < d[i][j] then',              // 6
    '          d[i][j] ← d[i][k] + d[k][j]',                    // 7
    '  if any d[i][i] < 0 then a negative cycle exists',        // 8
    '  return d',                                               // 9
  ],
  setup(data) {
    const parsed = parseMatrix(data.matrix as string);
    if (typeof parsed === 'string') return { error: parsed };
    const w = parsed;
    const n = w.length;
    const lab = Array.from({ length: n }, (_, i) => `v${i + 1}`);
    return {
      rows: n, cols: n,
      rowLabels: lab, colLabels: lab,
      cellMeaning: 'd[i][j] = shortest i→j distance using the intermediates allowed so far',
      *run() {
        const d = w.map(r => r.slice());
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          yield { row: i, col: j, value: d[i][j], line: 2, variables: { i: i + 1, j: j + 1 } };
        }
        for (let k = 0; k < n; k++) {
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              const via = d[i][k] + d[k][j];
              if (via < d[i][j]) {
                d[i][j] = via;
                yield { row: i, col: j, value: via, sources: [[i, k], [k, j]], line: 7, variables: { k: k + 1, i: i + 1, j: j + 1, 'd[i][k]': d[i][k], 'd[k][j]': d[k][j], improved: true } };
              } else {
                yield { row: i, col: j, value: d[i][j], sources: [[i, k], [k, j]], line: 6, variables: { k: k + 1, i: i + 1, j: j + 1, via: via === Infinity ? '∞' : via, improved: false } };
              }
            }
          }
        }
        const negative = d.some((r, i) => r[i] < 0);
        yield { row: n - 1, col: n - 1, value: d[n - 1][n - 1], line: negative ? 8 : 9, variables: { 'negative cycle': negative, result: d[0][n - 1] === Infinity ? '∞' : d[0][n - 1] } };
      },
    };
  },
};
