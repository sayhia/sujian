<template>
  <main class="selector-page">
    <header class="selector-header">
      <p class="eyebrow">Panda Time-Note Demo Lab</p>
      <h1>选择一个 UI/交互风格</h1>
      <p class="subtitle">四套独立路线，覆盖 Home / Editor / Settings。</p>
    </header>

    <section class="style-grid">
      <RouterLink v-for="item in styleItems" :key="item.name" :to="item.path" class="style-card">
        <p class="style-name">{{ item.name }}</p>
        <p class="style-desc">{{ item.desc }}</p>
        <span class="style-path">{{ item.path }}</span>
      </RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
const styleItems = [
  {
    name: '专注极简',
    desc: '单列沉浸式阅读，去噪排版，弱化装饰。',
    path: '/demo/minimal',
  },
  {
    name: '杂志感',
    desc: '章节化时间线与强排版层次，强化编辑感。',
    path: '/demo/editorial',
  },
  {
    name: '仪表盘感',
    desc: '高密度信息与快捷操作，效率优先。',
    path: '/demo/dashboard',
  },
  {
    name: '情绪化时间胶囊',
    desc: '时间叙事与胶囊状态可视化，氛围优先。',
    path: '/demo/capsule',
  },
];
</script>

<style scoped>
.selector-page {
  min-height: 100vh;
  padding: 48px 24px;
  background:
    radial-gradient(circle at 12% 20%, color-mix(in srgb, var(--color-palette-3) 20%, transparent), transparent 48%),
    radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--color-palette-2) 16%, transparent), transparent 44%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 95%, #f6f3ee), var(--color-surface));
  color: var(--color-text-body);
}

.selector-header {
  max-width: 860px;
  margin: 0 auto 24px;
}

.eyebrow {
  margin: 0 0 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--color-text-muted);
}

h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.05;
}

.subtitle {
  margin: 12px 0 0;
  font-size: 16px;
  color: var(--color-text-muted);
}

.style-grid {
  max-width: 860px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.style-card {
  display: block;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 22%, transparent);
  background: color-mix(in srgb, var(--color-surface) 88%, white);
  text-decoration: none;
  color: inherit;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.style-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: color-mix(in srgb, var(--color-palette-2) 42%, transparent);
}

.style-name {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}

.style-desc {
  margin: 0 0 18px;
  color: var(--color-text-muted);
}

.style-path {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  color: var(--color-accent-strong);
}

@media (max-width: 860px) {
  .style-grid {
    grid-template-columns: 1fr;
  }
}
</style>
