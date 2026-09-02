import { toRegistry } from '../../engine/types';
import type { TreeAlgorithm } from '../tree/types';
import { fibNaive, fibMemo } from './fib';
import { subsets } from './subsets';
import { permutations } from './permutations';
import { hanoi } from './hanoi';
import { ackermann } from './ackermann';

/** Display order. Adding an algorithm = one file + one entry here. */
export const RECURSION_LIST: TreeAlgorithm[] = [fibNaive, fibMemo, subsets, permutations, hanoi, ackermann];
export const RECURSION = toRegistry(RECURSION_LIST);
export const DEFAULT_RECURSION = fibNaive.id;
