import { toRegistry } from '../../engine/types';
import type { SortingAlgorithm } from './types';
import { bubbleSort } from './bubble';
import { cocktailSort } from './cocktail';
import { selectionSort } from './selection';
import { insertionSort } from './insertion';
import { shellSort } from './shell';
import { mergeSort } from './merge';
import { quickSort } from './quick';
import { heapSort } from './heap';
import { countingSort } from './counting';
import { radixSort } from './radix';

export * from './types';

/** Display order. Adding an algorithm = one file + one entry here. */
export const SORTING_LIST: SortingAlgorithm[] = [
  bubbleSort,
  cocktailSort,
  selectionSort,
  insertionSort,
  shellSort,
  mergeSort,
  quickSort,
  heapSort,
  countingSort,
  radixSort,
];

export const SORTING = toRegistry(SORTING_LIST);
export const DEFAULT_SORT = bubbleSort.id;
