import { toRegistry } from '../../engine/types';
import type { DPAlgorithm } from './types';
import { knapsack } from './knapsack';
import { lcs } from './lcs';
import { editDistance } from './editDistance';
import { coinChange } from './coinChange';
import { lis } from './lis';
import { matrixChain } from './matrixChain';

export * from './types';

/** Display order. Adding an algorithm = one file + one entry here. */
export const DP_LIST: DPAlgorithm[] = [knapsack, lcs, editDistance, coinChange, lis, matrixChain];
export const DP = toRegistry(DP_LIST);
export const DEFAULT_DP = knapsack.id;
