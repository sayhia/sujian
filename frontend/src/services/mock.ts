import type { Note, NoteStats, SearchResult, TagInfo, CreateNoteRequest } from '../types';

/**
 * 浏览器开发预览 Mock（仅非 Wails 环境生效）。
 * 桌面应用通过 @wailsio/runtime 调用 Go 后端，本模块不会被使用。
 */

export function isWailsEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return typeof w.go !== 'undefined' || typeof w.__wails__ !== 'undefined';
}

const now = Date.now();
const H = 3600_000;
const D = 24 * H;

function iso(msAgo: number): string {
  return new Date(now - msAgo).toISOString();
}

const seed: Note[] = [
  { id: 1, title: '晨光里的第一杯茶', content: '# 晨光里的第一杯茶\n\n窗外的光斜斜地落在桌上，茶叶在杯底缓缓舒展。\n\n> 慢一点，日子会自己发酵出香气。\n\n- 水：85℃\n- 时间：3 分钟\n- 心情：刚刚好', tags: ['生活', '随笔'], type: 'article', created_at: iso(1.2 * H), updated_at: iso(0.5 * H), is_archived: false, is_deleted: false },
  { id: 2, title: '灵感：素笺的时间线', content: '把每一条笔记想象成一封信，挂在一条贯穿的时间线上。封蜡节点、时间刻度、里程碑分组——这是「时间的信笺」。\n\n```ts\n// 时间的流逝\nconst today = new Date()\n```', tags: ['灵感', '产品'], type: 'quick', created_at: iso(3.2 * H), updated_at: iso(3.2 * H), is_archived: false, is_deleted: false },
  { id: 3, title: '本周书单', content: '- 《置身事内》兰小欢\n- 《也许你该找个人聊聊》\n- 《秋园》杨本芬\n\n周末读完第一本，记录一下。', tags: ['阅读'], type: 'quick', created_at: iso(7 * H), updated_at: iso(6 * H), is_archived: false, is_deleted: false },
  { id: 4, title: '给一年后的自己', content: '嗨，一年后的我：\n\n你还在坚持记录吗？这封信封存于今天。\n\n**想对你说的话：**\n\n1. 少一点焦虑，多一点行动\n2. 对重要的人再耐心一些\n3. 记得常回家看看', tags: ['时间胶囊'], type: 'article', created_at: iso(26 * H), updated_at: iso(26 * H), is_archived: false, is_deleted: false },
  { id: 5, title: '咖啡店偶遇', content: '靠窗的位置，阳光正好。邻桌在聊一场旅行，窗外的梧桐叶开始泛黄。\n\n秋天要来了。', tags: ['生活'], type: 'quick', created_at: iso(30 * H), updated_at: iso(30 * H), is_archived: false, is_deleted: false },
  { id: 6, title: '如何写好一篇博客', content: '## 开头最重要\n\n第一段决定读者是否留下。\n\n## 用故事说话\n\n数据让人理解，故事让人记住。\n\n## 结尾留钩子\n\n让读者想评论、想转发、想收藏。', tags: ['写作', '方法'], type: 'article', created_at: iso(52 * H), updated_at: iso(49 * H), is_archived: false, is_deleted: false },
  { id: 7, title: '月度复盘模板', content: '### 本月高光\n\n- \n\n### 本月遗憾\n\n- \n\n### 下月三件事\n\n1. \n2. \n3. ', tags: ['复盘', '模板'], type: 'quick', created_at: iso(3 * D + 5 * H), updated_at: iso(3 * D + 5 * H), is_archived: false, is_deleted: false },
  { id: 8, title: '深夜码字', content: '窗外很安静，只有键盘的声音。\n\n> 写作是让混乱的思绪，找到秩序的仪式。\n\n---\n\n继续。', tags: ['写作'], type: 'quick', created_at: iso(4 * D + 8 * H), updated_at: iso(4 * D + 8 * H), is_archived: false, is_deleted: false },
  { id: 9, title: '一篇旧文章：重构的意义', content: '# 重构的意义\n\n重构不是重写，是让代码回到它本该有的样子。\n\n```js\nfunction clean(code) {\n  return code.filter(meaningful)\n}\n```\n\n**要点：**\n\n1. 小步快跑\n2. 随时可构建\n3. 测试护航', tags: ['技术', '思考'], type: 'article', created_at: iso(6 * D + 2 * H), updated_at: iso(5 * D + 20 * H), is_archived: true, is_deleted: false },
  { id: 10, title: '食谱：葱油拌面', content: '1. 小葱切段，冷油下锅，小火熬至焦黄\n2. 生抽 2 勺 + 老抽 1 勺 + 糖 1 勺，调成酱汁\n3. 面条煮好过凉水，拌入葱油和酱汁\n4. 撒上芝麻，开吃', tags: ['美食'], type: 'quick', created_at: iso(9 * D + 4 * H), updated_at: iso(9 * D + 4 * H), is_archived: false, is_deleted: false },
  { id: 11, title: '旅行清单：江南', content: '- [ ] 苏州：平江路、拙政园\n- [ ] 杭州：西湖、灵隐寺\n- [ ] 乌镇：东栅、西栅夜景\n- [ ] 绍兴：鲁迅故里', tags: ['旅行', '计划'], type: 'quick', created_at: iso(14 * D + 6 * H), updated_at: iso(14 * D + 6 * H), is_archived: false, is_deleted: false },
  { id: 12, title: '读《百年孤独》有感', content: '魔幻现实主义的背后，是拉丁美洲百年孤独的命运。\n\n> 生命中所有的灿烂，终要寂寞偿还。\n\n马尔克斯用一个家族的兴衰，写尽了时间本身。', tags: ['阅读', '书评'], type: 'article', created_at: iso(40 * D), updated_at: iso(39 * D), is_archived: false, is_deleted: false },
  { id: 13, title: '三年前的自己', content: '翻到三年前的一条笔记：\n\n「希望 2023 年的自己，能更勇敢一点。」\n\n现在我想说：做到了，谢谢你当年的提醒。', tags: ['时间胶囊'], type: 'quick', created_at: iso(120 * D), updated_at: iso(120 * D), is_archived: false, is_deleted: false },
  { id: 14, title: '老照片里的夏天', content: '相册翻到 2018 年的夏天，海边的风、冰镇的西瓜、没有烦恼的笑。\n\n时间会走远，但照片替我们记得。', tags: ['生活', '回忆'], type: 'article', created_at: iso(300 * D), updated_at: iso(300 * D), is_archived: true, is_deleted: false },
];

let seq = 100;
const drafts = new Map<string, string>();

function delay(ms = 120) {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 160));
}

function clone(n: Note): Note {
  return { ...n, tags: [...n.tags] };
}

function matches(n: Note, f: { tags: string[]; search: string; archived: boolean; start: string | null; end: string | null }): boolean {
  if (n.is_deleted) return false;
  if (n.is_archived !== f.archived) return false;
  if (f.tags.length && !f.tags.every((tag) => n.tags.includes(tag))) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
  }
  if (f.start && new Date(n.created_at).getTime() < new Date(f.start).getTime()) return false;
  if (f.end && new Date(n.created_at).getTime() > new Date(f.end).getTime()) return false;
  return true;
}

export function createMockApi() {
  const all = [...seed];

  return {
    async create(req: CreateNoteRequest): Promise<Note | null> {
      await delay();
      const n: Note = {
        id: ++seq,
        title: req.title,
        content: req.content,
        tags: [...req.tags],
        type: req.type || 'quick',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,
        is_deleted: false,
      };
      all.unshift(n);
      return clone(n);
    },
    async get(id: number): Promise<Note | null> {
      await delay(60);
      const n = all.find((x) => x.id === id && !x.is_deleted);
      return n ? clone(n) : null;
    },
    async getAll(limit: number, offset: number, tags: string[], archived: boolean): Promise<Note[]> {
      await delay();
      return all
        .filter((n) => !n.is_deleted && n.is_archived === archived && (tags.length === 0 || tags.every((t) => n.tags.includes(t))))
        .slice(offset, offset + limit)
        .map(clone);
    },
    async getFiltered(p: { limit: number; offset: number; tags: string[]; search: string; archived: boolean; startTime: string | null; endTime: string | null }): Promise<Note[]> {
      await delay();
      return all
        .filter((n) => matches(n, { tags: p.tags, search: p.search, archived: p.archived, start: p.startTime, end: p.endTime }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(p.offset, p.offset + p.limit)
        .map(clone);
    },
    async update(id: number, patch: { title?: string; content?: string; tags?: string[] }): Promise<Note | null> {
      await delay();
      const n = all.find((x) => x.id === id);
      if (!n) return null;
      if (patch.title !== undefined) n.title = patch.title;
      if (patch.content !== undefined) n.content = patch.content;
      if (patch.tags !== undefined) n.tags = [...patch.tags];
      n.updated_at = new Date().toISOString();
      return clone(n);
    },
    async updateWithVersion(id: number, patch: { title?: string; content?: string; tags?: string[] }, _v: number): Promise<Note | null> {
      return this.update(id, patch);
    },
    async remove(id: number): Promise<void> {
      await delay(60);
      const n = all.find((x) => x.id === id);
      if (n) n.is_deleted = true;
    },
    async restore(id: number): Promise<void> {
      await delay(60);
      const n = all.find((x) => x.id === id);
      if (n) n.is_deleted = false;
    },
    async batchRestore(ids: number[]): Promise<number> {
      await delay();
      ids.forEach((id) => {
        const n = all.find((x) => x.id === id);
        if (n) n.is_deleted = false;
      });
      return ids.length;
    },
    async archive(id: number, archived: boolean): Promise<void> {
      await delay(60);
      const n = all.find((x) => x.id === id);
      if (n) n.is_archived = archived;
    },
    async batchArchive(ids: number[], archived: boolean): Promise<number> {
      await delay();
      ids.forEach((id) => {
        const n = all.find((x) => x.id === id);
        if (n) n.is_archived = archived;
      });
      return ids.length;
    },
    async batchDelete(ids: number[]): Promise<number> {
      await delay();
      return ids.filter((id) => {
        const i = all.findIndex((x) => x.id === id);
        if (i >= 0) {
          all.splice(i, 1);
          return true;
        }
        return false;
      }).length;
    },
    async search(query: string, limit: number): Promise<SearchResult | null> {
      await delay(200);
      const notes = all
        .filter((n) => !n.is_deleted && !n.is_archived && n.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);
      return { notes: notes.map(clone), total: notes.length, has_more: false };
    },
    async searchWithHighlight(query: string, limit: number): Promise<SearchResult | null> {
      await delay(200);
      const q = query.toLowerCase();
      const notes = all
        .filter((n) => !n.is_deleted && !n.is_archived && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)))
        .slice(0, limit)
        .map((n) => {
          const c = clone(n);
          c.title = c.title.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
          const idx = c.content.toLowerCase().indexOf(q);
          if (idx >= 0) {
            const start = Math.max(0, idx - 30);
            let snip = (start > 0 ? '…' : '') + c.content.slice(start, start + 90) + '…';
            snip = snip.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
            c.content = snip;
          }
          return c;
        });
      return { notes, total: notes.length, has_more: false };
    },
    async stats(): Promise<NoteStats | null> {
      await delay(60);
      const active = all.filter((n) => !n.is_deleted && !n.is_archived);
      const week = active.filter((n) => Date.now() - new Date(n.created_at).getTime() < 7 * D);
      const month = active.filter((n) => Date.now() - new Date(n.created_at).getTime() < 30 * D);
      const tagSet = new Set<string>();
      active.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
      return {
        total_notes: active.length + all.filter((n) => !n.is_deleted && n.is_archived).length,
        active_notes: active.length,
        archived_notes: all.filter((n) => !n.is_deleted && n.is_archived).length,
        weekly_count: week.length,
        monthly_count: month.length,
        all_tags: [...tagSet],
      };
    },
    async allTags(): Promise<string[]> {
      await delay(60);
      return [...new Set(all.filter((n) => !n.is_deleted).flatMap((n) => n.tags))];
    },
    async tagsWithCount(): Promise<TagInfo[]> {
      await delay(60);
      const map = new Map<string, number>();
      all.filter((n) => !n.is_deleted).forEach((n) => n.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
      return [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
    },
    async ftsEnabled(): Promise<boolean> {
      return true;
    },
    async setSetting(_k: string, _v: string): Promise<void> {
      await delay(30);
    },
    async getSetting(k: string): Promise<string> {
      await delay(30);
      return drafts.get(k) ?? '';
    },
    async saveDraft(noteId: number | null, payload: string): Promise<void> {
      await delay(30);
      drafts.set(noteId == null ? 'global' : `note:${noteId}`, payload);
    },
    async getDraft(noteId: number | null): Promise<string> {
      await delay(30);
      return drafts.get(noteId == null ? 'global' : `note:${noteId}`) ?? '';
    },
    async deleteDraft(noteId: number | null): Promise<void> {
      await delay(30);
      drafts.delete(noteId == null ? 'global' : `note:${noteId}`);
    },
    async resetAllData(): Promise<void> {
      await delay();
      all.length = 0;
    },
  };
}

export type MockApi = ReturnType<typeof createMockApi>;
