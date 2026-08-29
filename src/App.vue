<script setup lang="ts">
import { computed } from 'vue';
import { NAV } from './router';

const groups = computed(() => {
  const order: string[] = [];
  const map = new Map<string, typeof NAV>();
  for (const n of NAV) {
    if (!map.has(n.group)) { map.set(n.group, []); order.push(n.group); }
    map.get(n.group)!.push(n);
  }
  return order.map(g => ({ group: g, items: map.get(g)! }));
});
</script>

<template>
  <div class="app">
    <nav class="sidebar">
      <div class="brand">
        <div class="brand-name">Stepwise</div>
        <div class="brand-sub">Algorithm visualizer</div>
      </div>
      <div v-for="g in groups" :key="g.group" class="nav-group">
        <div class="nav-group-title">{{ g.group }}</div>
        <router-link v-for="item in g.items" :key="item.path" :to="item.path" class="nav-link">
          {{ item.label }}
        </router-link>
      </div>
      <div class="sidebar-footer">
        <div class="hint"><span class="kbd">Space</span> play / pause</div>
        <div class="hint"><span class="kbd">←</span> <span class="kbd">→</span> step</div>
        <div class="hint"><span class="kbd">Home</span> <span class="kbd">End</span> jump</div>
      </div>
    </nav>
    <main class="content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.app { display: flex; height: 100vh; height: 100dvh; }
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 18px 0;
  overflow-y: auto;
}
.brand { padding: 0 18px 16px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.brand-name { font-weight: 600; font-size: 15px; letter-spacing: -0.01em; }
.brand-sub { font-size: 12px; color: var(--text-muted); }
.nav-group { padding: 8px 10px 4px; }
.nav-group-title {
  font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-faint); padding: 0 8px 4px;
}
.nav-link {
  display: block; padding: 5px 8px; border-radius: var(--radius);
  color: var(--text-muted); font-size: 13px; white-space: nowrap;
}
.nav-link:hover { color: var(--text); background: var(--surface-2); }
.nav-link.router-link-active { color: var(--accent-strong); background: var(--accent-bg); }
.sidebar-footer { margin-top: auto; padding: 14px 18px 0; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
.hint { font-size: 11.5px; color: var(--text-faint); display: flex; gap: 6px; align-items: center; }
.content { flex: 1; padding: 20px 24px; overflow-y: auto; min-width: 0; -webkit-overflow-scrolling: touch; }

/* Narrow screens: the sidebar becomes a horizontally scrolling top bar. */
@media (max-width: 800px) {
  .app { flex-direction: column; }
  .sidebar {
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    padding: 8px 10px;
    border-right: none;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
  .sidebar::-webkit-scrollbar { display: none; }
  .brand { padding: 0 10px 0 0; margin: 0 6px 0 0; border-bottom: none; border-right: 1px solid var(--border); }
  .brand-sub { display: none; }
  .nav-group { display: flex; align-items: center; padding: 0 4px; }
  .nav-group-title { padding: 0 6px 0 4px; white-space: nowrap; }
  .nav-link { padding: 4px 8px; }
  .sidebar-footer { display: none; }
  .content { padding: 12px; }
}
</style>
