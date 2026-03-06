<template>
  <main class="dashboard-shell dashboard-settings">
    <nav class="dashboard-nav">
      <RouterLink to="/demo/dashboard">Home</RouterLink>
      <RouterLink to="/demo/dashboard/editor">Editor</RouterLink>
      <RouterLink to="/demo/dashboard/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="dashboard-title">仪表盘设置</h1>
    <p class="dashboard-sub">集中管理密度、提示、快捷行为。</p>

    <section class="dashboard-panel">
      <label>
        <span>卡片密度</span>
        <select>
          <option>高密度</option>
          <option>标准</option>
        </select>
      </label>
      <label>
        <span>快捷提示</span>
        <select>
          <option>显示</option>
          <option>隐藏</option>
        </select>
      </label>
    </section>
  </main>
</template>

<script setup lang="ts">
import '../../../styles/demo/dashboard.css';
</script>
