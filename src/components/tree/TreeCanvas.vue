<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from '../../utils/treeAlgorithms';

const props = defineProps<{ root: TreeNode | null }>();

type PlacedNode = TreeNode & { x: number; y: number };
type Link = { x1: number; y1: number; x2: number; y2: number };

const LAYOUT = computed(() => {
    const pNodes: PlacedNode[] = [];
    const pLinks: Link[] = [];
    
    // Scale X dynamically based on the assumption SVG is fixed view box
    const traverse = (node: TreeNode, depth: number, minX: number, maxX: number, parentX?: number, parentY?: number) => {
        const x = (minX + maxX) / 2;
        const y = 50 + depth * 80;
        pNodes.push({ ...node, x, y });
        if (parentX !== undefined && parentY !== undefined) {
             pLinks.push({ x1: parentX, y1: parentY, x2: x, y2: y });
        }
        if (node.left) traverse(node.left, depth + 1, minX, x, x, y);
        if (node.right) traverse(node.right, depth + 1, x, maxX, x, y);
    }
    
    if (props.root) traverse(props.root, 0, 0, 1000); 
    return { nodes: pNodes, links: pLinks };
});
</script>

<template>
  <div class="tree-canvas">
      <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMin meet">
          <template v-for="link in LAYOUT.links" :key="`${link.x1}-${link.y1}-${link.x2}-${link.y2}`">
              <line :x1="link.x1" :y1="link.y1" :x2="link.x2" :y2="link.y2" stroke="#30363d" stroke-width="3" />
          </template>
          
          <template v-for="node in LAYOUT.nodes" :key="node.id">
              <circle 
                :cx="node.x" 
                :cy="node.y" 
                r="22" 
                class="node-circle"
                :class="node.color"
              />
              <text 
                :x="node.x" 
                :y="node.y" 
                class="node-text" 
                dominant-baseline="central" 
                text-anchor="middle"
              >
                {{ node.value }}
              </text>
          </template>
      </svg>
  </div>
</template>

<style scoped>
.tree-canvas {
  flex: 1;
  background-color: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.node-circle {
  transition: all 0.2s;
  stroke: #58a6ff;
  stroke-width: 2;
}
.node-circle.default { fill: #161b22; }
.node-circle.visiting { fill: #d2a8ff; stroke: #a371f7; }
.node-circle.inserted { fill: #3fb950; stroke: #2ea043; }
.node-circle.red { fill: #da3633; stroke: #f85149; }
.node-circle.black { fill: #21262d; stroke: #8b949e; }
.node-text {
  fill: #c9d1d9;
  font-family: inherit;
  font-weight: bold;
  font-size: 16px;
  pointer-events: none;
}
</style>
