<template>
  <main class="editorial-shell">
    <nav class="editorial-nav" aria-label="Editorial demo navigation">
      <RouterLink :to="homePath">Home</RouterLink>
      <RouterLink :to="editorPath">Editor</RouterLink>
      <RouterLink :to="settingsPath">Settings</RouterLink>
      <RouterLink v-if="isDemoMode" to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感</h1>
    <p class="editorial-deck">章节化叙事，用更强排版强调“回看感”。</p>

    <section class="editorial-grid">
      <section class="editorial-main">
        <article v-for="note in visibleNotes.slice(0, 4)" :key="note.id">
          <h3>
            <RouterLink :to="`/notes/${note.id}/edit`">{{ note.title }}</RouterLink>
          </h3>
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
import { computed, onMounted } from 'vue';
import '../../../styles/demo/editorial.css';
import { useDemoNotesViewModel } from '../../../composables/demo/useDemoNotesViewModel';
import { useNoteStore } from '../../../stores/noteStore';

const noteStore = useNoteStore();
const { visibleNotes } = useDemoNotesViewModel();

const currentPath = computed(() => {
  if (typeof window === 'undefined') return '/';
  const hashPath = window.location.hash.replace(/^#/, '');
  return hashPath || '/';
});

const isDemoMode = computed(() => currentPath.value.startsWith('/demo/editorial'));
const homePath = computed(() => (isDemoMode.value ? '/demo/editorial' : '/'));
const editorPath = computed(() => (isDemoMode.value ? '/demo/editorial/editor' : '/notes/new'));
const settingsPath = computed(() => (isDemoMode.value ? '/demo/editorial/settings' : '/settings'));

onMounted(async () => {
  if (noteStore.notes.length === 0) {
    await noteStore.loadNotes(false);
  }
});
</script>
