<template>
  <main class="editorial-shell editorial-editor">
    <nav class="editorial-nav">
      <RouterLink to="/demo/editorial">Home</RouterLink>
      <RouterLink to="/demo/editorial/editor">Editor</RouterLink>
      <RouterLink to="/demo/editorial/settings">Settings</RouterLink>
    </nav>

    <h1 class="editorial-headline">杂志感编辑器</h1>
    <p class="editorial-deck">给标题、副标题和正文更明确的排版角色。</p>

    <section class="editorial-panel">
      <p class="editorial-save-state" data-testid="save-state">{{ saveStateLabel }}</p>
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNoteStore } from '../../../stores/noteStore';
import '../../../styles/demo/editorial.css';
import { useDemoEditorState } from '../../../composables/demo/useDemoEditorState';

const route = useRoute();
const router = useRouter();
const noteStore = useNoteStore();
const routeMode = computed(() => {
  if (route.params.id) return 'edit' as const;
  if (route.path.endsWith('/new/article') || route.meta?.type === 'article') return 'article' as const;
  return 'create' as const;
});
const { form, isSaving, save, setFormFromNote, setEditingId, applyRouteMode } = useDemoEditorState(
  noteStore,
  undefined,
  routeMode.value,
);
const isDemoMode = computed(() => route.path.startsWith('/demo/editorial'));
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
const saveStateLabel = computed(() => {
  if (saveState.value === 'saving') return '保存中...';
  if (saveState.value === 'saved') return '已保存';
  if (saveState.value === 'error') return '保存失败';
  return '待保存';
});

onMounted(async () => {
  applyRouteMode(routeMode.value);
  const rawId = route.params.id;
  if (typeof rawId === 'string' && rawId.trim() !== '') {
    const id = Number(rawId);
    if (Number.isFinite(id)) {
      const note = await noteStore.getNote(id);
      if (note) {
        setEditingId(note.id);
        setFormFromNote(note);
      }
    }
  }
});

async function handleSave() {
  saveState.value = 'saving';
  try {
    await save();
    saveState.value = 'saved';
    if (!isDemoMode.value) {
      await router.push('/');
    }
  } catch (error) {
    saveState.value = 'error';
  }
}
</script>
