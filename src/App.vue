<script setup lang="ts">
</script>

<template>
  <div class="app-layout">
    <nav class="sidebar">
      <h2>AlgoViewer</h2>
      <ul>
        <li><router-link to="/sort">Sorting</router-link></li>
        <li><router-link to="/compare">Sorting Compare</router-link></li>
        <li><router-link to="/path">Pathfinding</router-link></li>
        <li><router-link to="/path-compare">Path Compare</router-link></li>
        <li><router-link to="/dp">Dynamic Prog.</router-link></li>
        <li><router-link to="/tree">Trees/Graphs</router-link></li>
        <li><router-link to="/sandbox">Sandbox</router-link></li>
      </ul>
    </nav>
    <main class="content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
  color: #c9d1d9;
  background-color: #0d1117;
}

.sidebar {
  width: 250px;
  background-color: #161b22;
  padding: 20px;
  border-right: 1px solid #30363d;
}

.sidebar h2 {
  margin-top: 0;
  color: #58a6ff;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin-bottom: 10px;
}

.sidebar a {
  color: #c9d1d9;
  text-decoration: none;
  font-weight: bold;
}

.sidebar a.router-link-active {
  color: #58a6ff;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
