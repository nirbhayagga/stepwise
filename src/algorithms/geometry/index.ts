import { toRegistry } from '../../engine/types';
import type { GeometryAlgorithm } from './types';
import { grahamScan } from './grahamScan';
import { jarvisMarch } from './jarvis';
import { closestPair } from './closestPair';

export * from './types';

/** Display order. Adding an algorithm = one file + one entry here. */
export const GEOMETRY_LIST: GeometryAlgorithm[] = [grahamScan, jarvisMarch, closestPair];
export const GEOMETRY = toRegistry(GEOMETRY_LIST);
export const DEFAULT_GEOMETRY = grahamScan.id;
