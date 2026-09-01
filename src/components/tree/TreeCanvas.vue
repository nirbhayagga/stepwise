<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from '../../algorithms/tree';

const props = defineProps<{ root: TreeNode | null; forest?: TreeNode[] | null }>();

interface Placed { id: number; text: string; label: string; x: number; y: number; state: string; color?: string }
interface Link { id: string; x1: number; y1: number; x2: number; y2: number }

const W = 1000, H = 560, R = 18, PAD = 40, LEVEL = 78;

/**
 * Binary nodes are placed by in-order column (a lone left child leans left);
 * nodes with a `children` array centre over their children. Multiple roots
 * (a forest) share the column axis with a gap between them.
 */
const layout = computed(() => {
  const roots = props.forest ?? (props.root ? [props.root] : []);
  const nodes: Placed[] = [];
  const links: Link[] = [];
  let col = 0, depthMax = 0;

  const place = (n: TreeNode, depth: number, x: number): Placed => {
    const p: Placed = {
      id: n.id,
      text: n.text ?? String(n.key),
      label: n.label ?? (n.height !== undefined ? `h=${n.height}` : ''),
      x, y: depth, state: n.state, color: n.color,
    };
    nodes.push(p);
    depthMax = Math.max(depthMax, depth);
    return p;
  };
  const link = (a: Placed, b: Placed) => links.push({ id: `${a.id}-${b.id}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y });

  const walkBinary = (n: TreeNode, depth: number): Placed => {
    const l = n.left ? walkBinary(n.left, depth + 1) : null;
    const me = place(n, depth, col++);
    const r = n.right ? walkBinary(n.right, depth + 1) : null;
    if (l) link(me, l);
    if (r) link(me, r);
    return me;
  };
  const walkNary = (n: TreeNode, depth: number): Placed => {
    const kids = (n.children ?? []).map(c => walkNary(c, depth + 1));
    const x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : col++;
    const me = place(n, depth, x);
    for (const k of kids) link(me, k);
    return me;
  };

  roots.forEach((r, i) => {
    if (i > 0) col++;
    if (r.children !== undefined) walkNary(r, 0); else walkBinary(r, 0);
  });

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
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Tree diagram">
      <line v-for="l in layout.links" :key="l.id" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" class="link" />
      <g v-for="n in layout.nodes" :key="n.id" :class="['node', n.state, n.color]" :transform="`translate(${n.x}, ${n.y})`">
        <circle :r="R" />
        <text dominant-baseline="central" text-anchor="middle">{{ n.text }}</text>
        <text v-if="n.label" class="meta" :y="R + 12" text-anchor="middle">{{ n.label }}</text>
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
.node.visiting .meta { fill: #3a3520; }
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
