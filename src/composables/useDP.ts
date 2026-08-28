import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { DP, DEFAULT_DP, buildDPFrames } from '../algorithms/dp';
import type { DPFrame, DPTable } from '../algorithms/dp';

const EMPTY_U8 = new Uint8Array(0);

/** Parameterised DP table + its timeline. Inputs are re-validated on every rebuild. */
export function useDP() {
  const tl = useTimeline<DPFrame>(150);
  const algorithmId = ref(DEFAULT_DP);
  const inputs = ref<InputValues>(defaultInputs(DP[DEFAULT_DP].inputs));
  const error = ref<string | null>(null);
  const table = ref<DPTable | null>(null);

  const meta = computed(() => DP[algorithmId.value]);
  const values = computed(() => tl.current.value?.values ?? []);
  const states = computed(() => tl.current.value?.states ?? EMPTY_U8);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; table.value = null; tl.setFrames([]); return; }
    const t = meta.value.setup(parsed.data);
    if ('error' in t) { error.value = t.error; table.value = null; tl.setFrames([]); return; }
    error.value = null;
    table.value = t;
    tl.setFrames(buildDPFrames(meta.value, t));
  };

  const setAlgorithm = (id: string) => {
    if (!DP[id]) return;
    algorithmId.value = id;
    inputs.value = defaultInputs(DP[id].inputs);
    rebuild();
  };

  rebuild();

  return { ...tl, algorithmId, inputs, error, table, meta, values, states, variables, activeLine, rebuild, setAlgorithm };
}
