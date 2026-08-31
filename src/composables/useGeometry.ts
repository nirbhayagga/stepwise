import { ref, shallowRef, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { randomSeed } from '../engine/random';
import { GEOMETRY, DEFAULT_GEOMETRY, generatePoints, buildGeoFrames } from '../algorithms/geometry';
import type { GeoFrame, GeoPoint } from '../algorithms/geometry';

const EMPTY_U8 = new Uint8Array(0);

export function useGeometry() {
  const tl = useTimeline<GeoFrame>(350);
  const algorithmId = ref(DEFAULT_GEOMETRY);
  const pointCount = ref(16);
  const seed = ref(randomSeed());
  const points = shallowRef<GeoPoint[]>([]);

  const meta = computed(() => GEOMETRY[algorithmId.value]);
  const pointStates = computed(() => tl.current.value?.pointStates ?? EMPTY_U8);
  const segments = computed(() => tl.current.value?.segments ?? []);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);

  const build = () => tl.setFrames(buildGeoFrames(meta.value, points.value));
  const regenerate = (newSeed = randomSeed()) => {
    seed.value = newSeed;
    points.value = generatePoints(pointCount.value, seed.value);
    build();
  };
  const setAlgorithm = (id: string) => {
    if (!GEOMETRY[id]) return;
    algorithmId.value = id;
    build();
  };

  regenerate();

  return { ...tl, algorithmId, pointCount, seed, points, meta, pointStates, segments, variables, activeLine, regenerate, setAlgorithm };
}
