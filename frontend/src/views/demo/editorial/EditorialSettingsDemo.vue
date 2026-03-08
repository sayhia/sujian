<template>
  <main class="editorial-shell editorial-settings">
    <nav class="editorial-nav" aria-label="Editorial settings navigation">
      <RouterLink :to="homePath">Home</RouterLink>
      <RouterLink :to="editorPath">Editor</RouterLink>
      <RouterLink :to="settingsPath">Settings</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感设置</h1>
    <p class="editorial-deck">控制版式节奏、章节密度与排版语气。</p>

    <section class="editorial-settings-board">
      <section class="editorial-panel" data-zone="typography">
        <h2>Typography System</h2>
        <label>
          <span>标题风格</span>
          <select>
            <option>古典衬线</option>
            <option>现代几何</option>
          </select>
        </label>
      </section>

      <section class="editorial-panel" data-zone="material">
        <h2>Paper & Material</h2>
        <label>
          <span>纸张纹理</span>
          <select>
            <option>亚麻纸</option>
            <option>铜版纸</option>
          </select>
        </label>
      </section>

      <section class="editorial-panel" data-zone="cadence">
        <h2>Reading Cadence</h2>
        <label>
          <span>章节间距</span>
          <select>
            <option>宽松</option>
            <option>标准</option>
            <option>紧凑</option>
          </select>
        </label>
      </section>

      <section class="editorial-panel" data-zone="writing">
        <h2>Writing Behavior</h2>
        <label>
          <span>自动保存节奏</span>
          <select>
            <option>每 30 秒</option>
            <option>每 60 秒</option>
          </select>
        </label>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import '../../../styles/demo/editorial.css';

const currentPath = computed(() => {
  if (typeof window === 'undefined') return '/';
  const hashPath = window.location.hash.replace(/^#/, '');
  return hashPath || '/';
});
const isDemoMode = computed(() => currentPath.value.startsWith('/demo/editorial'));
const homePath = computed(() => (isDemoMode.value ? '/demo/editorial' : '/'));
const editorPath = computed(() => (isDemoMode.value ? '/demo/editorial/editor' : '/notes/new'));
const settingsPath = computed(() => (isDemoMode.value ? '/demo/editorial/settings' : '/settings'));
</script>
