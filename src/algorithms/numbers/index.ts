import { toRegistry } from '../../engine/types';
import type { BoardAlgorithm } from '../../engine/board';
import { sieve } from './sieve';

export { BOARD_STATE, buildBoardFrames } from '../../engine/board';
export type { BoardAlgorithm, BoardFrame, BoardSetup } from '../../engine/board';

/** Display order. Adding an algorithm = one file + one entry here. */
export const NUMBERS_LIST: BoardAlgorithm[] = [sieve];
export const NUMBERS = toRegistry(NUMBERS_LIST);
export const DEFAULT_NUMBERS = sieve.id;
