<template>
  <main class="editorial-shell editorial-chinese-first">
    <nav class="editorial-nav" aria-label="Editorial demo navigation">
      <RouterLink :to="homePath">Home</RouterLink>
      <RouterLink :to="editorPath">Editor</RouterLink>
      <RouterLink :to="settingsPath">Settings</RouterLink>
      <RouterLink v-if="isDemoMode" to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="editorial-headline editorial-serif-heading">杂志感</h1>
    <p class="editorial-deck">章节化叙事，用更强排版强调“回看感”。</p>

    <section class="editorial-grid">
      <aside class="editorial-directory" data-zone="directory">
        <h2>目录</h2>
        <ol>
          <li v-for="note in chapterNotes" :key="`toc-${note.id}`">
            <RouterLink :to="`/notes/${note.id}/edit`">{{ note.title || '未命名章节' }}</RouterLink>
          </li>
        </ol>
      </aside>

      <section class="editorial-main editorial-reading-measure" data-zone="reading-stream">
        <h2>正文流</h2>
        <article v-for="note in chapterNotes" :key="note.id" class="editorial-reading-card">
          <h3>
            <RouterLink :to="`/notes/${note.id}/edit`">{{ note.title || '无题' }}</RouterLink>
          </h3>
          <p>{{ note.content || '暂无正文，开始写下你的第一段。' }}</p>
        </article>
      </section>

      <aside class="editorial-side" data-zone="marginalia">
        <h2>旁注</h2>
        <p>条目数：{{ visibleNotes.length }}</p>
        <p>标签：{{ topTags.join(' / ') || '尚未归档' }}</p>
        <RouterLink class="editorial-btn-link" :to="editorPath">新建稿件</RouterLink>
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
const chapterNotes = computed(() => visibleNotes.value.slice(0, 6));
const topTags = computed(() =>
  Array.from(new Set(visibleNotes.value.flatMap((item) => item.tags ?? []))).slice(0, 3),
);

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
