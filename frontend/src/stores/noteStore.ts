import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Note, CreateNoteRequest, NoteStats, SearchResult, TagInfo } from '../types';
import * as NoteHandler from '../../bindings/panda-time-note/handlers/notehandler';

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([]);
  const currentNote = ref<Note | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const archivedView = ref(false);
  const stats = ref<NoteStats | null>(null);
  const ftsEnabled = ref(false);
  const currentFilter = ref<'all' | 'today' | 'week' | 'month'>('all');
  const tagsWithCount = ref<TagInfo[]>([]);
  const sortOption = ref<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'tags-asc' | 'tags-desc'>('date-desc');

  // 分页相关状态（单次加载数量尽量小，降低渲染压力）
  const pageSize = 20;
  const offset = ref(0);
  const hasMore = ref(true);
  const isLoadingMore = ref(false);
  const lastQueryMode = ref<'all' | 'filtered'>('all');
  const lastFilterState = ref<{
    filter: 'all' | 'today' | 'week' | 'month';
    tags: string[];
    search: string;
    archived: boolean;
    startTime: string | null;
    endTime: string | null;
  } | null>(null);

  const archivedNotes = computed(() => notes.value.filter(n => n.is_archived));
  const activeNotes = computed(() => notes.value.filter(n => !n.is_archived));
  
  // 排序后的笔记
  const sortedNotes = computed(() => {
    const sorted = [...notes.value];
    
    switch (sortOption.value) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
        break;
      case 'tags-asc':
        sorted.sort((a, b) => (a.tags?.length || 0) - (b.tags?.length || 0));
        break;
      case 'tags-desc':
        sorted.sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0));
        break;
    }
    
    return sorted;
  });
  
  // Track if data has been loaded at least once
  const hasLoadedOnce = ref(false);

  function mapBackendNote(n: any): Note {
    return {
      id: n.id,
      title: n.title,
      content: n.content,
      tags: n.tags || [],
      type: (n.type as any) || 'quick',
      created_at: typeof n.created_at === 'string' ? n.created_at : n.created_at?.toISOString() || new Date().toISOString(),
      updated_at: typeof n.updated_at === 'string' ? n.updated_at : n.updated_at?.toISOString() || new Date().toISOString(),
      is_archived: n.is_archived || false,
      is_deleted: n.is_deleted || false,
    };
  }

  // Check if FTS5 is enabled
  async function checkFTSEnabled() {
    try {
      ftsEnabled.value = await NoteHandler.IsFTSEnabled();
      console.log('FTS5 enabled:', ftsEnabled.value);
    } catch (e) {
      console.error('Failed to check FTS status:', e);
      ftsEnabled.value = false;
    }
  }

  // Load notes with optional archived filter
  async function loadNotes(archived = false) {
    loading.value = true;
    error.value = null;
    archivedView.value = archived;
    // 重置分页
    offset.value = 0;
    hasMore.value = true;
    lastQueryMode.value = 'all';
    lastFilterState.value = {
      filter: 'all',
      tags: [],
      search: '',
      archived,
      startTime: null,
      endTime: null,
    };
    try {
      const result = await NoteHandler.GetAll(pageSize, offset.value, [], archived);
      const items = (result || [])
        .filter((n): n is NonNullable<typeof n> => n !== null)
        .map(mapBackendNote);
      notes.value = items;
      offset.value = notes.value.length;
      hasMore.value = items.length === pageSize;
    } catch (e) {
      error.value = '加载笔记失败';
      console.error('加载笔记失败:', e);
      notes.value = [];
      hasMore.value = false;
    } finally {
      loading.value = false;
      hasLoadedOnce.value = true;
    }
  }

  // Load notes with advanced filters (time range, tags, search)
  async function loadFilteredNotes(options: {
    filter?: 'all' | 'today' | 'week' | 'month';
    tags?: string[];
    search?: string;
    archived?: boolean;
  } = {}) {
    loading.value = true;
    error.value = null;
    
    const { filter = 'all', tags = [], search = '', archived = false } = options;
    currentFilter.value = filter;
    archivedView.value = archived;

    // Calculate time range based on filter
    let startTime: string | null = null;
    let endTime: string | null = null;
    const now = new Date();

    if (filter === 'today') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (filter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startTime = weekAgo.toISOString();
    } else if (filter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      startTime = monthAgo.toISOString();
    }

    // 重置分页
    offset.value = 0;
    hasMore.value = true;
    lastQueryMode.value = 'filtered';
    lastFilterState.value = {
      filter,
      tags,
      search,
      archived,
      startTime,
      endTime,
    };

    try {
      const result = await NoteHandler.GetFiltered(
        pageSize, 
        offset.value, 
        tags, 
        search, 
        archived, 
        startTime, 
        endTime
      );
      const items = (result || [])
        .filter((n): n is NonNullable<typeof n> => n !== null)
        .map(mapBackendNote);
      notes.value = items;
      offset.value = notes.value.length;
      hasMore.value = items.length === pageSize;
    } catch (e) {
      error.value = '加载笔记失败';
      console.error('加载笔记失败:', e);
      notes.value = [];
      hasMore.value = false;
    } finally {
      loading.value = false;
      hasLoadedOnce.value = true;
    }
  }

  // Load more notes for current query (pagination)
  async function loadMoreNotes() {
    if (loading.value || isLoadingMore.value || !hasMore.value) return;
    if (!lastFilterState.value) return;

    isLoadingMore.value = true;
    error.value = null;

    try {
      const currentOffset = offset.value;
      // 使用后端绑定类型，随后统一通过 mapBackendNote 转成前端 Note
      let result: any[] | null = null;

      if (lastQueryMode.value === 'all') {
        result = await NoteHandler.GetAll(pageSize, currentOffset, [], lastFilterState.value.archived);
      } else {
        const { tags, search, archived, startTime, endTime } = lastFilterState.value;
        result = await NoteHandler.GetFiltered(
          pageSize,
          currentOffset,
          tags,
          search,
          archived,
          startTime,
          endTime
        );
      }

      const items = (result || [])
        .filter((n): n is NonNullable<typeof n> => n !== null)
        .map(mapBackendNote);

      if (items.length > 0) {
        notes.value = [...notes.value, ...items];
        offset.value = notes.value.length;
      }

      if (items.length < pageSize) {
        hasMore.value = false;
      }
    } catch (e) {
      error.value = '加载更多笔记失败';
      console.error('加载更多笔记失败:', e);
      hasMore.value = false;
    } finally {
      isLoadingMore.value = false;
    }
  }

  // Create a new note
  async function createNote(request: CreateNoteRequest) {
    loading.value = true;
    error.value = null;
    try {
      const noteType = request.type || 'quick';
      const result = await NoteHandler.Create(request.title, request.content, request.tags || [], noteType);
      if (result) {
        // Convert backend Note to frontend Note
        const newNote: Note = {
          id: result.id,
          title: result.title,
          content: result.content,
          tags: result.tags || [],
          type: (result.type as any) || 'quick',
          created_at: typeof result.created_at === 'string' ? result.created_at : result.created_at?.toISOString() || new Date().toISOString(),
          updated_at: typeof result.updated_at === 'string' ? result.updated_at : result.updated_at?.toISOString() || new Date().toISOString(),
          is_archived: result.is_archived || false,
          is_deleted: result.is_deleted || false,
        };
        notes.value.unshift(newNote);
        return newNote;
      }
      throw new Error('创建笔记失败');
    } catch (e) {
      error.value = '创建笔记失败';
      console.error('创建笔记失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Update an existing note
  async function updateNote(id: number, updates: Partial<Note>) {
    loading.value = true;
    error.value = null;
    try {
      const title = updates.title ?? null;
      const content = updates.content ?? null;
      const tags = updates.tags ?? null;
      
      const result = await NoteHandler.Update(id, title, content, tags);
      if (result) {
        const updatedNote = result as Note;
        const index = notes.value.findIndex(n => n.id === id);
        if (index !== -1) {
          notes.value[index] = updatedNote;
        }
        return updatedNote;
      }
      throw new Error('更新笔记失败');
    } catch (e) {
      error.value = '更新笔记失败';
      console.error('更新笔记失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Delete a note
  async function deleteNote(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await NoteHandler.Delete(id);
      notes.value = notes.value.filter(n => n.id !== id);
    } catch (e) {
      error.value = '删除笔记失败';
      console.error('删除笔记失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Archive/unarchive a note
  async function archiveNote(id: number, archived = true) {
    loading.value = true;
    error.value = null;
    try {
      await NoteHandler.Archive(id, archived);
      // Remove the note from current list since it changed archive status
      // It will appear in the other view (archived or active)
      notes.value = notes.value.filter(n => n.id !== id);
    } catch (e) {
      error.value = '归档笔记失败';
      console.error('归档笔记失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Get a single note by ID
  async function getNote(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const result = await NoteHandler.GetByID(id);
      if (result) {
        return mapBackendNote(result);
      }
      return null;
    } catch (e) {
      error.value = '获取笔记失败';
      console.error('获取笔记失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Search notes using FTS5
  async function searchNotes(query: string, limit = 10): Promise<SearchResult | null> {
    if (!query || query.length < 2) return null;
    
    try {
      const result = await NoteHandler.Search(query, limit);
      return result as SearchResult;
    } catch (e) {
      console.error('搜索笔记失败:', e);
      return null;
    }
  }

  // Search notes with highlighted results (FTS5)
  async function searchNotesWithHighlight(query: string, limit = 10): Promise<SearchResult | null> {
    if (!query || query.length < 2) return null;
    
    try {
      const result = await NoteHandler.SearchWithHighlight(query, limit);
      return result as SearchResult;
    } catch (e) {
      console.error('搜索笔记失败:', e);
      return null;
    }
  }

  // Get note statistics
  async function loadStats() {
    try {
      const result = await NoteHandler.GetStats();
      stats.value = result as NoteStats;
      return stats.value;
    } catch (e) {
      console.error('获取统计失败:', e);
      return null;
    }
  }

  // Get all tags
  async function getAllTags(): Promise<string[]> {
    try {
      const result = await NoteHandler.GetAllTags();
      return (result || []) as string[];
    } catch (e) {
      console.error('获取标签失败:', e);
      return [];
    }
  }

  // Get all tags with usage counts (sorted by frequency)
  async function loadTagsWithCount() {
    try {
      const result = await NoteHandler.GetTagsWithCount();
      tagsWithCount.value = (result || [])
        .filter((t): t is TagInfo => t !== null)
        .map(t => ({
          name: t.name || '',
          count: t.count || 0
        }));
      return tagsWithCount.value;
    } catch (e) {
      console.error('获取标签统计失败:', e);
      return [];
    }
  }

  // Batch delete notes
  async function batchDeleteNotes(ids: number[]): Promise<number> {
    loading.value = true;
    error.value = null;
    try {
      const count = await NoteHandler.BatchDelete(ids);
      notes.value = notes.value.filter(n => !ids.includes(n.id));
      return count;
    } catch (e) {
      error.value = '批量删除失败';
      console.error('批量删除失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Batch archive notes
  async function batchArchiveNotes(ids: number[], archived = true): Promise<number> {
    loading.value = true;
    error.value = null;
    try {
      const count = await NoteHandler.BatchArchive(ids, archived);
      ids.forEach(id => {
        const index = notes.value.findIndex(n => n.id === id);
        if (index !== -1) {
          notes.value[index].is_archived = archived;
        }
      });
      return count;
    } catch (e) {
      error.value = '批量归档失败';
      console.error('批量归档失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 设置排序选项
  function setSortOption(option: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'tags-asc' | 'tags-desc') {
    sortOption.value = option;
  }

  return {
    notes,
    currentNote,
    loading,
    error,
    hasMore,
    isLoadingMore,
    archivedView,
    stats,
    ftsEnabled,
    currentFilter,
    tagsWithCount,
    sortOption,
    sortedNotes,
    archivedNotes,
    activeNotes,
    hasLoadedOnce,
    checkFTSEnabled,
    loadNotes,
    loadFilteredNotes,
    loadMoreNotes,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    getNote,
    searchNotes,
    searchNotesWithHighlight,
    loadStats,
    getAllTags,
    loadTagsWithCount,
    batchDeleteNotes,
    batchArchiveNotes,
    setSortOption,
  };
});
