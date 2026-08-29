import * as NoteHandler from '../../bindings/sujian/backend/handlers/notehandler';
import { isWailsEnv, createMockApi, type MockApi } from './mock';
import type { Note, NoteStats, SearchResult, TagInfo, CreateNoteRequest } from '../types';

/** 后端 Note -> 前端 Note（日期字符串归一化、字段兜底） */
export function mapBackendNote(n: any): Note {
  return {
    id: n.id,
    title: n.title ?? '',
    content: n.content ?? '',
    tags: n.tags || [],
    type: (n.type as Note['type']) || 'quick',
    created_at: normalizeDate(n.created_at),
    updated_at: normalizeDate(n.updated_at),
    is_archived: !!n.is_archived,
    is_deleted: !!n.is_deleted,
  };
}

function normalizeDate(v: any): string {
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return new Date().toISOString();
}

export const wailsApi = {
  create(req: CreateNoteRequest): Promise<Note | null> {
    return NoteHandler.Create(req.title, req.content, req.tags || [], req.type || 'quick').then((n) =>
      n ? mapBackendNote(n) : null,
    );
  },

  get(id: number): Promise<Note | null> {
    return NoteHandler.GetByID(id).then((n) => (n ? mapBackendNote(n) : null));
  },

  getAll(limit: number, offset: number, tags: string[], archived: boolean): Promise<Note[]> {
    return NoteHandler.GetAll(limit, offset, tags, archived).then((list) =>
      (list || []).filter((n): n is NonNullable<typeof n> => !!n).map(mapBackendNote),
    );
  },

  getFiltered(params: {
    limit: number;
    offset: number;
    tags: string[];
    search: string;
    archived: boolean;
    startTime: string | null;
    endTime: string | null;
  }): Promise<Note[]> {
    return NoteHandler.GetFiltered(
      params.limit,
      params.offset,
      params.tags,
      params.search,
      params.archived,
      params.startTime,
      params.endTime,
    ).then((list) => (list || []).filter((n): n is NonNullable<typeof n> => !!n).map(mapBackendNote));
  },

  update(id: number, patch: { title?: string; content?: string; tags?: string[] }): Promise<Note | null> {
    const title = patch.title !== undefined ? patch.title : null;
    const content = patch.content !== undefined ? patch.content : null;
    const tags = patch.tags !== undefined ? patch.tags : null;
    return NoteHandler.Update(id, title, content, tags).then((n) => (n ? mapBackendNote(n) : null));
  },

  updateWithVersion(
    id: number,
    patch: { title?: string; content?: string; tags?: string[] },
    expectedVersion: number,
  ): Promise<Note | null> {
    const title = patch.title !== undefined ? patch.title : null;
    const content = patch.content !== undefined ? patch.content : null;
    const tags = patch.tags !== undefined ? patch.tags : null;
    return NoteHandler.UpdateWithVersion(id, title, content, tags, expectedVersion).then((n) =>
      n ? mapBackendNote(n) : null,
    );
  },

  remove(id: number): Promise<void> {
    return NoteHandler.Delete(id);
  },

  restore(id: number): Promise<void> {
    return NoteHandler.Restore(id);
  },

  batchRestore(ids: number[]): Promise<number> {
    return NoteHandler.BatchRestore(ids);
  },

  archive(id: number, archived: boolean): Promise<void> {
    return NoteHandler.Archive(id, archived);
  },

  batchArchive(ids: number[], archived: boolean): Promise<number> {
    return NoteHandler.BatchArchive(ids, archived);
  },

  batchDelete(ids: number[]): Promise<number> {
    return NoteHandler.BatchDelete(ids);
  },

  search(query: string, limit: number): Promise<SearchResult | null> {
    return NoteHandler.Search(query, limit) as Promise<SearchResult | null>;
  },

  searchWithHighlight(query: string, limit: number): Promise<SearchResult | null> {
    return NoteHandler.SearchWithHighlight(query, limit) as Promise<SearchResult | null>;
  },

  stats(): Promise<NoteStats | null> {
    return NoteHandler.GetStats() as Promise<NoteStats | null>;
  },

  allTags(): Promise<string[]> {
    return NoteHandler.GetAllTags() as Promise<string[]>;
  },

  tagsWithCount(): Promise<TagInfo[]> {
    return NoteHandler.GetTagsWithCount() as Promise<TagInfo[]>;
  },

  ftsEnabled(): Promise<boolean> {
    return NoteHandler.IsFTSEnabled() as Promise<boolean>;
  },

  setSetting(key: string, value: string): Promise<void> {
    return NoteHandler.SetSetting(key, value);
  },

  getSetting(key: string): Promise<string> {
    return NoteHandler.GetSetting(key);
  },

  saveDraft(noteId: number | null, payload: string): Promise<void> {
    return NoteHandler.SaveDraft(noteId, payload);
  },

  getDraft(noteId: number | null): Promise<string> {
    return NoteHandler.GetDraft(noteId);
  },

  deleteDraft(noteId: number | null): Promise<void> {
    return NoteHandler.DeleteDraft(noteId);
  },

  resetAllData(): Promise<void> {
    return NoteHandler.ResetAllData();
  },
};

type NotesApi = typeof wailsApi;

/**
 * 浏览器开发预览：Wails 绑定不可用时使用内存 Mock（仅 dev + 非 Wails 环境）。
 * 桌面应用（Wails dev/prod）始终走 Go 后端。
 */
const mockApi: NotesApi | null =
  typeof window !== 'undefined' && !isWailsEnv() && import.meta.env.DEV
    ? (createMockApi() as unknown as NotesApi)
    : null;

export const notesApi: NotesApi = mockApi ?? wailsApi;
