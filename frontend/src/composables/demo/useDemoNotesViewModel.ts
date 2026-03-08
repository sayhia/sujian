import { computed, ref } from 'vue';
import { useNoteStore } from '../../stores/noteStore';
import type { Note } from '../../types';

export function useDemoNotesViewModel(noteStore = useNoteStore()) {
  const searchQuery = ref('');
  const selectedTags = ref<string[]>([]);
  const includeArchived = ref(false);
  const timeFilter = ref<'all' | 'today' | 'week' | 'month'>('all');

  const availableTags = computed(() =>
    Array.from(new Set((noteStore.sortedNotes as Note[]).flatMap((note) => note.tags || []))).slice(0, 8),
  );

  const visibleNotes = computed<Note[]>(() => {
    const keyword = searchQuery.value.trim().toLowerCase();
    const now = Date.now();

    return (noteStore.sortedNotes as Note[])
      .filter((note) => includeArchived.value || !note.is_archived)
      .filter((note) => {
        if (timeFilter.value === 'all') return true;
        const createdAt = new Date(note.created_at).getTime();
        if (!Number.isFinite(createdAt)) return false;
        const days = (now - createdAt) / (24 * 60 * 60 * 1000);
        if (timeFilter.value === 'today') return days <= 1;
        if (timeFilter.value === 'week') return days <= 7;
        if (timeFilter.value === 'month') return days <= 30;
        return true;
      })
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
    availableTags,
    visibleNotes,
    refresh,
    toggleTag,
  };
}
