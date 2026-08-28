<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ code: string; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:code', v: string): void }>();
const lines = computed(() => props.code.split('\n').length);

const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const el = e.target as HTMLTextAreaElement;
  const { selectionStart: s, selectionEnd: en } = el;
  const next = props.code.slice(0, s) + '  ' + props.code.slice(en);
  emit('update:code', next);
  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
};
</script>

<template>
  <div class="panel editor">
    <div class="gutter mono" aria-hidden="true"><div v-for="n in lines" :key="n">{{ n }}</div></div>
    <textarea
      class="mono"
      :value="code"
      :disabled="disabled"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      @input="emit('update:code', ($event.target as HTMLTextAreaElement).value)"
      @keydown="onKey"
    ></textarea>
  </div>
</template>

<style scoped>
.editor { display: flex; min-height: 420px; overflow: hidden; }
.gutter {
  padding: 12px 8px 12px 12px; text-align: right; color: var(--text-faint); font-size: 12.5px; line-height: 1.5;
  user-select: none; border-right: 1px solid var(--border); background: var(--surface-2);
}
textarea {
  flex: 1; resize: vertical; border: none; outline: none; background: transparent; color: var(--text);
  padding: 12px; font-size: 12.5px; line-height: 1.5; white-space: pre; overflow: auto; min-height: 420px;
}
textarea:disabled { opacity: 0.6; }
</style>
