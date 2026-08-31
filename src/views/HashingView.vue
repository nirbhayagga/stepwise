<script setup lang="ts">
import { useHashing } from '../composables/useHashing';
import { useKeyboard } from '../engine/useKeyboard';
import { HASH_LIST } from '../algorithms/hashing';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import HashCanvas from '../components/hashing/HashCanvas.vue';

const {
  algorithmId, inputs, error, meta, slots, states, loadFactor, variables, activeLine,
  index, frameCount, lastIndex, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useHashing();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(lastIndex.value) });

const legend = [
  { label: 'Probe / collision', color: 'var(--s-compare)' },
  { label: 'Inserted', color: 'var(--s-sorted)' },
  { label: 'Re-inserted by rehash', color: 'var(--s-mark)' },
  { label: 'Search hit', color: 'var(--accent)' },
  { label: 'Search miss', color: 'var(--s-write)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Hash Tables" subtitle="Collision resolution strategies with h(k) = k mod m. Open addressing rehashes into a table of 2m+1 slots when the load factor passes 0.7." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="HASH_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!!error"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <MetricsBar :metrics="[
          { label: 'Slots', value: slots.length },
          { label: 'Stored', value: slots.reduce((a, s) => a + s.length, 0) },
          { label: 'Load factor α', value: loadFactor.toFixed(2) },
        ]" />
        <HashCanvas :slots="slots" :states="states" />
        <StateLegend :items="legend" />
        <p class="muted xlink">These are data-structure hash tables. For <em>cryptographic</em> hashing — SHA-2, HMAC, key derivation — see <a href="https://clientcrypt.nirbhay.dev" rel="noopener">clientcrypt.nirbhay.dev</a>.</p>
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
.xlink { font-size: 12px; }
</style>
