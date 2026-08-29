<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{ code: string[]; activeLine: number | null }>();
const container = ref<HTMLElement | null>(null);

watch(() => props.activeLine, async (line) => {
  if (!line || !container.value) return;
  await nextTick();
  const el = container.value.querySelector('.line.active') as HTMLElement | null;
  if (!el) return;
  // Scroll only this panel. scrollIntoView() would also scroll every
  // ancestor (the page), which fights the user's own scrolling during playback.
  const c = container.value;
  const top = el.offsetTop, bottom = top + el.offsetHeight;
  if (top < c.scrollTop) c.scrollTop = top;
  else if (bottom > c.scrollTop + c.clientHeight) c.scrollTop = bottom - c.clientHeight;
});
</script>

<template>
  <div class="panel">
    <div class="panel-title">Pseudocode</div>
    <div ref="container" class="code">
      <div v-for="(text, i) in code" :key="i" class="line" :class="{ active: activeLine === i + 1 }">
        <span class="ln">{{ i + 1 }}</span>
        <pre class="txt">{{ text }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code { position: relative; padding: 6px 0; max-height: 460px; overflow: auto; overscroll-behavior: contain; font-family: var(--font-mono); font-size: 11.5px; }
.line { display: flex; gap: 10px; padding: 1px 12px; border-left: 2px solid transparent; }
.line.active { background: var(--accent-bg); border-left-color: var(--accent); }
.ln { color: var(--text-faint); width: 2ch; text-align: right; flex-shrink: 0; user-select: none; }
.txt { margin: 0; white-space: pre; color: var(--text); font: inherit; }
.line.active .txt { color: var(--accent-strong); }
</style>
