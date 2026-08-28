import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { TREE, DEFAULT_TREE, buildTreeFrames } from '../algorithms/tree';
import type { TreeFrame } from '../algorithms/tree';

export function useTree() {
  const tl = useTimeline<TreeFrame>(450);
  const algorithmId = ref(DEFAULT_TREE);
  const inputs = ref<InputValues>(defaultInputs(TREE[DEFAULT_TREE].inputs));
  const error = ref<string | null>(null);

  const meta = computed(() => TREE[algorithmId.value]);
  const root = computed(() => tl.current.value?.root ?? null);
  const output = computed(() => tl.current.value?.output ?? []);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; tl.setFrames([]); return; }
    const r = meta.value.setup(parsed.data);
    if ('error' in r) { error.value = r.error; tl.setFrames([]); return; }
    error.value = null;
    tl.setFrames(buildTreeFrames(meta.value, r));
  };

  const setAlgorithm = (id: string) => {
    if (!TREE[id]) return;
    const keep = inputs.value.keys;
    algorithmId.value = id;
    inputs.value = { ...defaultInputs(TREE[id].inputs), ...(keep !== undefined ? { keys: keep } : {}) };
    rebuild();
  };

  rebuild();

  return { ...tl, algorithmId, inputs, error, meta, root, output, variables, activeLine, rebuild, setAlgorithm };
}
