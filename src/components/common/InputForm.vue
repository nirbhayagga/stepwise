<script setup lang="ts">
import type { InputSpec, InputValues } from '../../engine/types';

defineProps<{ specs: InputSpec[]; modelValue: InputValues; disabled?: boolean; error?: string | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: InputValues): void; (e: 'change'): void }>();
</script>

<template>
  <div class="toolbar-group">
    <label v-for="s in specs" :key="s.key" class="field" :title="s.hint">
      <span>{{ s.label }}</span>
      <input
        class="input mono"
        :class="{ invalid: !!error }"
        :style="{ width: s.kind === 'int' ? '70px' : s.kind === 'ints' ? '300px' : '190px' }"
        :value="modelValue[s.key]"
        :disabled="disabled"
        spellcheck="false"
        @input="emit('update:modelValue', { ...modelValue, [s.key]: ($event.target as HTMLInputElement).value })"
        @change="emit('change')"
        @keydown.enter="emit('change')"
      />
    </label>
    <span v-if="error" class="error-text err">{{ error }}</span>
  </div>
</template>

<style scoped>
.err { align-self: center; padding-bottom: 6px; }
</style>
