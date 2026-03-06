<template>
  <main class="editorial-shell">
    <nav class="editorial-nav" aria-label="Editorial demo navigation">
      <RouterLink to="/demo/editorial">Home</RouterLink>
      <RouterLink to="/demo/editorial/editor">Editor</RouterLink>
      <RouterLink to="/demo/editorial/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感</h1>
    <p class="editorial-deck">章节化叙事，用更强排版强调“回看感”。</p>

    <section class="editorial-grid">
      <section class="editorial-main">
        <article v-for="note in visibleNotes.slice(0, 4)" :key="note.id">
          <h3>{{ note.title }}</h3>
          <p>{{ note.content }}</p>
        </article>
      </section>
      <aside class="editorial-side">
        <h3>Side Notes</h3>
        <p>日期章节、重点摘录、编辑注脚。</p>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import '@/styles/demo/editorial.css';
import { useDemoNotesViewModel } from '@/composables/demo/useDemoNotesViewModel';

const { visibleNotes } = useDemoNotesViewModel();
</script>
