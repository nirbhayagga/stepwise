import { ref, shallowRef, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { randomSeed } from '../engine/random';
import { GRAPH, DEFAULT_GRAPH, generateGraph, buildGraphFrames } from '../algorithms/graph';
import type { Graph, GraphFrame } from '../algorithms/graph';

const EMPTY_U8 = new Uint8Array(0);

export function useGraph() {
  const tl = useTimeline<GraphFrame>(450);
  const algorithmId = ref(DEFAULT_GRAPH);
  const nodeCount = ref(12);
  const density = ref(0.5);
  const seed = ref(randomSeed());
  const source = ref(0);
  const graph = shallowRef<Graph>({ nodes: [], edges: [], directed: false });

  const meta = computed(() => GRAPH[algorithmId.value]);
  const nodeStates = computed(() => tl.current.value?.nodeStates ?? EMPTY_U8);
  const edgeStates = computed(() => tl.current.value?.edgeStates ?? EMPTY_U8);
  const labels = computed(() => tl.current.value?.labels ?? []);
  const edgeLabels = computed(() => tl.current.value?.edgeLabels ?? []);
  const output = computed(() => tl.current.value?.output ?? []);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const build = () => tl.setFrames(buildGraphFrames(meta.value, graph.value, source.value));

  const regenerate = (newSeed = randomSeed()) => {
    seed.value = newSeed;
    graph.value = generateGraph(nodeCount.value, density.value, seed.value, meta.value.kind);
    source.value = 0;
    build();
  };

  const setAlgorithm = (id: string) => {
    if (!GRAPH[id]) return;
    const kindChanged = GRAPH[id].kind !== meta.value.kind;
    algorithmId.value = id;
    if (kindChanged) regenerate(seed.value); else build();
  };

  const setSource = (id: number) => {
    if (id < 0 || id >= graph.value.nodes.length) return;
    source.value = id;
    build();
  };

  regenerate();

  return {
    ...tl, algorithmId, nodeCount, density, seed, source, graph, meta,
    nodeStates, edgeStates, labels, edgeLabels, output, variables, activeLine,
    regenerate, setAlgorithm, setSource,
  };
}
