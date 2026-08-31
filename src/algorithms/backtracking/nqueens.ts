import type { BoardAction, BoardAlgorithm } from '../../engine/board';
import { BOARD_STATE as B } from '../../engine/board';

const Q = '♛';

export const nQueens: BoardAlgorithm = {
  id: 'n-queens',
  name: 'N-Queens',
  summary: 'Places one queen per row and backtracks the moment a column or diagonal conflict appears; the recursion tree is pruned at the first violated constraint. Stops at the first solution.',
  complexity: { time: { worst: 'O(n!)' }, space: 'O(n)', tags: ['Backtracking', 'Constraint pruning', 'First solution'] },
  inputs: [{ key: 'n', label: 'Board size n', kind: 'int', default: '6', min: 4, max: 10 }],
  pseudocode: [
    'procedure Solve(row)',                                    // 1
    '  if row = n then report the solution',                   // 2
    '  for col ← 0 to n−1',                                    // 3
    '    if (row, col) is attacked then skip',                 // 4
    '    place queen at (row, col)',                           // 5
    '    if Solve(row + 1) then return true',                  // 6
    '    remove the queen              ▷ backtrack',           // 7
    '  return false',                                          // 8
  ],
  setup(d) {
    const n = d.n as number;
    return {
      rows: n, cols: n,
      *run(): Generator<BoardAction, void, unknown> {
        const colOf = new Array<number>(n).fill(-1);
        let attempts = 0, backtracks = 0;
        const at = (r: number, c: number) => r * n + c;
        const attacker = (row: number, col: number): number => {
          for (let r = 0; r < row; r++) {
            const c = colOf[r];
            if (c === col || Math.abs(c - col) === row - r) return r;
          }
          return -1;
        };
        function* solve(row: number): Generator<BoardAction, boolean, unknown> {
          if (row === n) return true;
          for (let col = 0; col < n; col++) {
            attempts++;
            const atk = attacker(row, col);
            if (atk >= 0) {
              yield { flash: [[at(row, col), B.conflict], [at(atk, colOf[atk]), B.conflict]], line: 4, variables: { row, col, 'attacked by row': atk, attempts, backtracks } };
              continue;
            }
            colOf[row] = col;
            yield { set: [[at(row, col), Q, B.placed]], line: 5, variables: { row, col, attempts, backtracks } };
            if (yield* solve(row + 1)) return true;
            colOf[row] = -1;
            backtracks++;
            yield { set: [[at(row, col), null, B.empty]], flash: [[at(row, col), B.removed]], line: 7, variables: { row, col, attempts, backtracks } };
          }
          return false;
        }
        const ok = yield* solve(0);
        if (ok) {
          yield {
            set: colOf.map((c, r) => [at(r, c), Q, B.fixed] as [number, string, number]),
            line: 2, variables: { solution: colOf.join(' '), attempts, backtracks },
          };
        } else {
          yield { line: 8, variables: { result: 'no solution', attempts, backtracks } };
        }
      },
    };
  },
};
