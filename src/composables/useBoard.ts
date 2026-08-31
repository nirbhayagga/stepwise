import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues, Registry } from '../engine/types';
import { buildBoardFrames } from '../engine/board';
import type { BoardAlgorithm, BoardFrame, BoardSetup } from '../engine/board';

const EMPTY_U8 = new Uint8Array(0);

/** Shared composable for every board-shaped module (backtracking, numbers). */
export function useBoard(registry: Registry<BoardAlgorithm>, defaultId: string, baseDelay = 120) {
  const tl = useTimeline<BoardFrame>(baseDelay);
  const algorithmId = ref(defaultId);
  const inputs = ref<InputValues>(defaultInputs(registry[defaultId].inputs));
  const error = ref<string | null>(null);
  const setup = ref<BoardSetup | null>(null);

  const meta = computed(() => registry[algorithmId.value]);
  const cells = computed(() => tl.current.value?.cells ?? []);
  const states = computed(() => tl.current.value?.states ?? EMPTY_U8);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; setup.value = null; tl.setFrames([]); return; }
    const s = meta.value.setup(parsed.data);
    if ('error' in s) { error.value = s.error; setup.value = null; tl.setFrames([]); return; }
    error.value = null;
    setup.value = s;
    tl.setFrames(buildBoardFrames(meta.value, s));
  };

  const setAlgorithm = (id: string) => {
    if (!registry[id]) return;
    algorithmId.value = id;
    inputs.value = defaultInputs(registry[id].inputs);
    rebuild();
  };

  rebuild();

  return { ...tl, algorithmId, inputs, error, setup, meta, cells, states, variables, activeLine, rebuild, setAlgorithm };
}
