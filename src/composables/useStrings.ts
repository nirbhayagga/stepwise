import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { STRINGS, DEFAULT_STRING, buildStringFrames } from '../algorithms/strings';
import type { StringFrame, StringSetup } from '../algorithms/strings';

const EMPTY_U8 = new Uint8Array(0);

export function useStrings() {
  const tl = useTimeline<StringFrame>(300);
  const algorithmId = ref(DEFAULT_STRING);
  const inputs = ref<InputValues>(defaultInputs(STRINGS[DEFAULT_STRING].inputs));
  const error = ref<string | null>(null);
  const setup = ref<StringSetup | null>(null);

  const meta = computed(() => STRINGS[algorithmId.value]);
  const textStates = computed(() => tl.current.value?.textStates ?? EMPTY_U8);
  const patternStates = computed(() => tl.current.value?.patternStates ?? EMPTY_U8);
  const shift = computed(() => tl.current.value?.shift ?? -1);
  const aux = computed(() => tl.current.value?.aux ?? []);
  const found = computed(() => tl.current.value?.found ?? []);
  const comparisons = computed(() => tl.current.value?.comparisons ?? 0);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; setup.value = null; tl.setFrames([]); return; }
    const s = meta.value.setup(parsed.data);
    if ('error' in s) { error.value = s.error; setup.value = null; tl.setFrames([]); return; }
    error.value = null;
    setup.value = s;
    tl.setFrames(buildStringFrames(meta.value, s));
  };

  const setAlgorithm = (id: string) => {
    if (!STRINGS[id]) return;
    const keep = inputs.value;
    algorithmId.value = id;
    inputs.value = { ...defaultInputs(STRINGS[id].inputs), ...keep };
    rebuild();
  };

  rebuild();

  return {
    ...tl, algorithmId, inputs, error, setup, meta,
    textStates, patternStates, shift, aux, found, comparisons, variables, activeLine,
    rebuild, setAlgorithm,
  };
}
