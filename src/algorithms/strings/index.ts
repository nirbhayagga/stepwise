import { toRegistry } from '../../engine/types';
import type { StringAlgorithm } from './types';
import { kmp } from './kmp';
import { horspool } from './horspool';
import { rabinKarp } from './rabinKarp';
import { zAlgorithm } from './zAlgorithm';

export * from './types';

/** Display order. Adding an algorithm = one file + one entry here. */
export const STRING_LIST: StringAlgorithm[] = [kmp, horspool, rabinKarp, zAlgorithm];
export const STRINGS = toRegistry(STRING_LIST);
export const DEFAULT_STRING = kmp.id;
