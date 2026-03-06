<template>
  <main class="dashboard-shell">
    <nav class="dashboard-nav" aria-label="Dashboard demo navigation">
      <RouterLink to="/demo/dashboard">Home</RouterLink>
      <RouterLink to="/demo/dashboard/editor">Editor</RouterLink>
      <RouterLink to="/demo/dashboard/settings">Settings</RouterLink>
      <RouterLink to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="dashboard-title">仪表盘感</h1>
    <p class="dashboard-sub">信息密度优先，把关键状态前置到第一屏。</p>

    <section class="dashboard-kpi">
      <article>
        <strong>{{ noteStore.notes.length }}</strong>
        <p>Total Notes</p>
      </article>
      <article>
        <strong>{{ noteStore.activeNotes.length }}</strong>
        <p>Active</p>
      </article>
      <article>
        <strong>{{ noteStore.archivedNotes.length }}</strong>
        <p>Archived</p>
      </article>
      <article>
        <strong>{{ visibleNotes.length }}</strong>
        <p>Visible</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <section class="dashboard-panel dashboard-list">
        <article v-for="note in visibleNotes.slice(0, 6)" :key="note.id">
          <h3>{{ note.title }}</h3>
          <p>{{ note.content }}</p>
        </article>
      </section>
      <aside class="dashboard-panel">
        <h3>Quick Ops</h3>
        <p>批量归档、标签筛选、时间区间快速跳转。</p>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import '../../../styles/demo/dashboard.css';
import { useDemoNotesViewModel } from '../../../composables/demo/useDemoNotesViewModel';
import { useNoteStore } from '../../../stores/noteStore';

const noteStore = useNoteStore();
const { visibleNotes } = useDemoNotesViewModel(noteStore);
</script>
