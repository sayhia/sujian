<template>
  <main class="editorial-shell editorial-settings">
    <nav class="editorial-nav" aria-label="Editorial settings navigation">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/notes/new">Editor</RouterLink>
      <RouterLink to="/settings">Settings</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感设置</h1>
    <p class="editorial-deck">控制版式节奏、章节密度与排版语气。</p>

    <section class="editorial-settings-board">
      <section class="editorial-panel" data-zone="typography">
        <h2>Typography System</h2>
        <label>
          <span>标题风格</span>
          <select data-testid="settings-typography" v-model="settings.typography">
            <option value="classic-serif">古典衬线</option>
            <option value="modern-geo">现代几何</option>
          </select>
        </label>
      </section>

      <section class="editorial-panel" data-zone="material">
        <h2>Paper & Material</h2>
        <label>
          <span>纸张纹理</span>
          <select data-testid="settings-material" v-model="settings.material">
            <option value="linen-paper">亚麻纸</option>
            <option value="coated-paper">铜版纸</option>
          </select>
        </label>
      </section>

      <section class="editorial-panel" data-zone="cadence">
        <h2>Reading Cadence</h2>
        <label>
          <span>章节间距</span>
          <select data-testid="settings-cadence" v-model="settings.cadence">
            <option value="wide">宽松</option>
            <option value="standard">标准</option>
            <option value="compact">紧凑</option>
          </select>
        </label>
      </section>

      <section class="editorial-panel" data-zone="writing">
        <h2>Writing Behavior</h2>
        <label>
          <span>自动保存节奏</span>
          <select data-testid="settings-writing" v-model="settings.writing">
            <option value="autosave-30s">每 30 秒</option>
            <option value="autosave-60s">每 60 秒</option>
          </select>
        </label>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import '../../../styles/demo/editorial.css';
import { useEditorialSettings } from '../../../composables/demo/useEditorialSettings';
const { settings } = useEditorialSettings();
</script>
