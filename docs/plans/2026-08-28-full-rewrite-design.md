# 素笺 Sujian 完全重构 · 设计文档

> 日期：2026-08-28 ｜ 范围：前后端整体重构 + UI/UX 全新设计 ｜ 验证：一次性重写后整体构建验证

---

## 1. 产品定位与设计理念

**素笺** —— 一枚安静的「时间的信笺」。

把每一次记录当作写一封信，投入时间的长河。产品体验围绕三个关键词展开：

1. **纸感（Paper）**：界面像一张有质感的纸 —— 暖调的纸白、细腻的层次、柔和的投影，而不是冷冰冰的纯白卡片。
2. **墨韵（Ink）**：文字如墨，克制而清晰；主题色是"墨韵"化的彩色 —— 低饱和、有灰度、经得起长读。
3. **静默（Quiet）**：不打扰。留白充足、动效克制、层级清楚，让写作者只面对内容。

---

## 2. 设计语言：Paper & Ink

### 2.1 色彩系统（Design Tokens）

所有颜色以 CSS 变量定义于 `styles/tokens.css`，主题切换只替换变量值，组件一律引用变量、禁止裸色值。

**基础纸墨（中性色，随明暗主题切换）**

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--paper-0` | `#FBFAF7` | `#171614` | 页面底色 |
| `--paper-1` | `#F4F1EA` | `#1E1C19` | 卡片/栏面底色 |
| `--paper-2` | `#ECE8DF` | `#26231F` | 悬浮/按压面 |
| `--ink-900` | `#2A2722` | `#EDEAE3` | 主文字 |
| `--ink-700` | `#57534A` | `#B5B0A6` | 次级文字 |
| `--ink-500` | `#8A857B` | `#837E74` | 弱化文字/图标 |
| `--line` | `#E4DFD4` | `#33302A` | 边框/分隔线 |

**主题色（六套中式经典墨色，命名中性、不含面额元素）**

| 主题 key | 名称 | Light 主色 | Dark 主色 | 气质 |
|---|---|---|---|---|
| `olive` | 橄榄绿 | `#7A8B5E` | `#A9BE85` | 清雅 · 安定 |
| `violet` | 紫韵 | `#8B6FA8` | `#B49BD0` | 神秘 · 祥瑞 |
| `navy` | 藏蓝 | `#40597A` | `#7E9CC0` | 沉静 · 理性 |
| `amber` | 棕黄 | `#A8814F` | `#CB9F6A` | 温暖 · 踏实 |
| `emerald` | 翠绿 | `#3E8A68` | `#6FBC96` | 生机 · 从容 |
| `crimson` | 中国红 | `#A84B43` | `#D47E72` | 热烈 · 庄重 |

每个主题色派生：`--accent`（主色）、`--accent-strong`（按压/文字强调）、`--accent-soft`（淡色底）、`--accent-ring`（焦点环）。
历史主题 key 读取时自动迁移（purple→violet、blue→navy、green→olive、teal→emerald、brown→amber、red→crimson；人民币面额版 cny-x 亦平滑迁移），默认主题为中国红。

**状态色**：成功 `#4F8A5B`、警告 `#B98A2F`、危险 `#C05B54`（dark 各加亮一档）。

### 2.2 字体

- 中文：`-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`
- 西文/数字：`"Plus Jakarta Sans"`（保留现有依赖），数字启用 `font-variant-numeric: tabular-nums`
- 编辑区等宽（代码/输入）：`"SF Mono", "JetBrains Mono", "Cascadia Code", Consolas, monospace`

### 2.3 间距 / 圆角 / 阴影 / 动效

| Token | 值 | 说明 |
|---|---|---|
| `--radius-sm/md/lg/xl/full` | `8/12/16/24/9999 px` | 卡片 16、按钮 12、chip 全圆 |
| `--shadow-1/2/3` | 柔和高斯阴影（低透明度多层） | 不用纯黑投影 |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | 标准退场缓动 |
| `--dur-fast/med/slow` | `120/180/260 ms` | 动效时长 |
| 页面过渡 | 淡入 + 上移 6px（纸感翻页） | 150ms |

### 2.4 版式原则

- 页面级内容居中列宽：`min(720px, 100% - 48px)`（书写/阅读）
- 列表卡片：圆角 16、纸色 1、1px 边框线、hover 上浮 1px
- 三栏（侧栏 248px / 内容流弹性 / 无第三栏），侧栏可折叠为 64px 图标栏
- 无障碍：所有图标按钮带 aria-label；焦点环用 `--accent-ring`；对比度 ≥ WCAG AA

---

## 3. 信息架构与页面结构

```
素笺
├─ 首页 HomeView（时间流）
│   ├─ AppHeader：Logo + 全局搜索 + 新建(小记/文章) + 设置 + 快捷键
│   ├─ AppSidebar：时间筛选(全部/今天/本周/本月) · 标签筛选 · 归档入口 · 统计 · 折叠
│   └─ 主区
│       ├─ FilterBar（激活的筛选 chips + 视图切换 时间轴/网格 + 排序）
│       ├─ NoteTimeline / NoteGrid（按日期分组；时间轴为「信笺」纵向排列）
│       ├─ EmptyState（空态/无结果/归档空）
│       └─ 无限滚动加载
├─ 编辑器 EditorView（书写页，沉浸居中纸面）
│   ├─ EditorHeader：返回 · 类型切换(小记/文章) · 保存状态 · 保存/取消
│   ├─ EditorCanvas：
│   │   ├─ EditorTitle（自动生长标题）
│   │   ├─ TagEditor（chips + 联想）
│   │   ├─ EditorToolbar（加粗/斜体/标题/列表/引用/代码/链接/图片/表格/分割线/撤销重做/预览切换/目录）
│   │   ├─ EditorTextarea（Tab 缩进、自动保存、草稿恢复）
│   │   └─ MarkdownViewer（marked + highlight.js，编辑/预览/分屏）
│   └─ EditorStatusBar：字数 · 阅读时间 · 标签数 · 保存状态
├─ 搜索面板 SearchPalette（⌘K）：FTS 搜索 + 历史 + 高亮摘要
├─ 设置抽屉 SettingsDrawer
│   ├─ 外观：主题(亮/暗/系统) · 墨色(6 主题色) · 字号 · 毛玻璃 · 动画
│   ├─ 偏好：时间格式(12/24) · 语言(中/英/日/韩) · 快捷键速览
│   ├─ 数据：导出 JSON · 导入 · 清空全部
│   └─ 关于
└─ 全局：Toast（含撤销）· ConfirmDialog（Promise 化）
```

**路由（保持兼容）**：`/`、`/notes/new`、`/notes/new/article`、`/notes/:id/edit`。移除全部 `/demo/*` 演示路由。

**快捷键（保持）**：`⌘K` 搜索 · `N` 新建小记 · `⇧N` 新建文章 · `G` 视图切换 · `F` 侧栏折叠 · `?` 快捷键 · `⌘,` 设置 · `Esc` 关闭。

---

## 4. 后端重构策略（API 兼容）

**原则：保持 Wails 方法签名与数据 schema 完全兼容**，避免用户数据（`~/.sujian/sujian.db`）受影响、避免重新生成 bindings。重构聚焦代码质量：

1. **错误体系**：全服务统一 `models.AppError`（validation / not_found / conflict / storage），替换裸 `fmt.Errorf`；handler 层保持签名不变。
2. **SQL 构造**：`GetAll/GetFiltered` 的字符串拼接改为显式条件片（`conds []string` + `args []any`），消除 FTS/LIKE 分支的重复代码。
3. **事务与一致性**：`ResetAllData`、批量操作使用事务；`SaveDraft` 增加 payload 大小校验。
4. **分页语义**：统一 `limit<=0 → 默认 50`、`limit` 上限 200。
5. **保留能力清单**：Create/GetByID/GetAll/GetFiltered/Update/UpdateWithVersion/Delete/Restore/BatchRestore/PurgeDeleted/BatchDelete/Archive/BatchArchive/Search/SearchWithHighlight/GetStats/GetAllTags/GetTagsWithCount/IsFTSEnabled/SetSetting/GetSetting/SaveDraft/GetDraft/DeleteDraft/ResetAllData。

---

## 5. 前端重构策略（完全重写）

### 5.1 目录结构（Feature 化）

```
frontend/src/
├─ main.ts / App.vue / router/
├─ styles/
│   ├─ tokens.css      # 设计令牌（色板/圆角/阴影/动效）
│   ├─ base.css        # reset、排版、滚动条、markdown 排版
│   └─ themes.css      # 亮/暗 × 6 墨色的变量映射
├─ i18n/               # zh/en/ja/ko（文案精简统一）
├─ types/              # Note/NoteStats/SearchResult/TagInfo 等
├─ services/           # Wails bindings 薄封装 + 类型映射
│   └─ notes.ts
├─ stores/
│   ├─ notes.ts        # 列表/分页/筛选/排序/CRUD（重写）
│   ├─ ui.ts           # 视图模式/侧栏/弹层/搜索面板状态
│   └─ settings.ts     # 本地设置（localStorage 持久化 + 后端 settings）
├─ composables/
│   ├─ useKeyboardShortcuts.ts
│   ├─ useTagColors.ts / useDateFormat.ts / useSearchHistory.ts
│   └─ useMarkdown.ts  # marked + highlight.js 渲染封装
├─ components/
│   ├─ ui/             # BaseButton/IconButton/Modal/Toast/ConfirmDialog/EmptyState/Skeleton/TagChip/Dropdown/Segmented
│   ├─ layout/         # AppHeader/AppSidebar
│   ├─ notes/          # NoteCard/NoteTimeline/NoteGrid/FilterBar/NoteCardActions
│   ├─ search/         # SearchPalette
│   └─ editor/         # EditorHeader/EditorTitle/EditorToolbar/EditorTextarea/MarkdownViewer/EditorStatusBar/TagEditor
└─ views/              # HomeView / EditorView
```

### 5.2 巨型组件拆分目标

| 旧组件 | 行数 | 拆分为 |
|---|---|---|
| `MarkdownEditor.vue` | 3398 | Toolbar / Textarea / MarkdownViewer / StatusBar / TagEditor |
| `SettingsPanel.vue` | 3138 | 4 个 Section 组件 + settingsStore |
| `NoteEditor.vue` | 1045 | EditorHeader / EditorCanvas / 上述子件 |
| `TimelineView + NoteCard` | 740 | NoteTimeline / NoteCard / NoteGrid / FilterBar |

编辑器从「可拖拽自定义工具栏」回归克制：**固定分组工具栏**（样式/插入/视图/更多），去掉拖拽排序与分组折叠（过度工程），保留预览切换、目录、对齐。

### 5.3 状态管理

- `stores/notes.ts`：列表 + 分页游标 + 当前筛选（时间/标签/搜索/归档）+ 排序 + 统计 + 标签计数；所有筛选统一走后端 `GetFiltered`。
- `stores/ui.ts`：视图模式/侧栏/搜索/设置弹层开关（持久化到 localStorage）。
- `stores/settings.ts`：主题/墨色/字号/毛玻璃/动画/时间格式/语言（持久化 localStorage + 可选后端）。

### 5.4 主题系统

`<html>` 上设置 `data-theme="light|dark"` 与 `data-accent="purple|blue|..."`，themes.css 按组合输出全部变量。主题切换零重载、无闪烁（启动时同步读取 localStorage）。

---

## 6. 兼容与迁移

| 项 | 策略 |
|---|---|
| 数据库 | 完全不动（schema 兼容），用户数据零迁移 |
| Wails bindings | 后端签名不变 → bindings 原样复用 |
| 路由 | 4 条正式路由不变，删除 demo 路由 |
| 依赖 | 保留现有 package.json 依赖（Vue3/TS/Vite/Tailwind 不再引入新重型依赖，样式全部走自定义 tokens，可移除 Tailwind 依赖） |
| 旧文件 | 删除 demo/、Editor.vue.bak 等历史残留 |

---

## 7. 验收标准

1. `task dev` / 前端 `npm run build`（vue-tsc + vite）零错误
2. `go vet ./...`、`go test ./backend/...`、`go build` 通过
3. 全部既有功能点可用（CRUD/筛选/搜索/标签/归档/回收站/设置/导入导出/草稿/统计/快捷键/多语言）
4. 新视觉落地：纸墨质感、6 墨色主题、亮暗模式、动效克制的统一设计语言
5. 无 500+ 行巨型组件（除样式常量），目录符合 5.1 结构
