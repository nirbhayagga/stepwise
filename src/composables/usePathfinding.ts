import { ref, shallowRef, computed } from 'vue';
import { useTimeline } from '../engine/useTimeline';
import { mulberry32, randomSeed } from '../engine/random';
import {
  PATHFINDING, DEFAULT_PATHFINDING, MAZE_BY_ID, CELL, buildPathFrames, resolveDiagonal, idx,
} from '../algorithms/pathfinding';
import type { PathFrame, Terrain } from '../algorithms/pathfinding';

export type DrawMode = 'wall' | 'weight' | 'start' | 'target';

export interface TerrainSnapshot { rows: number; cols: number; cells: Uint8Array; start: number; target: number }

/** Editable grid + a lazily built search timeline for the selected algorithm. */
export function usePathfinding(initialRows = 21, initialCols = 51) {
  const tl = useTimeline<PathFrame>(15);
  const rows = ref(initialRows);
  const cols = ref(initialCols);
  const cells = shallowRef<Uint8Array>(new Uint8Array(initialRows * initialCols));
  const start = ref(0);
  const target = ref(0);
  const algorithmId = ref(DEFAULT_PATHFINDING);
  const diagonal = ref(false);
  const drawMode = ref<DrawMode>('wall');

  const meta = computed(() => PATHFINDING[algorithmId.value]);
  const effectiveDiagonal = computed(() => resolveDiagonal(meta.value, diagonal.value));
  const terrain = computed<Terrain>(() => ({ rows: rows.value, cols: cols.value, cells: cells.value }));
  const states = computed(() => tl.current.value?.states ?? null);
  const explored = computed(() => tl.current.value?.explored ?? 0);
  const frontier = computed(() => tl.current.value?.frontier ?? 0);
  const pathLength = computed(() => tl.current.value?.pathLength ?? 0);
  const pathCost = computed(() => tl.current.value?.pathCost ?? 0);
  const variables = computed(() => tl.current.value?.variables ?? {});
  const activeLine = computed(() => tl.current.value?.line || null);
  const isBuilt = computed(() => tl.frameCount.value > 0);

  /** Drop the recorded search; terrain stays. */
  const invalidate = () => tl.setFrames([]);

  const build = () => {
    tl.setFrames(buildPathFrames(meta.value, terrain.value, start.value, target.value, { diagonal: effectiveDiagonal.value }));
  };
  const ensure = () => { if (!isBuilt.value) build(); };

  const placeDefaults = () => {
    const r = Math.floor(rows.value / 2);
    start.value = idx(terrain.value, r, Math.floor(cols.value / 4));
    target.value = idx(terrain.value, r, cols.value - 1 - Math.floor(cols.value / 4));
  };

  const resize = (r: number, c: number) => {
    rows.value = r; cols.value = c;
    cells.value = new Uint8Array(r * c);
    placeDefaults();
    invalidate();
  };

  const clearTerrain = () => { cells.value = new Uint8Array(rows.value * cols.value); invalidate(); };

  const randomizeEndpoints = (rnd: () => number) => {
    const empties: number[] = [];
    for (let i = 0; i < cells.value.length; i++) if (cells.value[i] !== CELL.wall) empties.push(i);
    if (empties.length < 2) { placeDefaults(); return; }
    const a = Math.floor(rnd() * empties.length);
    let b = Math.floor(rnd() * empties.length);
    while (b === a) b = Math.floor(rnd() * empties.length);
    start.value = empties[a]; target.value = empties[b];
  };

  const generateMaze = (mazeId: string, seed = randomSeed()) => {
    const gen = MAZE_BY_ID[mazeId];
    if (!gen) return;
    const rnd = mulberry32(seed);
    const next = gen.generate(terrain.value, rnd);
    cells.value = next;
    randomizeEndpoints(rnd);
    invalidate();
  };

  // ---- painting -----------------------------------------------------------
  let stroke: DrawMode | 'erase' | null = null;

  const setCell = (i: number, type: number) => {
    if (i === start.value || i === target.value) return;
    if (cells.value[i] === type) return;
    const next = Uint8Array.from(cells.value);
    next[i] = type;
    cells.value = next;
    invalidate();
  };

  const moveEndpoint = (which: 'start' | 'target', i: number) => {
    if (cells.value[i] === CELL.wall) return;
    if (which === 'start' && i !== target.value) start.value = i;
    if (which === 'target' && i !== start.value) target.value = i;
    invalidate();
  };

  const paint = (i: number) => {
    if (!stroke) return;
    if (stroke === 'start' || stroke === 'target') moveEndpoint(stroke, i);
    else if (stroke === 'erase') setCell(i, CELL.empty);
    else setCell(i, stroke === 'wall' ? CELL.wall : CELL.weight);
  };

  const pointerDown = (i: number) => {
    tl.pause();
    if (i === start.value) stroke = 'start';
    else if (i === target.value) stroke = 'target';
    else if (drawMode.value === 'start' || drawMode.value === 'target') stroke = drawMode.value;
    else {
      const wanted = drawMode.value === 'wall' ? CELL.wall : CELL.weight;
      stroke = cells.value[i] === wanted ? 'erase' : drawMode.value;
    }
    paint(i);
  };
  const pointerEnter = (i: number) => paint(i);
  const pointerUp = () => { stroke = null; };

  // ---- settings -------------------------------------------------------------
  const setAlgorithm = (id: string) => { if (PATHFINDING[id]) { algorithmId.value = id; invalidate(); } };
  const setDiagonal = (v: boolean) => { diagonal.value = v; invalidate(); };

  const snapshot = (): TerrainSnapshot => ({
    rows: rows.value, cols: cols.value, cells: Uint8Array.from(cells.value), start: start.value, target: target.value,
  });
  const restore = (s: TerrainSnapshot) => {
    rows.value = s.rows; cols.value = s.cols; cells.value = Uint8Array.from(s.cells);
    start.value = s.start; target.value = s.target;
    invalidate();
  };

  // Playback wrappers build the timeline on demand.
  const play = () => { ensure(); tl.play(); };
  const step = () => { ensure(); tl.step(); };
  const seek = (i: number) => { ensure(); tl.seek(i); };
  const toggle = () => (tl.isPlaying.value ? tl.pause() : play());

  placeDefaults();

  return {
    ...tl, play, step, seek, toggle,
    rows, cols, cells, start, target, algorithmId, diagonal, effectiveDiagonal, drawMode, meta, terrain,
    states, explored, frontier, pathLength, pathCost, variables, activeLine, isBuilt,
    invalidate, build, resize, clearTerrain, generateMaze, setAlgorithm, setDiagonal,
    pointerDown, pointerEnter, pointerUp, snapshot, restore,
  };
}
