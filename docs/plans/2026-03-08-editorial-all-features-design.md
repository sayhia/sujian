# Editorial 全量功能设计总稿

日期：2026-03-08  
状态：Design Complete  
范围：Panda Time-Note 前端在 Editorial 单布局架构下的完整功能设计

## 1. 产品目标

1. 以中文阅读与写作为核心，提供“可沉浸阅读 + 可持续写作 + 可回溯管理”的统一体验。
2. 保持当前数据接口与存储稳定，功能升级优先在前端编排层完成。
3. 通过单布局（Editorial）降低维护成本，减少样式与交互分叉。

## 2. 功能全景地图

### 2.1 阅读域（Home）

1. 章节化阅读流：按时间与标签组织内容浏览。
2. 目录区：提供筛选入口（关键词、标签、时间窗口）。
3. 旁注区：显示上下文信息（统计、标签聚合、快捷入口）。
4. 响应式折叠：移动端保持语义分区与顺序不丢失。

### 2.2 写作域（Editor）

1. 路由模式：`create` / `article` / `edit` 三态。
2. 保存反馈：待保存、保存中、已保存、保存失败。
3. 失败保护：保存失败后保留输入，不清空表单。
4. 跳转策略：默认流保存后回首页，demo 流保留当前页。

### 2.3 配置域（Settings）

1. Typography：标题与正文排版风格。
2. Material：纸感与材质语义。
3. Cadence：阅读节奏（密度/间距语义）。
4. Writing：写作行为（自动保存节奏等）。
5. 本地持久化：localStorage 读写与页面恢复。

## 3. 信息架构与路由契约

### 3.1 默认用户流

1. `/` -> EditorialHomeDemo
2. `/notes/new` -> EditorialEditorDemo（quick）
3. `/notes/new/article` -> EditorialEditorDemo（article）
4. `/notes/:id/edit` -> EditorialEditorDemo（edit）
5. `/settings` -> EditorialSettingsDemo

### 3.2 内部演示流

1. `/demo/editorial`
2. `/demo/editorial/editor`
3. `/demo/editorial/settings`

约束：移除旧 demo 变体，不再保留 minimal/dashboard/capsule/styles 入口。

## 4. 状态与数据设计

### 4.1 领域状态归属

1. `noteStore`：唯一业务数据真源。
2. `useDemoNotesViewModel`：Home 筛选编排（关键词/标签/时间）。
3. `useDemoEditorState`：Editor 保存编排（create/article/edit）。
4. `useEditorialSettings`：Settings 持久化编排。

### 4.2 数据流规则

1. 页面组件不直接复制业务逻辑，仅消费 store/composable。
2. 筛选优先顺序：归档态 -> 时间窗口 -> 标签 -> 关键词。
3. 编辑保存只调用 `createNote/updateNote`，不引入新接口。
4. 设置项变更立即持久化，刷新后恢复最后值。

## 5. 交互规范

### 5.1 Home

1. 搜索输入实时过滤。
2. 标签按钮可切换（二次点击取消）。
3. 时间筛选支持 `all/today/week/month`。
4. 目录、正文、旁注必须保留 `data-zone` 语义钩子。

### 5.2 Editor

1. 点击保存后进入 `saving`。
2. 成功后置 `saved`；失败置 `error`。
3. 错误状态不抹除输入内容。
4. 不改变现有创建/更新 API 参数结构。

### 5.3 Settings

1. 四分区控件统一采用 `v-model` 双向绑定。
2. 控件值采用稳定枚举值（如 `modern-geo`、`autosave-60s`）。
3. 初次加载无缓存时回退默认值。

## 6. 可访问性与排版

1. 主导航必须具备 `aria-label`。
2. 关键结构具备稳定测试定位（`data-zone` / `data-testid`）。
3. 中文优先字体策略，正文宽度与行高约束保留。
4. 移动端折叠仅改变布局，不改变信息可达性。

## 7. 异常与恢复策略

1. 加载失败：不崩溃，展示空态与可重试入口（后续 UI 文案增强）。
2. 保存失败：维持输入 + 显示错误状态。
3. 本地存储异常：忽略损坏数据并回退默认设置。
4. 路由参数异常：编辑页无法解析 id 时回退为创建态。

## 8. 验收标准（Definition of Done）

1. 路由：默认流与 demo editorial 流均可用。
2. Home：筛选交互与语义区块测试通过。
3. Editor：三态保存行为测试通过。
4. Settings：持久化恢复测试通过。
5. 工程门禁：`npm test` 与 `npm run build` 全绿。

## 9. 迭代优先级（后续）

### P1（高优先）

1. Home 目录分组（今日/本周/专题）
2. Editor 增加副标题/导语字段
3. Settings 主题实时预览（局部应用）

### P2（中优先）

1. 旁注区统计增强（阅读时长、标签热度）
2. 设置导入/导出（本地 JSON）
3. 编辑页草稿恢复（会话级）

### P3（规划）

1. 更精细的版式系统（栅格/字阶模板）
2. 阅读模式切换（专注/校对）
3. 可配置动效速度档位

## 10. 与现状一致性说明

1. 本稿与当前代码实现保持一致，不要求新增后端接口。
2. 本稿可直接作为后续 `writing-plans` 输入，拆解增量任务。
3. 本稿替代“多风格并行”时代的设计前提，确立 Editorial 单轨方案。
