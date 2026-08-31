import { toRegistry } from '../../engine/types';
import type { HashAlgorithm } from './types';
import { chaining, linearProbing, quadraticProbing, doubleHashing } from './tables';

export * from './types';

/** Display order. Adding an algorithm = one entry in tables.ts plus here. */
export const HASH_LIST: HashAlgorithm[] = [chaining, linearProbing, quadraticProbing, doubleHashing];
export const HASHING = toRegistry(HASH_LIST);
export const DEFAULT_HASH = chaining.id;
