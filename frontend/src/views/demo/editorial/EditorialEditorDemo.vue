<template>
  <main class="editorial-shell editorial-editor">
    <nav class="editorial-nav" aria-label="Editorial editor navigation">
      <RouterLink :to="homePath">Home</RouterLink>
      <RouterLink :to="editorPath">Editor</RouterLink>
      <RouterLink :to="settingsPath">Settings</RouterLink>
      <RouterLink v-if="isDemoMode" to="/demo/styles">All Styles</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感编辑器</h1>
    <p class="editorial-deck">给标题、副标题和正文更明确的排版角色。</p>

    <section class="editorial-writing-desk">
      <section class="editorial-panel editorial-desk-main">
        <label>
          <span>主标题</span>
          <input v-model="form.title" placeholder="写下标题" />
        </label>
        <label>
          <span>导语</span>
          <input v-model="deck" placeholder="一句话概括要点" />
        </label>
        <label>
          <span>正文</span>
          <textarea v-model="form.content" placeholder="从第一段开始，慢慢铺开..." />
        </label>
      </section>

      <aside class="editorial-panel editorial-metadata-rail">
        <h2>稿件信息</h2>
        <p>模式：{{ modeLabel }}</p>
        <p>文体：{{ form.type === 'article' ? '文章' : '快记' }}</p>
        <p>编辑中：{{ editingId ? `#${editingId}` : '新稿' }}</p>
        <button class="editorial-btn" type="button" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? '保存中...' : '发布草稿' }}
        </button>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import '../../../styles/demo/editorial.css';
import { useDemoEditorState } from '../../../composables/demo/useDemoEditorState';
import { useNoteStore } from '../../../stores/noteStore';

const route = useRoute();
const router = useRouter();
const noteStore = useNoteStore();
const routeMode = computed(() => {
  if (route.params.id) return 'edit' as const;
  if (route.path.endsWith('/new/article') || route.meta?.type === 'article') return 'article' as const;
  return 'create' as const;
});
const { form, isSaving, save, editingId, setFormFromNote, setEditingId, applyRouteMode } = useDemoEditorState(
  noteStore,
  undefined,
  routeMode.value,
);
const deck = ref('');
const modeLabel = computed(() => (routeMode.value === 'edit' ? '编辑' : routeMode.value === 'article' ? '新文章' : '新笔记'));

const isDemoMode = computed(() => route.path.startsWith('/demo/editorial'));
const homePath = computed(() => (isDemoMode.value ? '/demo/editorial' : '/'));
const editorPath = computed(() => (isDemoMode.value ? '/demo/editorial/editor' : '/notes/new'));
const settingsPath = computed(() => (isDemoMode.value ? '/demo/editorial/settings' : '/settings'));

onMounted(async () => {
  applyRouteMode(routeMode.value);

  const rawId = route.params.id;
  if (typeof rawId === 'string' && rawId.trim() !== '') {
    const noteId = Number(rawId);
    if (Number.isFinite(noteId)) {
      const note = await noteStore.getNote(noteId);
      if (note) {
        setEditingId(note.id);
        setFormFromNote(note);
      }
    }
  }
});

async function handleSave() {
  await save();
  if (!isDemoMode.value) {
    await router.push('/');
  }
}
</script>
