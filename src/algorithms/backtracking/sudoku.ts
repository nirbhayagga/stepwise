import type { BoardAction, BoardAlgorithm } from '../../engine/board';
import { BOARD_STATE as B } from '../../engine/board';

const DEFAULT_PUZZLE =
  '53..7....' + '6..195...' + '.98....6.' +
  '8...6...3' + '4..8.3..1' + '7...2...6' +
  '.6....28.' + '...419..5' + '....8..79';

const MAX_STEPS = 60_000;

export const sudoku: BoardAlgorithm = {
  id: 'sudoku',
  name: 'Sudoku Solver',
  summary: 'Fills the first empty cell with the smallest digit that respects row, column and 3×3 box, recursing and unwinding on dead ends — the same pruned depth-first search as N-Queens with three constraints.',
  complexity: { time: { worst: 'O(9^cells)' }, space: 'O(cells)', tags: ['Backtracking', 'Constraint pruning'] },
  inputs: [{ key: 'puzzle', label: 'Puzzle (81 chars, "." = empty)', kind: 'text', default: DEFAULT_PUZZLE, maxLength: 81 }],
  pseudocode: [
    'procedure Solve(board)',                                       // 1
    '  cell ← first empty cell; if none then solved',               // 2
    '  for digit ← 1 to 9',                                         // 3
    '    if digit conflicts in row, column or box then skip',       // 4
    '    write digit',                                              // 5
    '    if Solve(board) then return true',                         // 6
    '    erase digit                       ▷ backtrack',            // 7
    '  return false',                                               // 8
  ],
  setup(d) {
    const raw = (d.puzzle as string).replace(/[^0-9.]/g, '');
    if (raw.length !== 81) return { error: `Puzzle must have exactly 81 cells (got ${raw.length})` };
    const grid = raw.split('').map(c => (c === '.' || c === '0' ? 0 : Number(c)));
    return {
      rows: 9, cols: 9, boxSize: 3,
      *run(): Generator<BoardAction, void, unknown> {
        const given = grid.map(v => v !== 0);
        yield {
          set: grid.flatMap((v, i) => (v ? [[i, String(v), B.fixed] as [number, string, number]] : [])),
          line: 1, variables: { givens: given.filter(Boolean).length },
        };
        let steps = 0, backtracks = 0;
        const ok = (i: number, dgt: number): boolean => {
          const r = Math.floor(i / 9), c = i % 9;
          for (let k = 0; k < 9; k++) {
            if (grid[r * 9 + k] === dgt || grid[k * 9 + c] === dgt) return false;
          }
          const br = r - (r % 3), bc = c - (c % 3);
          for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) if (grid[(br + dr) * 9 + bc + dc] === dgt) return false;
          return true;
        };
        function* solve(): Generator<BoardAction, boolean, unknown> {
          const i = grid.indexOf(0);
          if (i === -1) return true;
          for (let dgt = 1; dgt <= 9; dgt++) {
            if (++steps > MAX_STEPS) return false;
            if (!ok(i, dgt)) {
              yield { flash: [[i, B.conflict]], line: 4, variables: { cell: `(${Math.floor(i / 9)}, ${i % 9})`, digit: dgt, steps, backtracks } };
              continue;
            }
            grid[i] = dgt;
            yield { set: [[i, String(dgt), B.placed]], line: 5, variables: { cell: `(${Math.floor(i / 9)}, ${i % 9})`, digit: dgt, steps, backtracks } };
            if (yield* solve()) return true;
            grid[i] = 0;
            backtracks++;
            yield { set: [[i, null, B.empty]], flash: [[i, B.removed]], line: 7, variables: { cell: `(${Math.floor(i / 9)}, ${i % 9})`, steps, backtracks } };
          }
          return false;
        }
        const solved = yield* solve();
        yield { line: solved ? 2 : 8, variables: { solved, steps, backtracks } };
      },
    };
  },
};
