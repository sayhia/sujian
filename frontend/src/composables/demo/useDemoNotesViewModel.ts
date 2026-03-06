import { computed, ref } from 'vue';
import { useNoteStore } from '../../stores/noteStore';
import type { Note } from '../../types';

export function useDemoNotesViewModel(noteStore = useNoteStore()) {
  const searchQuery = ref('');
  const selectedTags = ref<string[]>([]);
  const includeArchived = ref(false);
  const timeFilter = ref<'all' | 'today' | 'week' | 'month'>('all');

  const visibleNotes = computed<Note[]>(() => {
    const keyword = searchQuery.value.trim().toLowerCase();

    return (noteStore.sortedNotes as Note[])
      .filter((note) => includeArchived.value || !note.is_archived)
      .filter((note) => {
        if (selectedTags.value.length === 0) return true;
        return selectedTags.value.every((tag) => note.tags?.includes(tag));
      })
      .filter((note) => {
        if (!keyword) return true;
        const haystack = `${note.title} ${note.content} ${(note.tags || []).join(' ')}`.toLowerCase();
        return haystack.includes(keyword);
      });
  });

  async function refresh() {
    await noteStore.loadFilteredNotes({
      filter: timeFilter.value,
      tags: selectedTags.value,
      search: searchQuery.value.trim(),
      archived: includeArchived.value,
    });
  }

  function toggleTag(tag: string) {
    if (selectedTags.value.includes(tag)) {
      selectedTags.value = selectedTags.value.filter((item) => item !== tag);
      return;
    }
    selectedTags.value = [...selectedTags.value, tag];
  }

  return {
    searchQuery,
    selectedTags,
    includeArchived,
    timeFilter,
    visibleNotes,
    refresh,
    toggleTag,
  };
}
