import type { ArrayBar } from '../composables/useSorting';

export type SortActionType = 'compare' | 'swap' | 'sorted';

export interface SortAction {
  type: SortActionType;
  indices: number[];
  variables?: Record<string, any>;
  highlightLine?: number;
}

export function* bubbleSortGenerator(array: ArrayBar[]): Generator<SortAction, void, unknown> {
  const n = array.length;
  let swapped;
  for (let i = 0; i < n - 1; i++) {
    swapped = false;
    yield { type: 'compare', indices: [], variables: { i, n, swapped }, highlightLine: 3 };
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1], variables: { i, j, n, swapped }, highlightLine: 5 };
      if (array[j].value > array[j + 1].value) {
        yield { type: 'swap', indices: [j, j + 1], variables: { i, j, n, swapped }, highlightLine: 6 };
        const temp = array[j].value;
        array[j].value = array[j + 1].value;
        array[j + 1].value = temp;
        swapped = true;
      }
    }
    yield { type: 'sorted', indices: [n - i - 1], variables: { i, n, swapped }, highlightLine: 10 };
    if (!swapped) break;
  }
  for (let k = 0; k < n; k++) {
    yield { type: 'sorted', indices: [k], variables: { finished: true }, highlightLine: 14 };
  }
}

export function* selectionSortGenerator(array: ArrayBar[]): Generator<SortAction, void, unknown> {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let min_idx = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [j, min_idx], variables: { i, j, min_idx }, highlightLine: 4 };
      if (array[j].value < array[min_idx].value) {
        min_idx = j;
        yield { type: 'compare', indices: [j, min_idx], variables: { i, j, min_idx }, highlightLine: 5 };
      }
    }
    if (min_idx !== i) {
      yield { type: 'swap', indices: [min_idx, i], variables: { i, min_idx }, highlightLine: 9 };
      const temp = array[min_idx].value;
      array[min_idx].value = array[i].value;
      array[i].value = temp;
    }
    yield { type: 'sorted', indices: [i], highlightLine: 12 };
  }
  yield { type: 'sorted', indices: [n - 1] };
}

export function* insertionSortGenerator(array: ArrayBar[]): Generator<SortAction, void, unknown> {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    let key = array[i].value;
    let j = i - 1;
    yield { type: 'compare', indices: [i, j], variables: { i, j, key }, highlightLine: 4 };
    while (j >= 0 && array[j].value > key) {
      yield { type: 'swap', indices: [j, j + 1], variables: { i, j, key }, highlightLine: 6 };
      array[j + 1].value = array[j].value;
      j = j - 1;
    }
    array[j + 1].value = key;
  }
  for (let k = 0; k < n; k++) {
    yield { type: 'sorted', indices: [k] };
  }
}

export function* mergeSortGenerator(array: ArrayBar[]): Generator<SortAction, void, unknown> {
  yield* mergeSortHelper(array, 0, array.length - 1);
  for (let k = 0; k < array.length; k++) {
    yield { type: 'sorted', indices: [k] };
  }
}

function* mergeSortHelper(array: ArrayBar[], left: number, right: number): Generator<SortAction, void, unknown> {
  if (left >= right) return;
  const mid = left + Math.floor((right - left) / 2);
  yield* mergeSortHelper(array, left, mid);
  yield* mergeSortHelper(array, mid + 1, right);
  yield* merge(array, left, mid, right);
}

function* merge(array: ArrayBar[], left: number, mid: number, right: number): Generator<SortAction, void, unknown> {
  const n1 = mid - left + 1;
  const n2 = right - mid;
  const L = new Array(n1);
  const R = new Array(n2);

  for (let i = 0; i < n1; i++) L[i] = array[left + i].value;
  for (let j = 0; j < n2; j++) R[j] = array[mid + 1 + j].value;

  let i = 0; let j = 0; let k = left;

  while (i < n1 && j < n2) {
    yield { type: 'compare', indices: [left + i, mid + 1 + j], variables: { left, mid, right, i, j, k } };
    if (L[i] <= R[j]) {
      yield { type: 'swap', indices: [k, k], variables: { left, mid, right, i, j, k } };
      array[k].value = L[i];
      i++;
    } else {
      yield { type: 'swap', indices: [k, k], variables: { left, mid, right, i, j, k } };
      array[k].value = R[j];
      j++;
    }
    k++;
  }

  while (i < n1) {
    yield { type: 'swap', indices: [k, k], variables: { i, k } };
    array[k].value = L[i];
    i++;
    k++;
  }

  while (j < n2) {
    yield { type: 'swap', indices: [k, k], variables: { j, k } };
    array[k].value = R[j];
    j++;
    k++;
  }
}

export function* quickSortGenerator(array: ArrayBar[]): Generator<SortAction, void, unknown> {
  yield* quickSortHelper(array, 0, array.length - 1);
  for (let k = 0; k < array.length; k++) {
    yield { type: 'sorted', indices: [k] };
  }
}

function* quickSortHelper(array: ArrayBar[], low: number, high: number): Generator<SortAction, void, unknown> {
  if (low < high) {
    const pi = yield* partition(array, low, high);
    yield* quickSortHelper(array, low, pi - 1);
    yield* quickSortHelper(array, pi + 1, high);
  } else if (low === high) {
    yield { type: 'sorted', indices: [low] };
  }
}

function* partition(array: ArrayBar[], low: number, high: number): Generator<SortAction, number, unknown> {
  const pivot = array[high].value;
  let i = low - 1;
  for (let j = low; j < high; j++) {
    yield { type: 'compare', indices: [j, high], variables: { low, high, pivot, i, j } };
    if (array[j].value < pivot) {
      i++;
      yield { type: 'swap', indices: [i, j], variables: { low, high, pivot, i, j } };
      const temp = array[i].value;
      array[i].value = array[j].value;
      array[j].value = temp;
    }
  }
  yield { type: 'swap', indices: [i + 1, high], variables: { low, high, pivot, i } };
  const temp2 = array[i + 1].value;
  array[i + 1].value = array[high].value;
  array[high].value = temp2;
  return i + 1;
}

export const algorithms: Record<string, (array: ArrayBar[]) => Generator<SortAction, void, unknown>> = {
  bubble: bubbleSortGenerator,
  merge: mergeSortGenerator,
  quick: quickSortGenerator,
  insertion: insertionSortGenerator,
  selection: selectionSortGenerator
};
