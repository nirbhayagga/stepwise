<script setup lang="ts">
import { useGraph } from '../composables/useGraph';
import { useKeyboard } from '../engine/useKeyboard';
import { GRAPH_LIST } from '../algorithms/graph';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import GraphCanvas from '../components/graph/GraphCanvas.vue';

const {
  algorithmId, nodeCount, density, source, graph, meta, nodeStates, edgeStates, labels, output, variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, regenerate, setAlgorithm, setSource,
} = useGraph();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });

const legend = [
  { label: 'Source', color: 'var(--s-sorted)', shape: 'circle' as const },
  { label: 'Frontier / queued', color: 'var(--s-compare)', shape: 'circle' as const },
  { label: 'Current', color: 'var(--s-compare)', shape: 'circle' as const },
  { label: 'Finished', color: 'var(--g-visited)', shape: 'circle' as const },
  { label: 'In result (tree / order)', color: 'var(--accent)', shape: 'circle' as const },
  { label: 'Tree edge', color: 'var(--accent-strong)' },
  { label: 'Edge under consideration', color: 'var(--s-compare)' },
  { label: 'Discarded edge', color: 'var(--border-strong)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Graphs" subtitle="Traversal, shortest paths, spanning trees and ordering on a generated graph. Edge weights are proportional to drawn length. Click a vertex to make it the source." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="GRAPH_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <label class="field">
        <span>Vertices · {{ nodeCount }}</span>
        <input type="range" class="range" min="4" max="24" v-model.number="nodeCount" :disabled="isPlaying" @change="regenerate()" />
      </label>
      <label class="field">
        <span>Extra edges · {{ Math.round(density * 100) }}%</span>
        <input type="range" class="range" min="0" max="1" step="0.1" v-model.number="density" :disabled="isPlaying" @change="regenerate()" />
      </label>
      <button class="btn" :disabled="isPlaying" @click="regenerate()">New graph</button>
      <label v-if="meta.usesSource" class="field">
        <span>Source</span>
        <select class="select" :value="source" :disabled="isPlaying" @change="setSource(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="n in graph.nodes" :key="n.id" :value="n.id">{{ n.id }}</option>
        </select>
      </label>
      <span class="muted kind mono">{{ meta.kind === 'dag' ? 'directed acyclic' : 'undirected' }} · {{ graph.nodes.length }} V · {{ graph.edges.length }} E</span>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <GraphCanvas :graph="graph" :node-states="nodeStates" :edge-states="edgeStates" :labels="labels" :source="source" :show-source="meta.usesSource" :weighted="meta.weighted" @select="setSource" />
        <div v-if="output.length" class="panel output mono">
          <span class="eyebrow">Order</span>
          <span v-for="(k, i) in output" :key="i" class="tok">{{ k }}</span>
        </div>
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
.kind { font-size: 12px; align-self: center; padding-bottom: 6px; }
.output { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 12px; font-size: 12.5px; }
.output .eyebrow { margin-right: 6px; }
.tok { background: var(--accent-bg); color: var(--accent-strong); padding: 1px 6px; border-radius: 3px; }
</style>
