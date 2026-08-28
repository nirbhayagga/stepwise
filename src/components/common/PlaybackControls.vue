<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  isPlaying: boolean;
  index: number;
  frameCount: number;
  speed: number;
  /** Disable everything (e.g. no valid input yet). */
  disabled?: boolean;
  /** Timeline not built yet but can be on demand (play/step allowed, count unknown). */
  pending?: boolean;
  resetLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'step'): void;
  (e: 'step-back'): void;
  (e: 'reset'): void;
  (e: 'seek', index: number): void;
  (e: 'update:speed', v: number): void;
}>();

const last = computed(() => Math.max(0, props.frameCount - 1));
const canRun = computed(() => !props.disabled && (props.pending || props.frameCount > 1));
const fmt = (n: number) => n.toLocaleString();
</script>

<template>
  <div class="panel playback">
    <div class="buttons">
      <button class="btn btn-icon" title="Step back (←)" :disabled="disabled || isPlaying || index === 0" @click="emit('step-back')">‹</button>
      <button v-if="!isPlaying" class="btn btn-primary" title="Play (Space)" :disabled="!canRun" @click="emit('play')">Play</button>
      <button v-else class="btn btn-primary" title="Pause (Space)" @click="emit('pause')">Pause</button>
      <button class="btn btn-icon" title="Step forward (→)" :disabled="!canRun || isPlaying || (!pending && index >= last)" @click="emit('step')">›</button>
      <button class="btn" title="Reset (R)" :disabled="disabled" @click="emit('reset')">{{ resetLabel ?? 'Reset' }}</button>
    </div>

    <div class="scrub">
      <input
        type="range"
        class="range scrub-range"
        aria-label="Timeline position"
        min="0"
        :max="last"
        :value="index"
        :disabled="disabled || frameCount <= 1"
        @input="emit('seek', Number(($event.target as HTMLInputElement).value))"
      />
      <div class="counter mono">
        <span>step</span>
        <span class="num">{{ fmt(index) }}</span>
        <span class="faint">/ {{ pending ? '—' : fmt(last) }}</span>
      </div>
    </div>

    <label class="field field-inline speed">
      <span>Speed</span>
      <input
        type="range"
        class="range"
        min="1"
        max="100"
        :value="speed"
        @input="emit('update:speed', Number(($event.target as HTMLInputElement).value))"
      />
    </label>
  </div>
</template>

<style scoped>
.playback { display: flex; align-items: center; gap: 18px; padding: 8px 12px; flex-wrap: wrap; }
.buttons { display: flex; gap: 6px; }
.scrub { flex: 1; display: flex; align-items: center; gap: 12px; min-width: 240px; }
.scrub-range { flex: 1; width: auto; }
.counter { font-size: 12px; color: var(--text-muted); display: flex; gap: 6px; white-space: nowrap; }
.counter .num { color: var(--text); min-width: 5ch; text-align: right; }
.speed .range { width: 110px; }
</style>
