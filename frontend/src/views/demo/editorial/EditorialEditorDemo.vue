<template>
  <main class="editorial-shell editorial-editor">
    <nav class="editorial-nav">
      <RouterLink to="/demo/editorial">Home</RouterLink>
      <RouterLink to="/demo/editorial/editor">Editor</RouterLink>
      <RouterLink to="/demo/editorial/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感编辑器</h1>
    <p class="editorial-deck">给标题、副标题和正文更明确的排版角色。</p>

    <section class="editorial-panel">
      <label>
        <span>标题</span>
        <input v-model="form.title" />
      </label>
      <label>
        <span>正文</span>
        <textarea v-model="form.content" />
      </label>
      <button class="editorial-btn" type="button" :disabled="isSaving" @click="save">{{ isSaving ? '保存中...' : '发布草稿' }}</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import '@/styles/demo/editorial.css';
import { useDemoEditorState } from '@/composables/demo/useDemoEditorState';

const { form, isSaving, save } = useDemoEditorState();
</script>
