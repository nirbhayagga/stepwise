<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{ code: string[]; activeLine: number | null }>();

const containerRef = ref<HTMLElement | null>(null);

watch(() => props.activeLine, async (newVal) => {
  if (newVal && containerRef.value) {
    await nextTick();
    const activeEl = containerRef.value.querySelector('.code-line.active') as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  }
});
</script>

<template>
  <div class="pseudocode-panel">
    <h3>Pseudocode Trace</h3>
    <div class="code-lines" ref="containerRef">
      <div 
        v-for="(line, index) in code" 
        :key="index"
        class="code-line"
        :class="{ active: activeLine === index + 1 }"
      >
        <span class="line-number">{{ index + 1 }}</span>
        <pre class="line-text">{{ line }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pseudocode-panel {
  background-color: #161b22;
  border: 1px solid #30363d;
  padding: 15px;
  border-radius: 8px;
  min-width: 320px;
  flex: 1;
}
h3 { margin-top: 0; color: #c9d1d9; font-size: 16px; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
.code-lines { display: flex; flex-direction: column; overflow: auto; max-height: 40vh; }
.code-line { display: flex; padding: 2px 5px; border-radius: 4px; border-left: 3px solid transparent; }
.code-line.active { background-color: rgba(88, 166, 255, 0.2); border-left-color: #58a6ff; }
.line-number { color: #8b949e; font-family: monospace; font-size: 13px; width: 30px; user-select: none; }
.line-text { margin: 0; color: #c9d1d9; font-family: monospace; font-size: 13px; white-space: pre; font-weight: bold; }
</style>
