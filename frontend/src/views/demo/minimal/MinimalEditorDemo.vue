<template>
  <main class="minimal-shell minimal-editor">
    <nav class="minimal-nav">
      <RouterLink to="/demo/minimal">Home</RouterLink>
      <RouterLink to="/demo/minimal/editor">Editor</RouterLink>
      <RouterLink to="/demo/minimal/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="minimal-title">专注极简编辑器</h1>
    <p class="minimal-sub">窄栏写作，减少同时处理的信息负担。</p>

    <label>
      <span>标题</span>
      <input v-model="form.title" placeholder="写一个标题" />
    </label>

    <label>
      <span>内容</span>
      <textarea v-model="form.content" placeholder="开始写作..." />
    </label>

    <div class="minimal-actions">
      <button class="minimal-btn" type="button" :disabled="isSaving" @click="save">{{ isSaving ? '保存中...' : '保存' }}</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import '../../../styles/demo/minimal.css';
import { useDemoEditorState } from '../../../composables/demo/useDemoEditorState';

const { form, isSaving, save } = useDemoEditorState();
</script>
