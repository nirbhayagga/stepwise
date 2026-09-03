import { ref, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { defaultInputs, parseInputs } from '../engine/types';
import type { InputValues } from '../engine/types';
import { SCHEDULING, DEFAULT_SCHEDULING, buildSchedFrames } from '../algorithms/scheduling';
import type { SchedFrame, SchedProcess } from '../algorithms/scheduling';

const EMPTY_U8 = new Uint8Array(0);
const EMPTY_I8 = new Int8Array(0);

/** Parameterised CPU schedule + its timeline. Inputs are re-validated on every rebuild. */
export function useScheduling() {
  const tl = useTimeline<SchedFrame>(350);
  const algorithmId = ref(DEFAULT_SCHEDULING);
  const inputs = ref<InputValues>(defaultInputs(SCHEDULING[DEFAULT_SCHEDULING].inputs));
  const error = ref<string | null>(null);
  const procs = ref<SchedProcess[]>([]);

  const meta = computed(() => SCHEDULING[algorithmId.value]);
  const time = computed(() => tl.current.value?.time ?? 0);
  const gantt = computed(() => tl.current.value?.gantt ?? EMPTY_I8);
  const states = computed(() => tl.current.value?.states ?? EMPTY_U8);
  const remaining = computed(() => tl.current.value?.remaining ?? EMPTY_U8);
  const queue = computed(() => tl.current.value?.queue ?? []);
  const completion = computed(() => tl.current.value?.completion ?? []);
  const contextSwitches = computed(() => tl.current.value?.contextSwitches ?? 0);
  const avgWaiting = computed(() => tl.current.value?.avgWaiting ?? null);
  const avgTurnaround = computed(() => tl.current.value?.avgTurnaround ?? null);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const rebuild = () => {
    const parsed = parseInputs(meta.value.inputs, inputs.value);
    if (!parsed.ok) { error.value = parsed.error; procs.value = []; tl.setFrames([]); return; }
    const plan = meta.value.setup(parsed.data);
    if ('error' in plan) { error.value = plan.error; procs.value = []; tl.setFrames([]); return; }
    error.value = null;
    procs.value = plan.procs;
    tl.setFrames(buildSchedFrames(meta.value, plan));
  };

  const setAlgorithm = (id: string) => {
    if (!SCHEDULING[id]) return;
    const keep = inputs.value;
    algorithmId.value = id;
    // Keep arrivals/bursts across switches; refill algorithm-specific fields.
    inputs.value = { ...defaultInputs(SCHEDULING[id].inputs), ...Object.fromEntries(SCHEDULING[id].inputs.filter(s => keep[s.key] !== undefined).map(s => [s.key, keep[s.key]])) };
    rebuild();
  };

  rebuild();

  return {
    ...tl, algorithmId, inputs, error, procs, meta,
    time, gantt, states, remaining, queue, completion, contextSwitches, avgWaiting, avgTurnaround,
    variables, activeLine, rebuild, setAlgorithm,
  };
}
