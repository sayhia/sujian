import { computed, ref } from 'vue';
import { useNoteStore } from '../../stores/noteStore';
import type { Note } from '../../types';

type EditorForm = {
  title: string;
  content: string;
  tags: string[];
  type: 'quick' | 'article';
};

export function useDemoEditorState(noteStore = useNoteStore(), initialNote?: Partial<Note>) {
  const form = ref<EditorForm>({
    title: initialNote?.title ?? '',
    content: initialNote?.content ?? '',
    tags: [...(initialNote?.tags ?? [])],
    type: initialNote?.type ?? 'quick',
  });
  const isSaving = ref(false);

  const isEditMode = computed(() => Number.isFinite(initialNote?.id));

  async function save() {
    isSaving.value = true;
    try {
      if (isEditMode.value && initialNote?.id) {
        return await noteStore.updateNote(initialNote.id, {
          title: form.value.title,
          content: form.value.content,
          tags: form.value.tags,
          type: form.value.type,
        });
      }

      return await noteStore.createNote({
        title: form.value.title,
        content: form.value.content,
        tags: form.value.tags,
        type: form.value.type,
      });
    } finally {
      isSaving.value = false;
    }
  }

  return {
    form,
    isSaving,
    isEditMode,
    save,
  };
}
