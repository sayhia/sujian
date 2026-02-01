<template>
  <div class="editor-page">
    <Editor
      :note="currentNote"
      :mode="mode"
      :note-type="noteType"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Editor from '../components/Editor.vue';
import { useNoteStore } from '../stores/noteStore';
import type { Note } from '../types';

const route = useRoute();
const router = useRouter();
const noteStore = useNoteStore();
const toast = inject<(message: string, type?: 'success' | 'error' | 'warning' | 'info') => void>('showToast');

const mode = ref<'create' | 'edit'>('create');
const noteType = ref<'quick' | 'article'>('quick');
const currentNote = ref<Note | null>(null);

onMounted(async () => {
  console.log('NoteEditorPage mounted, route:', route);
  console.log('route.meta:', route.meta);
  console.log('route.meta.type:', route.meta.type);
  
  mode.value = (route.meta.mode as 'create' | 'edit') || 'create';
  const routeType = route.meta.type;
  noteType.value = (routeType === 'article' || routeType === 'quick') ? routeType : 'quick';
  console.log('noteType set to:', noteType.value);
  
  if (mode.value === 'edit' && route.params.id) {
    const noteId = Number(route.params.id);
    console.log('Loading note with ID:', noteId);
    
    try {
      const note = await noteStore.getNote(noteId);
      console.log('Loaded note:', note);
      
      if (note) {
        currentNote.value = note;
        noteType.value = note.type as 'quick' | 'article';
      } else {
        console.error('笔记未找到，ID:', noteId);
        toast?.('笔记未找到', 'error');
        // 笔记未找到时跳转回首页
        router.push('/');
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
      toast?.('加载笔记失败', 'error');
      router.push('/');
    }
  }
});

async function handleSave(noteData: { title: string; content: string; tags: string[]; type: 'quick' | 'article' }) {
  try {
    if (mode.value === 'edit' && currentNote.value) {
      const updatedNote = await noteStore.updateNote(currentNote.value.id, noteData);
      currentNote.value = updatedNote;
      toast?.('保存成功', 'success');
    } else {
      await noteStore.createNote(noteData);
      // 新建模式：保存后跳转回首页查看新笔记
      router.push('/');
    }
  } catch (error) {
    console.error('保存笔记失败:', error);
    toast?.('保存失败', 'error');
  }
}

function handleCancel() {
  // 如果有未保存的修改，显示确认对话框
  // 这里简化处理：直接跳转回首页
  router.push('/');
}
</script>

<style scoped>
.editor-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--color-palette-5) 0%,
    color-mix(in srgb, var(--color-palette-4) 30%, var(--color-palette-5)) 50%,
    var(--color-palette-5) 100%
  );
  position: relative;
  overflow: hidden;
}

.editor-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    color-mix(in srgb, var(--color-palette-3) 8%, transparent) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 70% 70%,
    color-mix(in srgb, var(--color-palette-2) 5%, transparent) 0%,
    transparent 40%
  );
  pointer-events: none;
  z-index: 0;
}

.editor-page > * {
  position: relative;
  z-index: 1;
}
</style>
