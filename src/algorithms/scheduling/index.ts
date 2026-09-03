import { toRegistry } from '../../engine/types';
import type { SchedulingAlgorithm } from './types';
import { fcfs } from './fcfs';
import { sjf } from './sjf';
import { srtf } from './srtf';
import { roundRobin } from './roundRobin';
import { priorityNP } from './priority';

export * from './types';

/** Display order. Adding an algorithm = one file + one entry here. */
export const SCHEDULING_LIST: SchedulingAlgorithm[] = [
  fcfs,
  sjf,
  srtf,
  roundRobin,
  priorityNP,
];

export const SCHEDULING = toRegistry(SCHEDULING_LIST);
export const DEFAULT_SCHEDULING = fcfs.id;
