export type NoteType = 'quick' | 'article';

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  type: NoteType; // quick or article
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_deleted: boolean;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags: string[];
  type?: NoteType; // quick or article, defaults to 'quick'
}

export interface UpdateNoteRequest {
  id: number;
  title?: string;
  content?: string;
  tags?: string[];
}

export interface NoteStats {
  total_notes: number;
  active_notes: number;
  archived_notes: number;
  weekly_count: number;
  monthly_count: number;
  all_tags: string[];
}

export interface SearchResult {
  notes: Note[];
  total: number;
  has_more: boolean;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface GetNotesRequest {
  limit: number;
  offset: number;
  tags?: string[];
  search?: string;
  archived?: boolean;
  start_time?: string;
  end_time?: string;
}

export type Maybe<T> = T | null | undefined;

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
