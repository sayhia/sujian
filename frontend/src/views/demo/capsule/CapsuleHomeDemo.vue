<template>
  <main class="capsule-shell">
    <nav class="capsule-nav">
      <RouterLink to="/demo/capsule">Home</RouterLink>
      <RouterLink to="/demo/capsule/editor">Editor</RouterLink>
      <RouterLink to="/demo/capsule/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="capsule-title">情绪化时间胶囊</h1>
    <p class="capsule-sub">把“未来打开”的情绪落在可见的时间轨道上。</p>

    <section class="capsule-timeline">
      <article v-for="note in visibleNotes.slice(0, 6)" :key="note.id" class="capsule-card" :class="{ locked: note.is_archived }">
        <span class="capsule-badge">{{ note.is_archived ? 'LOCKED CAPSULE' : 'OPEN MEMORY' }}</span>
        <h3>{{ note.title }}</h3>
        <p>{{ note.is_archived ? '内容将在未来解锁。' : note.content }}</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import '@/styles/demo/capsule.css';
import { useDemoNotesViewModel } from '@/composables/demo/useDemoNotesViewModel';

const { visibleNotes } = useDemoNotesViewModel();
</script>
