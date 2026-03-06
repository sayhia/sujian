<template>
  <main class="dashboard-shell dashboard-editor">
    <nav class="dashboard-nav">
      <RouterLink to="/demo/dashboard">Home</RouterLink>
      <RouterLink to="/demo/dashboard/editor">Editor</RouterLink>
      <RouterLink to="/demo/dashboard/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="dashboard-title">仪表盘编辑器</h1>
    <p class="dashboard-sub">元数据与正文并排，减少切换成本。</p>

    <section class="dashboard-editor-grid">
      <aside class="dashboard-panel">
        <label>
          <span>标题</span>
          <input v-model="form.title" />
        </label>
        <label>
          <span>类型</span>
          <select v-model="form.type">
            <option value="quick">Quick</option>
            <option value="article">Article</option>
          </select>
        </label>
      </aside>
      <section class="dashboard-panel">
        <label>
          <span>内容</span>
          <textarea v-model="form.content" />
        </label>
        <button class="dashboard-btn" type="button" :disabled="isSaving" @click="save">{{ isSaving ? 'Saving...' : 'Save Note' }}</button>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import '../../../styles/demo/dashboard.css';
import { useDemoEditorState } from '../../../composables/demo/useDemoEditorState';

const { form, isSaving, save } = useDemoEditorState();
</script>
