import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { SORTING, DEFAULT_SORT, buildSortFrames, randomValues } from '../algorithms/sorting';
import type { SortFrame } from '../algorithms/sorting';

const EMPTY_U16 = new Uint16Array(0);
const EMPTY_U8 = new Uint8Array(0);

/** One sortable array + its pre-computed timeline for the selected algorithm. */
export function useSorting() {
  const tl = useTimeline<SortFrame>(40);
  const algorithmId = ref(DEFAULT_SORT);
  const baseValues = ref<number[]>([]);

  const meta = computed(() => SORTING[algorithmId.value]);
  const values = computed(() => tl.current.value?.values ?? EMPTY_U16);
  const states = computed(() => tl.current.value?.states ?? EMPTY_U8);
  const comparisons = computed(() => tl.current.value?.comparisons ?? 0);
  const swaps = computed(() => tl.current.value?.swaps ?? 0);
  const writes = computed(() => tl.current.value?.writes ?? 0);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => tl.setFrames(buildSortFrames(meta.value, baseValues.value));

  const setArray = (next: number[]) => {
    baseValues.value = next.slice();
    rebuild();
  };
  const generateArray = (size: number) => setArray(randomValues(size));
  const setAlgorithm = (id: string) => {
    if (!SORTING[id]) return;
    algorithmId.value = id;
    rebuild();
  };

  return {
    ...tl,
    algorithmId, meta, values, states, comparisons, swaps, writes, variables, activeLine,
    setArray, generateArray, setAlgorithm,
  };
}
