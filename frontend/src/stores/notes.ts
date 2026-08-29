import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notesApi } from '../services/notes';
import type { Note, NoteStats, TagInfo, CreateNoteRequest, SortOption } from '../types';

const PAGE_SIZE = 20;

export interface ListFilters {
  filter: 'all' | 'today' | 'week' | 'month';
  tags: string[];
  search: string;
  archived: boolean;
}

function timeRangeOf(filter: ListFilters['filter']): { start: string | null; end: string | null } {
  const now = new Date();
  switch (filter) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: start.toISOString(), end: null };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start: start.toISOString(), end: null };
    }
    case 'month': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start: start.toISOString(), end: null };
    }
    default:
      return { start: null, end: null };
  }
}

/** 笔记领域状态：列表 + 分页 + 筛选 + CRUD + 统计 */
export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);
  const error = ref<string | null>(null);

  const stats = ref<NoteStats | null>(null);
  const tagsWithCount = ref<TagInfo[]>([]);
  const ftsEnabled = ref(false);

  const sortOption = ref<SortOption>('date-desc');

  // 当前生效的查询（供 loadMore 复用）
  const filters = ref<ListFilters>({ filter: 'all', tags: [], search: '', archived: false });
  const offset = ref(0);

  const sortedNotes = computed(() => {
    const sorted = [...notes.value];
    switch (sortOption.value) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
        break;
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  });

  async function checkFTS() {
    try {
      ftsEnabled.value = await notesApi.ftsEnabled();
    } catch {
      ftsEnabled.value = false;
    }
  }

  async function loadStats() {
    try {
      stats.value = await notesApi.stats();
    } catch {
      stats.value = null;
    }
  }

  async function loadTags() {
    try {
      tagsWithCount.value = (await notesApi.tagsWithCount()) || [];
    } catch {
      tagsWithCount.value = [];
    }
  }

  /** 加载首屏列表（重置分页） */
  async function loadList(f: Partial<ListFilters> = {}) {
    filters.value = { ...filters.value, ...f };
    loading.value = true;
    error.value = null;
    offset.value = 0;
    hasMore.value = true;
    try {
      const { start, end } = timeRangeOf(filters.value.filter);
      const items = await notesApi.getFiltered({
        limit: PAGE_SIZE,
        offset: 0,
        tags: filters.value.tags,
        search: filters.value.search,
        archived: filters.value.archived,
        startTime: start,
        endTime: end,
      });
      notes.value = items;
      offset.value = items.length;
      hasMore.value = items.length === PAGE_SIZE;
    } catch (e) {
      console.error('加载笔记失败:', e);
      error.value = 'loadFailed';
      notes.value = [];
      hasMore.value = false;
    } finally {
      loading.value = false;
    }
  }

  /** 加载下一页 */
  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    try {
      const { start, end } = timeRangeOf(filters.value.filter);
      const items = await notesApi.getFiltered({
        limit: PAGE_SIZE,
        offset: offset.value,
        tags: filters.value.tags,
        search: filters.value.search,
        archived: filters.value.archived,
        startTime: start,
        endTime: end,
      });
      if (items.length > 0) {
        notes.value = [...notes.value, ...items];
        offset.value += items.length;
      }
      if (items.length < PAGE_SIZE) hasMore.value = false;
    } catch (e) {
      console.error('加载更多失败:', e);
      hasMore.value = false;
    } finally {
      loadingMore.value = false;
    }
  }

  async function createNote(req: CreateNoteRequest): Promise<Note | null> {
    const note = await notesApi.create(req);
    if (note) notes.value.unshift(note);
    refreshMeta();
    return note;
  }

  async function updateNote(id: number, patch: { title?: string; content?: string; tags?: string[] }): Promise<Note | null> {
    const updated = await notesApi.update(id, patch);
    if (updated) {
      const idx = notes.value.findIndex((n) => n.id === id);
      if (idx !== -1) notes.value[idx] = updated;
      else notes.value.unshift(updated);
    }
    return updated;
  }

  async function deleteNote(id: number): Promise<void> {
    await notesApi.remove(id);
    notes.value = notes.value.filter((n) => n.id !== id);
    refreshMeta();
  }

  /** 软删除后撤销：恢复并插回列表 */
  async function restoreNote(id: number): Promise<void> {
    await notesApi.restore(id);
    const restored = await notesApi.get(id);
    if (restored && !notes.value.some((n) => n.id === id)) {
      notes.value = [restored, ...notes.value];
    }
    refreshMeta();
  }

  async function archiveNote(id: number, archived = true): Promise<void> {
    await notesApi.archive(id, archived);
    if (archived) {
      notes.value = notes.value.filter((n) => n.id !== id);
    } else {
      const note = await notesApi.get(id);
      if (note && !notes.value.some((n) => n.id === id)) notes.value = [note, ...notes.value];
    }
    refreshMeta();
  }

  async function getNote(id: number): Promise<Note | null> {
    return notesApi.get(id);
  }

  async function searchNotes(query: string, limit = 8) {
    return notesApi.searchWithHighlight(query, limit);
  }

  async function batchDelete(ids: number[]): Promise<number> {
    const count = await notesApi.batchDelete(ids);
    notes.value = notes.value.filter((n) => !ids.includes(n.id));
    refreshMeta();
    return count;
  }

  function refreshMeta() {
    loadStats();
    loadTags();
  }

  function setSortOption(opt: SortOption) {
    sortOption.value = opt;
  }

  return {
    notes,
    sortedNotes,
    loading,
    loadingMore,
    hasMore,
    error,
    stats,
    tagsWithCount,
    ftsEnabled,
    filters,
    sortOption,
    checkFTS,
    loadStats,
    loadTags,
    loadList,
    loadMore,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    archiveNote,
    getNote,
    searchNotes,
    batchDelete,
    refreshMeta,
    setSortOption,
  };
});
