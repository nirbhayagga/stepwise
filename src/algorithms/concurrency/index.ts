import { toRegistry } from '../../engine/types';
import type { ConcurrencyAlgorithm } from './types';
import { raceCounter } from './race';
import { mutexCounter } from './mutex';
import { atomicCounter } from './atomic';

export * from './types';

/** Display order. Adding a scenario = one file + one entry here. */
export const CONCURRENCY_LIST: ConcurrencyAlgorithm[] = [
  raceCounter,
  mutexCounter,
  atomicCounter,
];

export const CONCURRENCY = toRegistry(CONCURRENCY_LIST);
export const DEFAULT_CONCURRENCY = raceCounter.id;
