<script setup lang="ts">
import { reactive, computed, watch, onMounted } from 'vue';
import { usePathfinding } from '../composables/usePathfinding';
import { useKeyboard } from '../engine/useKeyboard';
import { PATHFINDING_LIST } from '../algorithms/pathfinding';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import GridDisplay from '../components/pathfinding/GridDisplay.vue';
import PathfindingLegend from '../components/pathfinding/PathfindingLegend.vue';
import TerrainToolbar from '../components/pathfinding/TerrainToolbar.vue';

const a = reactive(usePathfinding(21, window.innerWidth < 700 ? 31 : 51));
const b = reactive(usePathfinding(21, window.innerWidth < 700 ? 31 : 51));
const panes = [a, b];

const isPlaying = computed(() => a.isPlaying || b.isPlaying);
const index = computed(() => Math.max(a.index, b.index));
const frameCount = computed(() => Math.max(a.frameCount, b.frameCount));
const speed = computed({ get: () => a.speed, set: v => { a.speed = v; b.speed = v; } });
const diagonal = computed({ get: () => a.diagonal, set: v => { a.setDiagonal(v); b.setDiagonal(v); } });

// The left grid is the editable one; the right mirrors its terrain.
watch(() => [a.cells, a.start, a.target] as const, () => b.restore(a.snapshot()));

const play = () => panes.forEach(p => p.play());
const pause = () => panes.forEach(p => p.pause());
const toggle = () => (isPlaying.value ? pause() : play());
const step = () => panes.forEach(p => p.step());
const stepBack = () => panes.forEach(p => p.stepBack());
const reset = () => panes.forEach(p => p.reset());
const seek = (i: number) => panes.forEach(p => p.seek(i));

onMounted(() => {
  b.setAlgorithm('astar');
  a.generateMaze('random-walls');
});

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });
</script>

<template>
  <div class="view">
    <PageHeader title="Pathfinding · Compare" subtitle="Two searches on the same terrain and endpoints, advanced in lockstep. Draw on the left grid; the right grid mirrors it." />

    <div class="panel toolbar">
      <div class="toolbar-group">
        <label class="field">
          <span>Moves</span>
          <label class="field field-inline check-row">
            <input type="checkbox" class="check" v-model="diagonal" :disabled="isPlaying" />
            <span class="check-label">8-connected</span>
          </label>
        </label>
        <label class="field">
          <span>Draw</span>
          <select class="select" v-model="a.drawMode">
            <option value="wall">Wall</option>
            <option value="weight">Weight</option>
            <option value="start">Start</option>
            <option value="target">Target</option>
          </select>
        </label>
      </div>
      <TerrainToolbar :rows="a.rows" :cols="a.cols" :disabled="isPlaying" @generate="a.generateMaze($event)" @clear="a.clearTerrain()" @clear-path="panes.forEach(p => p.invalidate())" @resize="(r, c) => a.resize(r, c)" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" reset-label="Rewind" :pending="frameCount === 0"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="split">
      <div v-for="(p, i) in panes" :key="i" class="split-pane panel pane">
        <div class="pane-head">
          <AlgorithmSelect :model-value="p.algorithmId" :options="PATHFINDING_LIST" :label="i === 0 ? 'Left' : 'Right'" :disabled="isPlaying" @update:model-value="p.setAlgorithm" />
          <span class="mono muted complexity">{{ p.meta.complexity.time.worst }}<template v-if="!p.meta.weighted"> · unweighted</template></span>
        </div>
        <MetricsBar :metrics="[
          { label: 'Visited', value: p.explored },
          { label: 'Path length', value: p.pathLength },
          { label: 'Path cost', value: p.pathCost.toFixed(2) },
          { label: 'Step', value: p.index + ' / ' + p.lastIndex },
        ]" />
        <GridDisplay :rows="p.rows" :cols="p.cols" :cells="p.cells" :states="p.states" :start="p.start" :target="p.target" :interactive="i === 0"
          @down="p.pointerDown" @enter="p.pointerEnter" @up="p.pointerUp" />
      </div>
    </div>
    <PathfindingLegend />
  </div>
</template>

<style scoped>
.pane { padding: 12px; }
.pane-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
.complexity { font-size: 12px; padding-bottom: 6px; }
.check-row { height: 30px; }
.check-label { font-size: 13px; color: var(--text); text-transform: none; letter-spacing: 0; }
</style>
