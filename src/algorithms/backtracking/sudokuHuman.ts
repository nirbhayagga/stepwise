import type { BoardAction, BoardAlgorithm } from '../../engine/board';
import { BOARD_STATE as B } from '../../engine/board';
import { ALL, UNIT_LIST, PEERS, popcount, lowestDigit, isSingle, cellName, parsePuzzle } from './sudokuShared';

/**
 * Solves the way a person does, using the technique ladder from
 * sudoku.nirbhay.dev: cheap placements first (naked/hidden singles), then
 * candidate eliminations (naked pairs/triples, pointing pairs, X-Wing) to
 * unlock the next placement. No guessing — if the ladder stalls, it stops.
 */
type Technique = 'naked single' | 'hidden single' | 'naked pair' | 'pointing pair' | 'naked triple' | 'X-Wing';
type Step =
  | { kind: 'place'; technique: Technique; cell: number; digit: number; why: string; involved: number[] }
  | { kind: 'eliminate'; technique: Technique; removals: [cell: number, digit: number][]; why: string; involved: number[] };

const rowOf = (i: number) => Math.floor(i / 9);
const colOf = (i: number) => i % 9;
const unitName = (u: number) => (u < 9 ? `row ${u + 1}` : u < 18 ? `column ${u - 8}` : `box ${u - 17}`);

function findStep(cand: Uint16Array, solvedMask: boolean[]): Step | null {
  // 1. Naked single: a cell with one candidate left.
  for (let i = 0; i < 81; i++) {
    if (!solvedMask[i] && isSingle(cand[i])) {
      return { kind: 'place', technique: 'naked single', cell: i, digit: lowestDigit(cand[i]) + 1, why: 'naked single', involved: [i] };
    }
  }
  // 2. Hidden single: a digit with one home in a unit.
  for (let u = 0; u < UNIT_LIST.length; u++) {
    for (let d = 0; d < 9; d++) {
      const homes = UNIT_LIST[u].filter(c => !solvedMask[c] && (cand[c] & (1 << d)));
      if (homes.length === 1) {
        return { kind: 'place', technique: 'hidden single', cell: homes[0], digit: d + 1, why: `hidden single in ${unitName(u)}`, involved: UNIT_LIST[u] };
      }
    }
  }
  // 3. Naked pair: two cells in a unit with the same two candidates.
  for (let u = 0; u < UNIT_LIST.length; u++) {
    const open = UNIT_LIST[u].filter(c => !solvedMask[c]);
    for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
      const m = cand[open[a]];
      if (popcount(m) !== 2 || cand[open[b]] !== m) continue;
      const removals: [number, number][] = [];
      for (const c of open) {
        if (c === open[a] || c === open[b]) continue;
        for (let d = 0; d < 9; d++) if (m & (1 << d) & cand[c]) removals.push([c, d]);
      }
      if (removals.length) return { kind: 'eliminate', technique: 'naked pair', removals, why: `naked pair in ${unitName(u)}`, involved: [open[a], open[b]] };
    }
  }
  // 4. Pointing pair: a digit confined to one row/column of a box.
  for (let bu = 18; bu < 27; bu++) {
    for (let d = 0; d < 9; d++) {
      const homes = UNIT_LIST[bu].filter(c => !solvedMask[c] && (cand[c] & (1 << d)));
      if (homes.length < 2 || homes.length > 3) continue;
      for (const axis of ['row', 'col'] as const) {
        const of = axis === 'row' ? rowOf : colOf;
        if (!homes.every(c => of(c) === of(homes[0]))) continue;
        const line = axis === 'row' ? UNIT_LIST[of(homes[0])] : UNIT_LIST[9 + of(homes[0])];
        const removals: [number, number][] = line
          .filter(c => !solvedMask[c] && !UNIT_LIST[bu].includes(c) && (cand[c] & (1 << d)))
          .map(c => [c, d] as [number, number]);
        if (removals.length) return { kind: 'eliminate', technique: 'pointing pair', removals, why: `pointing pair: ${d + 1} in ${unitName(bu)}`, involved: homes };
      }
    }
  }
  // 5. Naked triple: three cells in a unit covering only three digits.
  for (let u = 0; u < UNIT_LIST.length; u++) {
    const open = UNIT_LIST[u].filter(c => !solvedMask[c] && popcount(cand[c]) <= 3);
    for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) for (let c3 = b + 1; c3 < open.length; c3++) {
      const m = cand[open[a]] | cand[open[b]] | cand[open[c3]];
      if (popcount(m) !== 3) continue;
      const trio = [open[a], open[b], open[c3]];
      const removals: [number, number][] = [];
      for (const c of UNIT_LIST[u]) {
        if (solvedMask[c] || trio.includes(c)) continue;
        for (let d = 0; d < 9; d++) if (m & (1 << d) & cand[c]) removals.push([c, d]);
      }
      if (removals.length) return { kind: 'eliminate', technique: 'naked triple', removals, why: `naked triple in ${unitName(u)}`, involved: trio };
    }
  }
  // 6. X-Wing: a digit forming a rectangle over two rows (or columns).
  for (const axis of ['row', 'col'] as const) {
    for (let d = 0; d < 9; d++) {
      const linesWithTwo: [number, number[]][] = [];
      for (let l = 0; l < 9; l++) {
        const line = axis === 'row' ? UNIT_LIST[l] : UNIT_LIST[9 + l];
        const homes = line.filter(c => !solvedMask[c] && (cand[c] & (1 << d)));
        if (homes.length === 2) linesWithTwo.push([l, homes.map(axis === 'row' ? colOf : rowOf)]);
      }
      for (let a = 0; a < linesWithTwo.length; a++) for (let b = a + 1; b < linesWithTwo.length; b++) {
        const [l1, cross1] = linesWithTwo[a], [l2, cross2] = linesWithTwo[b];
        if (cross1[0] !== cross2[0] || cross1[1] !== cross2[1]) continue;
        const removals: [number, number][] = [];
        const involved: number[] = [];
        for (const cross of cross1) {
          const line = axis === 'row' ? UNIT_LIST[9 + cross] : UNIT_LIST[cross];
          for (const c of line) {
            const own = axis === 'row' ? rowOf(c) : colOf(c);
            if (own === l1 || own === l2) { involved.push(c); continue; }
            if (!solvedMask[c] && (cand[c] & (1 << d))) removals.push([c, d]);
          }
        }
        if (removals.length) return { kind: 'eliminate', technique: 'X-Wing', removals, why: `X-Wing on ${d + 1} (${axis}s ${l1 + 1} & ${l2 + 1})`, involved };
      }
    }
  }
  return null;
}

const DEFAULT_PUZZLE = '001050000200070080690004000000000800000980630000007450002106000000090000080002049';

export const sudokuHuman: BoardAlgorithm = {
  id: 'sudoku-human',
  name: 'Sudoku · Human Techniques',
  summary: 'No guessing at all: the technique ladder from sudoku.nirbhay.dev — naked and hidden singles for placements, then naked pairs/triples, pointing pairs and X-Wings to prune candidates until the next placement appears. Stops honestly if the ladder stalls.',
  complexity: { time: { worst: 'O(technique scans × cells)' }, space: 'O(cells)', tags: ['No search', 'Technique ladder', 'X-Wing', 'sudoku.nirbhay.dev'] },
  inputs: [{ key: 'puzzle', label: 'Puzzle (81 chars, "." = empty)', kind: 'text', default: DEFAULT_PUZZLE, maxLength: 81 }],
  pseudocode: [
    'loop until solved or stuck',                                       // 1
    '  naked single: a cell with one candidate → place it',             // 2
    '  hidden single: a digit with one home in a unit → place it',      // 3
    '  naked pair: two cells own two digits → prune them elsewhere',    // 4
    '  pointing pair: digit stuck in one line of a box → prune line',   // 5
    '  naked triple: three cells own three digits → prune them',        // 6
    '  X-Wing: digit in a rectangle → prune its two crossing lines',    // 7
    '  if no technique applies then stuck (a solver would guess now)',  // 8
  ],
  setup(data) {
    const parsed = parsePuzzle(data.puzzle as string);
    if (typeof parsed === 'string') return { error: parsed };
    const grid = parsed;
    return {
      rows: 9, cols: 9, boxSize: 3,
      *run(): Generator<BoardAction, void, unknown> {
        const given = grid.map(v => v !== 0);
        const solved = grid.map(v => v !== 0);
        const cand = new Uint16Array(81).fill(ALL);
        const place = (i: number, digit: number) => {
          cand[i] = 1 << (digit - 1);
          solved[i] = true;
          for (const p of PEERS[i]) cand[p] &= ~(1 << (digit - 1));
        };
        for (let i = 0; i < 81; i++) if (grid[i]) place(i, grid[i]);

        const paint = (): [number, string, number][] =>
          Array.from({ length: 81 }, (_, i) => {
            if (solved[i]) return [i, String(lowestDigit(cand[i]) + 1), given[i] ? B.fixed : B.placed] as [number, string, number];
            return [i, String(popcount(cand[i])), B.note] as [number, string, number];
          });

        const counts: Record<string, number> = {};
        const LINES: Record<string, number> = { 'naked single': 2, 'hidden single': 3, 'naked pair': 4, 'pointing pair': 5, 'naked triple': 6, 'X-Wing': 7 };
        yield { set: paint(), line: 1, variables: { givens: given.filter(Boolean).length } };

        for (;;) {
          if (solved.every(Boolean)) {
            yield { set: paint(), line: 1, variables: { solved: true, ...counts } };
            return;
          }
          const step = findStep(cand, solved);
          if (!step) {
            yield { set: paint(), line: 8, variables: { solved: false, stuck: true, 'open cells': solved.filter(v => !v).length, ...counts } };
            return;
          }
          counts[step.technique] = (counts[step.technique] ?? 0) + 1;
          const line = LINES[step.technique];
          if (step.kind === 'place') {
            yield { set: paint(), flash: step.involved.map(c => [c, B.trying] as [number, number]), line, variables: { technique: step.why, place: `${step.digit} at ${cellName(step.cell)}`, ...counts } };
            place(step.cell, step.digit);
            yield { set: paint(), flash: [[step.cell, B.trying]], line, variables: { technique: step.why, placed: `${step.digit} at ${cellName(step.cell)}`, ...counts } };
          } else {
            yield {
              set: paint(),
              flash: [...step.involved.map(c => [c, B.trying] as [number, number]), ...step.removals.map(([c]) => [c, B.conflict] as [number, number])],
              line,
              variables: { technique: step.why, removes: step.removals.map(([c, d]) => `${d + 1} from ${cellName(c)}`).join(', '), ...counts },
            };
            for (const [c, d] of step.removals) cand[c] &= ~(1 << d);
            yield { set: paint(), line, variables: { technique: step.why, eliminated: step.removals.length, ...counts } };
          }
        }
      },
    };
  },
};
