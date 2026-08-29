<script setup lang="ts">
import { usePathfinding } from '../composables/usePathfinding';
import { useKeyboard } from '../engine/useKeyboard';
import { PATHFINDING_LIST } from '../algorithms/pathfinding';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import GridDisplay from '../components/pathfinding/GridDisplay.vue';
import PathfindingLegend from '../components/pathfinding/PathfindingLegend.vue';
import TerrainToolbar from '../components/pathfinding/TerrainToolbar.vue';

const p = usePathfinding(21, window.innerWidth < 700 ? 31 : 51);
const {
  rows, cols, cells, start, target, states, algorithmId, diagonal, effectiveDiagonal, drawMode, meta,
  explored, frontier, pathLength, pathCost, variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek,
  resize, clearTerrain, invalidate, generateMaze, setAlgorithm, setDiagonal, pointerDown, pointerEnter, pointerUp,
} = p;

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });
</script>

<template>
  <div class="view">
    <PageHeader title="Pathfinding" subtitle="Graph search on a grid. Draw walls and weighted cells, move the endpoints, then step through the search. Diagonal moves cost √2 and never cut corners." />

    <div class="panel toolbar">
      <div class="toolbar-group">
        <AlgorithmSelect :model-value="algorithmId" :options="PATHFINDING_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
        <label class="field">
          <span>Moves</span>
          <label class="field field-inline check-row">
            <input type="checkbox" class="check" :checked="effectiveDiagonal" :disabled="isPlaying || meta.diagonal !== 'optional'" @change="setDiagonal(($event.target as HTMLInputElement).checked)" />
            <span class="check-label">8-connected</span>
          </label>
        </label>
        <label class="field">
          <span>Draw</span>
          <select class="select" v-model="drawMode">
            <option value="wall">Wall</option>
            <option value="weight">Weight</option>
            <option value="start">Start</option>
            <option value="target">Target</option>
          </select>
        </label>
      </div>
      <TerrainToolbar :rows="rows" :cols="cols" :disabled="isPlaying" @generate="generateMaze" @clear="clearTerrain" @clear-path="invalidate" @resize="resize" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" reset-label="Rewind" :pending="frameCount === 0"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <MetricsBar :metrics="[
          { label: 'Visited', value: explored },
          { label: 'Frontier', value: frontier },
          { label: 'Path length', value: pathLength, unit: 'edges' },
          { label: 'Path cost', value: pathCost.toFixed(2) },
          { label: 'Grid', value: rows + ' × ' + cols },
        ]" />
        <GridDisplay :rows="rows" :cols="cols" :cells="cells" :states="states" :start="start" :target="target" interactive
          @down="pointerDown" @enter="pointerEnter" @up="pointerUp" />
        <PathfindingLegend />
        <p v-if="!meta.weighted" class="muted note">{{ meta.name }} ignores cell weights; path cost is reported in unit steps.</p>
        <p v-if="!diagonal && meta.diagonal === 'always'" class="muted note">{{ meta.name }} requires an 8-connected grid.</p>
      </div>
      <div class="workspace-side">
        <ComplexityCard :meta="meta" />
        <WatchWindow :variables="variables" />
        <PseudocodePanel :code="meta.pseudocode" :active-line="activeLine" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.check-row { height: 30px; }
.check-label { font-size: 13px; color: var(--text); text-transform: none; letter-spacing: 0; }
.note { font-size: 12px; }
</style>
