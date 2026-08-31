import { toRegistry } from '../../engine/types';
import type { BoardAlgorithm } from '../../engine/board';
import { nQueens } from './nqueens';
import { sudoku } from './sudoku';

export { BOARD_STATE, buildBoardFrames } from '../../engine/board';
export type { BoardAlgorithm, BoardFrame, BoardSetup } from '../../engine/board';

/** Display order. Adding an algorithm = one file + one entry here. */
export const BACKTRACKING_LIST: BoardAlgorithm[] = [nQueens, sudoku];
export const BACKTRACKING = toRegistry(BACKTRACKING_LIST);
export const DEFAULT_BACKTRACKING = nQueens.id;
