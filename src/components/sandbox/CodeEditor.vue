<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{ code: string }>();
const emit = defineEmits(['update:code']);
</script>

<template>
  <div class="editor-container">
    <textarea 
      class="code-textarea"
      :value="code"
      @input="(e) => emit('update:code', (e.target as HTMLTextAreaElement).value)"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex: 1;
  min-height: 400px;
}
.code-textarea {
  width: 100%;
  padding: 16px;
  background-color: #0d1117;
  color: #c9d1d9;
  border: 1px solid #30363d;
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}
.code-textarea:focus { border-color: #58a6ff; }
</style>
