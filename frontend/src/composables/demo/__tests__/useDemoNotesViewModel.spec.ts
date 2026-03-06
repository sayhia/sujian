import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useDemoNotesViewModel } from '../useDemoNotesViewModel';

describe('useDemoNotesViewModel', () => {
  it('normalizes filtering/search state for demo pages', async () => {
    const store = {
      sortedNotes: [
        { id: 1, title: 'Alpha', content: 'First note', tags: ['work'], is_archived: false },
        { id: 2, title: 'Beta', content: 'Second note', tags: ['life'], is_archived: true },
      ],
      loadFilteredNotes: vi.fn().mockResolvedValue(undefined),
    } as any;

    const vm = useDemoNotesViewModel(store);
    vm.searchQuery.value = 'alp';
    vm.selectedTags.value = ['work'];
    vm.includeArchived.value = false;

    await nextTick();

    expect(vm.visibleNotes.value).toHaveLength(1);
    expect(vm.visibleNotes.value[0].id).toBe(1);

    await vm.refresh();
    expect(store.loadFilteredNotes).toHaveBeenCalledWith({
      filter: 'all',
      tags: ['work'],
      search: 'alp',
      archived: false,
    });
  });
});
