# Editorial 全功能设计（最终版）

日期：2026-03-08  
状态：Final Baseline  
适用版本：默认路由与唯一 UI 形态均为 Editorial

## 1. 目标与范围

本设计用于定义 Panda Time-Note 在当前阶段的完整前端功能形态，确保：

1. 默认使用 Editorial 体验（阅读 + 写作 + 设置）。
2. 保持既有数据行为（创建、更新、筛选、归档、分页）不变。
3. 删除旧布局后，形成单一、可维护、可验收的产品基线。

## 2. 信息架构

### 2.1 路由

1. `/`：Editorial Home（阅读首页）
2. `/notes/new`：Editorial Editor（新建快记）
3. `/notes/new/article`：Editorial Editor（新建文章）
4. `/notes/:id/edit`：Editorial Editor（编辑已有内容）
5. `/settings`：Editorial Settings（系统设置）
6. `/demo/editorial`、`/demo/editorial/editor`、`/demo/editorial/settings`：内部演示入口（同一视觉体系）

### 2.2 页面职责

1. Home：浏览与进入编辑（读为主）
2. Editor：创建/编辑与保存（写为主）
3. Settings：排版与阅读节奏配置（系统控制）

## 3. 核心用户流程

### 3.1 浏览与筛选（Home）

1. 用户进入 `/`，加载并展示可见笔记流。
2. 通过搜索词、标签、时间过滤控制可见集合。
3. 点击条目进入 `/notes/:id/edit`。

### 3.2 新建内容（Editor）

1. 从 `/notes/new` 进入：默认 `type=quick`。
2. 从 `/notes/new/article` 进入：默认 `type=article`。
3. 输入标题/正文后保存，创建成功返回首页。

### 3.3 编辑内容（Editor）

1. 从 `/notes/:id/edit` 进入，预填已有数据。
2. 修改并保存，调用更新逻辑。
3. 完成后返回首页并可在列表中看到更新结果。

### 3.4 系统配置（Settings）

1. 在 `/settings` 查看四个配置分区。
2. 当前阶段以结构化配置 UI 为主，行为扩展在后续迭代落地。

## 4. 页面功能设计

### 4.1 Editorial Home

结构分区：

1. `directory`：目录区，显示阅读入口与结构感。
2. `reading-stream`：正文流，展示内容主体。
3. `marginalia`：旁注区，显示补充信息。

功能要求：

1. 导航语义可访问（`aria-label`）。
2. 桌面三栏，移动端按 1-2-3 顺序折叠。
3. 中文优先排版（serif heading + 受控阅读宽度）。

### 4.2 Editorial Editor

功能要求：

1. 表单最小字段：`title`、`content`、`type`。
2. 保存状态可见（按钮禁用 + 保存中反馈）。
3. 创建/编辑共用同一状态模型，避免业务分叉。

行为要求：

1. 若存在 `initialNote.id`，进入编辑路径并调用 `updateNote`。
2. 否则调用 `createNote`。
3. 文章模式通过 `type=article` 进入。

### 4.3 Editorial Settings

结构分区：

1. `typography`：字体与层级
2. `material`：纸感与材质语义
3. `cadence`：阅读节奏
4. `writing`：写作行为

功能要求：

1. 分区可被测试定位（`data-zone`）。
2. 导航语义可访问。
3. 支持后续接入真实配置持久化。

## 5. 状态与数据设计

### 5.1 Store 约束（Pinia）

`noteStore` 作为唯一数据真源，负责：

1. `loadNotes/loadFilteredNotes/loadMoreNotes`
2. `createNote/updateNote/deleteNote/archiveNote`
3. 排序、标签统计、错误态与加载态

### 5.2 ViewModel 分层

1. `useDemoNotesViewModel`：面向 Home 的筛选/可见列表组合。
2. `useDemoEditorState`：面向 Editor 的最小保存状态组合。

设计原则：

1. 页面只做编排，不复制业务逻辑。
2. 组合式函数维持输入输出稳定，便于测试。

## 6. 异常与边界

1. 加载失败：展示 store 错误态，列表回退为空。
2. 保存失败：保留编辑内容，不清空输入。
3. 空内容：允许进入编辑器但应有占位提示。
4. 移动端：语义分区必须可访问，不因折叠丢失。

## 7. 可访问性与排版要求

1. 主导航带 `aria-label`。
2. 关键结构提供可测试语义钩子（`data-zone`）。
3. 中文正文行宽受控，行高保持阅读节奏。
4. 视觉对比避免过高刺激，保留纸墨风格。

## 8. 非功能要求

1. 代码可测试：路由、页面结构、编辑状态均有单测覆盖。
2. 构建可交付：`vue-tsc` 与 `vite build` 必须通过。
3. 架构可扩展：后续可接入设置持久化与更丰富编辑字段。

## 9. 验收矩阵

### 9.1 路由与页面

1. 默认路径均指向 Editorial 页面。
2. `/settings` 可访问并显示四个分区。

### 9.2 编辑行为

1. 新建快记调用 `createNote(type=quick)`。
2. 新建文章调用 `createNote(type=article)`。
3. 编辑调用 `updateNote(id, payload)`。

### 9.3 回归门禁

1. `cd frontend && npm test` 通过。
2. `cd frontend && npm run build` 通过。

## 10. 后续迭代建议（设计层）

1. 将 Settings 四分区接入真实配置存储与回放。
2. Editor 增加导语/副标题字段并统一保存模型。
3. Home 增加分组目录（今日/本周/专题）与统计摘要。
