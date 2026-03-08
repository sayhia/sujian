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

    <section class="editorial-panel">
      <label>
        <span>标题</span>
        <input v-model="form.title" />
      </label>
      <label>
        <span>正文</span>
        <textarea v-model="form.content" />
      </label>
      <button class="editorial-btn" type="button" :disabled="isSaving" @click="handleSave">{{ isSaving ? '保存中...' : '发布草稿' }}</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import '../../../styles/demo/editorial.css';
import { useDemoEditorState } from '../../../composables/demo/useDemoEditorState';
import { useNoteStore } from '../../../stores/noteStore';

const route = useRoute();
const router = useRouter();
const noteStore = useNoteStore();
const { form, isSaving, save, setFormFromNote, setType, setEditingId } = useDemoEditorState(noteStore);

const isDemoMode = computed(() => route.path.startsWith('/demo/editorial'));
const homePath = computed(() => (isDemoMode.value ? '/demo/editorial' : '/'));
const editorPath = computed(() => (isDemoMode.value ? '/demo/editorial/editor' : '/notes/new'));
const settingsPath = computed(() => (isDemoMode.value ? '/demo/editorial/settings' : '/settings'));

onMounted(async () => {
  if (route.path.endsWith('/new/article') || route.meta?.type === 'article') {
    setType('article');
  }

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
