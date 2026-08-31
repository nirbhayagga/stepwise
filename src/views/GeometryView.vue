<script setup lang="ts">
import { useGeometry } from '../composables/useGeometry';
import { useKeyboard } from '../engine/useKeyboard';
import { GEOMETRY_LIST } from '../algorithms/geometry';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import GeometryCanvas from '../components/geometry/GeometryCanvas.vue';

const {
  algorithmId, pointCount, points, meta, pointStates, segments, variables, activeLine,
  index, frameCount, lastIndex, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, regenerate, setAlgorithm,
} = useGeometry();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(lastIndex.value) });

const legend = [
  { label: 'Being tested', color: 'var(--s-compare)', shape: 'circle' as const },
  { label: 'On the hull', color: 'var(--accent)', shape: 'circle' as const },
  { label: 'In the strip', color: '#3d3a2a', shape: 'circle' as const },
  { label: 'Closest pair', color: 'var(--s-sorted)', shape: 'circle' as const },
  { label: 'Hull edge', color: 'var(--accent-strong)' },
  { label: 'Candidate edge', color: 'var(--s-compare)' },
  { label: 'Best distance', color: 'var(--s-sorted)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Computational Geometry" subtitle="Convex hulls and closest pairs on a random point set. Orientation is decided by the sign of a cross product; no angles are ever computed." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="GEOMETRY_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <label class="field">
        <span>Points · {{ pointCount }}</span>
        <input type="range" class="range" min="6" max="40" v-model.number="pointCount" :disabled="isPlaying" @change="regenerate()" />
      </label>
      <button class="btn" :disabled="isPlaying" @click="regenerate()">New points</button>
      <span class="muted mono note">n = {{ points.length }}</span>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <GeometryCanvas :points="points" :point-states="pointStates" :segments="segments" />
        <StateLegend :items="legend" />
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
.note { font-size: 12px; align-self: center; padding-bottom: 6px; }
</style>
