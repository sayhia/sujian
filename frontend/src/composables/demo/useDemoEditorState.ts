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
  const editingId = ref<number | null>(typeof initialNote?.id === 'number' ? initialNote.id : null);
  const form = ref<EditorForm>({
    title: initialNote?.title ?? '',
    content: initialNote?.content ?? '',
    tags: [...(initialNote?.tags ?? [])],
    type: initialNote?.type ?? 'quick',
  });
  const isSaving = ref(false);

  const isEditMode = computed(() => Number.isFinite(editingId.value));

  async function save() {
    isSaving.value = true;
    try {
      if (isEditMode.value && editingId.value) {
        return await noteStore.updateNote(editingId.value, {
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

  function setFormFromNote(note: Partial<Note>) {
    form.value = {
      title: note.title ?? '',
      content: note.content ?? '',
      tags: [...(note.tags ?? [])],
      type: note.type ?? form.value.type ?? 'quick',
    };
  }

  function setType(type: EditorForm['type']) {
    form.value.type = type;
  }

  function setEditingId(id: number | null) {
    editingId.value = id;
  }

  return {
    form,
    isSaving,
    isEditMode,
    editingId,
    save,
    setFormFromNote,
    setType,
    setEditingId,
  };
}
