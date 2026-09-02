import type { BoardAction, BoardAlgorithm } from '../../engine/board';
import { BOARD_STATE as B } from '../../engine/board';
import { ALL, PEERS, UNITS_OF, popcount, lowestDigit, isSingle, cellName, parsePuzzle } from './sudokuShared';

/**
 * Norvig-style solver ported from sudoku.nirbhay.dev: constraint propagation
 * over 9-bit candidate masks (assign/eliminate with naked- and hidden-single
 * cascades) plus depth-first search that always guesses in the
 * most-constrained cell. Faint numbers show each open cell's candidate count.
 */
const DEFAULT_PUZZLE =
  '53..7....' + '6..195...' + '.98....6.' +
  '8...6...3' + '4..8.3..1' + '7...2...6' +
  '.6....28.' + '...419..5' + '....8..79';

export const sudokuCP: BoardAlgorithm = {
  id: 'sudoku-cp',
  name: 'Sudoku · Constraint Propagation + MRV',
  summary: 'The engine behind sudoku.nirbhay.dev: every placement eliminates candidates from 20 peers, single-candidate cells and single-home digits cascade, and when logic stalls the search guesses in the cell with the fewest candidates. Easy puzzles solve with zero guesses.',
  complexity: { time: { average: 'near O(1) per puzzle in practice', worst: 'O(9^cells)' }, space: 'O(cells)', tags: ['Constraint propagation', 'MRV heuristic', 'Norvig-style', 'Bitmasks'] },
  inputs: [{ key: 'puzzle', label: 'Puzzle (81 chars, "." = empty)', kind: 'text', default: DEFAULT_PUZZLE, maxLength: 81 }],
  pseudocode: [
    'procedure Assign(cell, d)      ▷ eliminate all other candidates', // 1
    'procedure Eliminate(cell, d)',                                    // 2
    '  remove d from candidates(cell); contradiction if none left',    // 3
    '  if one candidate remains, eliminate it from all 20 peers',      // 4
    '  if a unit has one home left for d, assign it there',            // 5
    'procedure Search(board)',                                         // 6
    '  if every cell is settled then solved',                          // 7
    '  cell ← open cell with fewest candidates       ▷ MRV',           // 8
    '  for each candidate d of cell',                                  // 9
    '    if Search(Assign(copy, cell, d)) then return it',             // 10
    '  return contradiction                  ▷ backtrack',             // 11
  ],
  setup(data) {
    const parsed = parsePuzzle(data.puzzle as string);
    if (typeof parsed === 'string') return { error: parsed };
    const grid = parsed;
    return {
      rows: 9, cols: 9, boxSize: 3,
      *run(): Generator<BoardAction, void, unknown> {
        const given = grid.map(v => v !== 0);
        let eliminations = 0, guesses = 0, backtracks = 0, logicPlacements = 0;

        function assign(values: Uint16Array, i: number, d: number): Uint16Array | null {
          const others = values[i] & ~(1 << d);
          for (let d2 = 0; d2 < 9; d2++) {
            if (others & (1 << d2)) { if (!eliminate(values, i, d2)) return null; }
          }
          return values;
        }
        function eliminate(values: Uint16Array, i: number, d: number): Uint16Array | null {
          const bit = 1 << d;
          if (!(values[i] & bit)) return values;
          values[i] &= ~bit;
          eliminations++;
          const remaining = values[i];
          if (remaining === 0) return null;
          if (isSingle(remaining)) {
            const only = lowestDigit(remaining);
            for (const p of PEERS[i]) if (!eliminate(values, p, only)) return null;
          }
          for (const unit of UNITS_OF[i]) {
            let places = 0, where = -1;
            for (const c of unit) if (values[c] & bit) { places++; where = c; }
            if (places === 0) return null;
            if (places === 1) { if (!assign(values, where, d)) return null; }
          }
          return values;
        }

        /** Full-board repaint: digits for settled cells, candidate counts for open ones. */
        const paint = (values: Uint16Array): [number, string, number][] =>
          Array.from({ length: 81 }, (_, i) => {
            if (isSingle(values[i])) {
              return [i, String(lowestDigit(values[i]) + 1), given[i] ? B.fixed : B.placed] as [number, string, number];
            }
            return [i, String(popcount(values[i])), B.note] as [number, string, number];
          });
        const solvedCount = (values: Uint16Array) => values.reduce((a, m) => a + (isSingle(m) ? 1 : 0), 0);

        // ── Parse the givens one by one, propagating as we go. ─────────
        let values: Uint16Array | null = new Uint16Array(81).fill(ALL);
        yield { set: paint(values), line: 1, variables: { givens: given.filter(Boolean).length } };
        for (let i = 0; i < 81; i++) {
          if (!grid[i]) continue;
          values = assign(values!, i, grid[i] - 1);
          if (!values) { yield { line: 3, variables: { contradiction: `given at ${cellName(i)}` } }; return; }
          yield { set: paint(values), flash: [[i, B.trying]], line: 4, variables: { placed: `${grid[i]} at ${cellName(i)}`, eliminations, 'cells settled': solvedCount(values) } };
        }
        logicPlacements = solvedCount(values) - given.filter(Boolean).length;
        yield { set: paint(values), line: 5, variables: { 'settled by propagation alone': logicPlacements, eliminations } };

        // ── Depth-first search with MRV. ───────────────────────────────
        const mostConstrained = (v: Uint16Array): number => {
          let best = -1, bestCount = 10;
          for (let i = 0; i < 81; i++) {
            const c = popcount(v[i]);
            if (c > 1 && c < bestCount) { bestCount = c; best = i; if (c === 2) break; }
          }
          return best;
        };

        function* search(v: Uint16Array, depth: number): Generator<BoardAction, Uint16Array | null, unknown> {
          const cell = mostConstrained(v);
          if (cell === -1) return v;
          const mask = v[cell];
          yield { set: paint(v), flash: [[cell, B.trying]], line: 8, variables: { 'MRV cell': cellName(cell), candidates: popcount(mask), depth, guesses, backtracks } };
          for (let d = 0; d < 9; d++) {
            if (!(mask & (1 << d))) continue;
            guesses++;
            const next = assign(Uint16Array.from(v), cell, d);
            if (!next) {
              yield { set: paint(v), flash: [[cell, B.conflict]], line: 10, variables: { guess: `${d + 1} at ${cellName(cell)}`, 'immediate contradiction': true, guesses, backtracks } };
              continue;
            }
            yield { set: paint(next), flash: [[cell, B.trying]], line: 10, variables: { guess: `${d + 1} at ${cellName(cell)}`, 'cells settled': solvedCount(next), depth, guesses } };
            const result = yield* search(next, depth + 1);
            if (result) return result;
            backtracks++;
            yield { set: paint(v), flash: [[cell, B.removed]], line: 11, variables: { 'undo guess': `${d + 1} at ${cellName(cell)}`, guesses, backtracks } };
          }
          return null;
        }

        const solution = yield* search(values, 0);
        if (solution) {
          yield {
            set: Array.from({ length: 81 }, (_, i) => [i, String(lowestDigit(solution[i]) + 1), given[i] ? B.fixed : B.placed] as [number, string, number]),
            line: 7, variables: { solved: true, 'by logic': logicPlacements, guesses, backtracks, eliminations },
          };
        } else {
          yield { line: 11, variables: { solved: false, guesses, backtracks } };
        }
      },
    };
  },
};
