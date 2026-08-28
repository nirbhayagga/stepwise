<script setup lang="ts">
import type { AlgorithmMeta } from '../../engine/types';

defineProps<{ modelValue: string; options: AlgorithmMeta[]; label?: string; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();
</script>

<template>
  <label class="field">
    <span>{{ label ?? 'Algorithm' }}</span>
    <select
      class="select"
      :value="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.name }}</option>
    </select>
  </label>
</template>
