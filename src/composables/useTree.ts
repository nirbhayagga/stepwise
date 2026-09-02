import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { TREE, DEFAULT_TREE, buildTreeFrames } from '../algorithms/tree';
import type { TreeAlgorithm, TreeFrame } from '../algorithms/tree';
import type { Registry } from '../engine/types';

export function useTree(registry: Registry<TreeAlgorithm> = TREE, defaultId: string = DEFAULT_TREE, baseDelay = 450) {
  const tl = useTimeline<TreeFrame>(baseDelay);
  const algorithmId = ref(defaultId);
  const inputs = ref<InputValues>(defaultInputs(registry[defaultId].inputs));
  const error = ref<string | null>(null);

  const meta = computed(() => registry[algorithmId.value]);
  const root = computed(() => tl.current.value?.root ?? null);
  const forest = computed(() => tl.current.value?.forest ?? null);
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
    if (!registry[id]) return;
    const keep = inputs.value.keys;
    algorithmId.value = id;
    inputs.value = { ...defaultInputs(registry[id].inputs), ...(keep !== undefined && registry[id].inputs.some(i => i.key === 'keys') ? { keys: keep } : {}) };
    rebuild();
  };

  rebuild();

  return { ...tl, algorithmId, inputs, error, meta, root, forest, output, variables, activeLine, rebuild, setAlgorithm };
}
