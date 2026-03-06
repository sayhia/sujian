<template>
  <main class="minimal-shell minimal-settings">
    <nav class="minimal-nav">
      <RouterLink to="/demo/minimal">Home</RouterLink>
      <RouterLink to="/demo/minimal/editor">Editor</RouterLink>
      <RouterLink to="/demo/minimal/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="minimal-title">专注极简设置</h1>
    <p class="minimal-sub">控制变量，保持页面视觉与交互的稳定性。</p>

    <label>
      <span>排版密度</span>
      <select>
        <option>舒适</option>
        <option>标准</option>
        <option>紧凑</option>
      </select>
    </label>

    <label>
      <span>动画节奏</span>
      <select>
        <option>柔和</option>
        <option>快速</option>
        <option>关闭</option>
      </select>
    </label>
  </main>
</template>

<script setup lang="ts">
import '../../../styles/demo/minimal.css';
</script>
