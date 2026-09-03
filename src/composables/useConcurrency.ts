import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { CONCURRENCY, DEFAULT_CONCURRENCY, buildConcFrames } from '../algorithms/concurrency';
import type { ConcFrame } from '../algorithms/concurrency';

const EMPTY_I8 = new Int8Array(0);

/** Simulated thread interleaving + its timeline. Inputs are re-validated on every rebuild. */
export function useConcurrency() {
  const tl = useTimeline<ConcFrame>(400);
  const algorithmId = ref(DEFAULT_CONCURRENCY);
  const inputs = ref<InputValues>(defaultInputs(CONCURRENCY[DEFAULT_CONCURRENCY].inputs));
  const error = ref<string | null>(null);

  const meta = computed(() => CONCURRENCY[algorithmId.value]);
  const threads = computed(() => tl.current.value?.threads ?? []);
  const counter = computed(() => tl.current.value?.counter ?? 0);
  const lock = computed(() => tl.current.value?.lock ?? null);
  const strip = computed(() => tl.current.value?.strip ?? EMPTY_I8);
  const executed = computed(() => tl.current.value?.executed ?? 0);
  const switches = computed(() => tl.current.value?.switches ?? 0);
  const expected = computed(() => tl.current.value?.expected ?? 0);
  const lost = computed(() => tl.current.value?.lost ?? null);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);
  const hasLock = computed(() => meta.value.id === 'mutex-counter');

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; tl.setFrames([]); return; }
    const plan = meta.value.setup(parsed.data);
    if ('error' in plan) { error.value = plan.error; tl.setFrames([]); return; }
    error.value = null;
    tl.setFrames(buildConcFrames(meta.value, plan));
  };

  const shuffle = () => {
    inputs.value = { ...inputs.value, seed: String(Math.floor(Math.random() * 10000)) };
    rebuild();
  };

  const setAlgorithm = (id: string) => {
    if (!CONCURRENCY[id]) return;
    const keep = inputs.value;
    algorithmId.value = id;
    // Same input keys everywhere, so the scenario switch keeps the workload.
    inputs.value = { ...defaultInputs(CONCURRENCY[id].inputs), ...keep };
    rebuild();
  };

  rebuild();

  return {
    ...tl, algorithmId, inputs, error, meta,
    threads, counter, lock, strip, executed, switches, expected, lost, hasLock,
    variables, activeLine, rebuild, shuffle, setAlgorithm,
  };
}
