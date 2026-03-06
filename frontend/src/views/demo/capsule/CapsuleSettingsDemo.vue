<template>
  <main class="capsule-shell capsule-settings">
    <nav class="capsule-nav">
      <RouterLink to="/demo/capsule">Home</RouterLink>
      <RouterLink to="/demo/capsule/editor">Editor</RouterLink>
      <RouterLink to="/demo/capsule/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="capsule-title">胶囊节奏设置</h1>
    <p class="capsule-sub">定义提醒节奏与回顾频率，让时间线更有情绪层次。</p>

    <label>
      <span>默认提醒策略</span>
      <select>
        <option>仅解锁当天提醒</option>
        <option>解锁前 1 天提醒</option>
        <option>每周回顾提醒</option>
      </select>
    </label>

    <label>
      <span>时间显示语气</span>
      <select>
        <option>精确时间</option>
        <option>人性化表达（3 天后）</option>
      </select>
    </label>
  </main>
</template>

<script setup lang="ts">
import '@/styles/demo/capsule.css';
</script>
