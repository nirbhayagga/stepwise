<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from '../../algorithms/tree';

const props = defineProps<{ root: TreeNode | null }>();

interface Placed { id: number; key: number; x: number; y: number; state: string; color?: string; height?: number }
interface Link { id: string; x1: number; y1: number; x2: number; y2: number }

const W = 1000, H = 560, R = 18, PAD = 40, LEVEL = 78;

/** In-order x placement: every node gets its own column, so siblings never overlap. */
const layout = computed(() => {
  const nodes: Placed[] = [];
  const links: Link[] = [];
  let col = 0, depthMax = 0;
  const walk = (n: TreeNode | null, depth: number): Placed | null => {
    if (!n) return null;
    const l = walk(n.left, depth + 1);
    const me: Placed = { id: n.id, key: n.key, x: col++, y: depth, state: n.state, color: n.color, height: n.height };
    nodes.push(me);
    depthMax = Math.max(depthMax, depth);
    const r = walk(n.right, depth + 1);
    for (const c of [l, r]) if (c) links.push({ id: `${me.id}-${c.id}`, x1: me.x, y1: me.y, x2: c.x, y2: c.y });
    return me;
  };
  walk(props.root, 0);
  const cols = Math.max(1, col);
  const stepX = Math.min(70, (W - 2 * PAD) / Math.max(1, cols - 1 || 1));
  const stepY = Math.min(LEVEL, (H - 2 * PAD) / Math.max(1, depthMax || 1));
  const totalW = stepX * (cols - 1);
  const x0 = (W - totalW) / 2;
  const px = (x: number) => x0 + x * stepX;
  const py = (y: number) => PAD + y * stepY;
  return {
    nodes: nodes.map(n => ({ ...n, x: px(n.x), y: py(n.y) })),
    links: links.map(l => ({ ...l, x1: px(l.x1), y1: py(l.y1), x2: px(l.x2), y2: py(l.y2) })),
  };
});
</script>

<template>
  <div class="panel canvas">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMin meet">
      <line v-for="l in layout.links" :key="l.id" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" class="link" />
      <g v-for="n in layout.nodes" :key="n.id" :class="['node', n.state, n.color]" :transform="`translate(${n.x}, ${n.y})`">
        <circle :r="R" />
        <text dominant-baseline="central" text-anchor="middle">{{ n.key }}</text>
        <text v-if="n.height !== undefined" class="meta" :y="R + 12" text-anchor="middle">h={{ n.height }}</text>
      </g>
      <text v-if="!layout.nodes.length" :x="W / 2" :y="H / 2" text-anchor="middle" class="empty">empty tree</text>
    </svg>
  </div>
</template>

<style scoped>
.canvas { padding: 8px; min-height: 380px; }
svg { width: 100%; height: auto; display: block; }
.link { stroke: var(--border-strong); stroke-width: 1.5; }
.node circle { fill: var(--surface-3); stroke: var(--text-faint); stroke-width: 1.5; transition: fill 0.15s, stroke 0.15s; }
.node text { fill: var(--text); font-family: var(--font-mono); font-size: 13px; }
.node .meta { fill: var(--text-faint); font-size: 10px; }
.node.red circle { fill: #5a2b2b; stroke: var(--s-write); }
.node.black circle { fill: #11151b; stroke: var(--text-muted); }
.node.visiting circle { fill: var(--s-compare); stroke: var(--s-compare); }
.node.visiting text { fill: #14120a; }
.node.inserted circle { fill: var(--s-sorted); stroke: var(--s-sorted); }
.node.inserted text { fill: #0d1a10; }
.node.rotating circle { fill: var(--s-mark); stroke: var(--s-mark); }
.node.rotating text { fill: #1a1020; }
.node.found circle { stroke: var(--accent-strong); stroke-width: 3; }
.node.removed circle { fill: var(--s-write); stroke: var(--s-write); }
.node.output circle { fill: var(--accent-bg); stroke: var(--accent); }
.node.output text { fill: var(--accent-strong); }
.empty { fill: var(--text-faint); font-size: 14px; }
</style>
