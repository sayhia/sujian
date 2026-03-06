<template>
  <main class="capsule-shell capsule-editor">
    <nav class="capsule-nav">
      <RouterLink to="/demo/capsule">Home</RouterLink>
      <RouterLink to="/demo/capsule/editor">Editor</RouterLink>
      <RouterLink to="/demo/capsule/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="capsule-title">时间胶囊编辑器</h1>
    <p class="capsule-sub">像写一封未来信，先决定何时开启，再写下此刻。</p>

    <label>
      <span>标题</span>
      <input v-model="form.title" placeholder="写给未来的标题" />
    </label>

    <label>
      <span>解锁时间</span>
      <input type="datetime-local" />
    </label>

    <label>
      <span>内容</span>
      <textarea v-model="form.content" placeholder="给未来的你，留一句话" />
    </label>

    <button class="capsule-btn" type="button" :disabled="isSaving" @click="save">{{ isSaving ? '封存中...' : '封存胶囊' }}</button>
  </main>
</template>

<script setup lang="ts">
import '@/styles/demo/capsule.css';
import { useDemoEditorState } from '@/composables/demo/useDemoEditorState';

const { form, isSaving, save } = useDemoEditorState();
</script>
