export type NoteType = 'quick' | 'article';

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  type: NoteType;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_deleted: boolean;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags: string[];
  type?: NoteType;
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

/* ---------- UI 偏好 ---------- */

export type Theme = 'light' | 'dark' | 'system';

/** 主题墨色：六套中式经典配色 */
export type AccentKey = 'olive' | 'violet' | 'navy' | 'amber' | 'emerald' | 'crimson';
export type FontSize = 'small' | 'medium' | 'large';
export type EditorWidth = 'narrow' | 'medium' | 'wide';
export type TimeFormat = '24h' | '12h';
export type Language = 'zh' | 'en' | 'ja' | 'ko';
export type ViewMode = 'timeline' | 'grid';
export type TimeFilter = 'all' | 'today' | 'week' | 'month';
export type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

export interface AppSettings {
  theme: Theme;
  accent: AccentKey;
  fontSize: FontSize;
  editorWidth: EditorWidth;
  animationsEnabled: boolean;
  glassIntensity: number; // 0-100
  timeFormat: TimeFormat;
  language: Language;
}

/** 主题元数据（i18n key 见 settings.accents） */
export interface AccentTheme {
  key: AccentKey;
  nameKey: string; // 主题名（橄榄绿…中国红）
  descKey: string; // 气质描述
  color: string; // light 主色（选择器色样）
  darkColor: string; // dark 主色
}

export const accentThemes: AccentTheme[] = [
  { key: 'olive', nameKey: 'settings.accents.olive', descKey: 'settings.accents.descOlive', color: '#7a8b5e', darkColor: '#a9be85' },
  { key: 'violet', nameKey: 'settings.accents.violet', descKey: 'settings.accents.descViolet', color: '#8b6fa8', darkColor: '#b49bd0' },
  { key: 'navy', nameKey: 'settings.accents.navy', descKey: 'settings.accents.descNavy', color: '#40597a', darkColor: '#7e9cc0' },
  { key: 'amber', nameKey: 'settings.accents.amber', descKey: 'settings.accents.descAmber', color: '#a8814f', darkColor: '#cb9f6a' },
  { key: 'emerald', nameKey: 'settings.accents.emerald', descKey: 'settings.accents.descEmerald', color: '#3e8a68', darkColor: '#6fbc96' },
  { key: 'crimson', nameKey: 'settings.accents.crimson', descKey: 'settings.accents.descCrimson', color: '#a84b43', darkColor: '#d47e72' },
];

/** 历史主题 key → 新主题 key 迁移映射（含最初的人民币面额版） */
export const legacyAccentMap: Record<string, AccentKey> = {
  purple: 'violet',
  blue: 'navy',
  green: 'olive',
  teal: 'emerald',
  brown: 'amber',
  red: 'crimson',
  'cny-1': 'olive',
  'cny-5': 'violet',
  'cny-10': 'navy',
  'cny-20': 'amber',
  'cny-50': 'emerald',
  'cny-100': 'crimson',
};

export const DEFAULT_ACCENT: AccentKey = 'crimson';
