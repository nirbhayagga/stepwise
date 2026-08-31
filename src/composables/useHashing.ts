import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { HASHING, DEFAULT_HASH, buildHashFrames } from '../algorithms/hashing';
import type { HashFrame } from '../algorithms/hashing';

const EMPTY_U8 = new Uint8Array(0);

export function useHashing() {
  const tl = useTimeline<HashFrame>(400);
  const algorithmId = ref(DEFAULT_HASH);
  const inputs = ref<InputValues>(defaultInputs(HASHING[DEFAULT_HASH].inputs));
  const error = ref<string | null>(null);

  const meta = computed(() => HASHING[algorithmId.value]);
  const slots = computed(() => tl.current.value?.slots ?? []);
  const states = computed(() => tl.current.value?.states ?? EMPTY_U8);
  const loadFactor = computed(() => tl.current.value?.loadFactor ?? 0);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; tl.setFrames([]); return; }
    const s = meta.value.setup(parsed.data);
    if ('error' in s) { error.value = s.error; tl.setFrames([]); return; }
    error.value = null;
    tl.setFrames(buildHashFrames(meta.value, s));
  };

  const setAlgorithm = (id: string) => {
    if (!HASHING[id]) return;
    const keep = inputs.value;
    algorithmId.value = id;
    inputs.value = { ...defaultInputs(HASHING[id].inputs), ...keep };
    rebuild();
  };

  rebuild();

  return { ...tl, algorithmId, inputs, error, meta, slots, states, loadFactor, variables, activeLine, rebuild, setAlgorithm };
}
