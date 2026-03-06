<template>
  <main class="minimal-shell">
    <nav class="minimal-nav" aria-label="Minimal demo navigation">
      <RouterLink to="/demo/minimal">Home</RouterLink>
      <RouterLink to="/demo/minimal/editor">Editor</RouterLink>
      <RouterLink to="/demo/minimal/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="minimal-title">专注极简</h1>
    <p class="minimal-sub">去噪布局，只保留记录与回看的核心节奏。</p>

    <section class="minimal-note-list">
      <article v-for="note in visibleNotes.slice(0, 6)" :key="note.id" class="minimal-note-card">
        <h3>{{ note.title || 'Untitled' }}</h3>
        <p>{{ note.content || 'No content' }}</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import '@/styles/demo/minimal.css';
import { useDemoNotesViewModel } from '@/composables/demo/useDemoNotesViewModel';

const { visibleNotes } = useDemoNotesViewModel();
</script>
