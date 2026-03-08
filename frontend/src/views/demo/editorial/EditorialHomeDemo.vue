<template>
  <main class="editorial-shell editorial-chinese-first">
    <nav class="editorial-nav" aria-label="Editorial demo navigation">
      <RouterLink :to="homePath">Home</RouterLink>
      <RouterLink :to="editorPath">Editor</RouterLink>
      <RouterLink :to="settingsPath">Settings</RouterLink>
    </nav>

    <h1 class="editorial-headline editorial-serif-heading">杂志感</h1>
    <p class="editorial-deck">章节化叙事，用更强排版强调“回看感”。</p>

    <section class="editorial-grid">
      <aside class="editorial-directory" data-zone="directory" data-mobile-order="1">
        <h2>目录</h2>
        <label>
          <span>检索</span>
          <input data-testid="search-input" v-model="searchQuery" />
        </label>
        <label>
          <span>时间</span>
          <select data-testid="time-filter" v-model="timeFilter">
            <option value="all">全部</option>
            <option value="today">今日</option>
            <option value="week">近 7 天</option>
            <option value="month">近 30 天</option>
          </select>
        </label>
        <div>
          <button
            v-for="tag in availableTags"
            :key="tag"
            :data-testid="`tag-${tag}`"
            type="button"
            @click="toggleTag(tag)"
          >
            {{ selectedTags.includes(tag) ? `#${tag} ✓` : `#${tag}` }}
          </button>
        </div>
      </aside>
      <section class="editorial-main editorial-reading-measure" data-zone="reading-stream" data-mobile-order="2">
        <article v-for="note in visibleNotes.slice(0, 4)" :key="note.id">
          <h3>{{ note.title }}</h3>
          <p>{{ note.content }}</p>
        </article>
      </section>
      <aside class="editorial-side" data-zone="marginalia" data-mobile-order="3">
        <h3>Side Notes</h3>
        <p>日期章节、重点摘录、编辑注脚。</p>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import '../../../styles/demo/editorial.css';
import { useDemoNotesViewModel } from '../../../composables/demo/useDemoNotesViewModel';

const { visibleNotes, searchQuery, timeFilter, availableTags, selectedTags, toggleTag } = useDemoNotesViewModel();
const currentPath = computed(() => {
  if (typeof window === 'undefined') return '/';
  const hashPath = window.location.hash.replace(/^#/, '');
  return hashPath || '/';
});
const isDemoMode = computed(() => currentPath.value.startsWith('/demo/editorial'));
const homePath = computed(() => (isDemoMode.value ? '/demo/editorial' : '/'));
const editorPath = computed(() => (isDemoMode.value ? '/demo/editorial/editor' : '/notes/new'));
const settingsPath = computed(() => (isDemoMode.value ? '/demo/editorial/settings' : '/settings'));
</script>
