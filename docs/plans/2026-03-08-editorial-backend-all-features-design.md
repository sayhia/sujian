# Editorial 后端全功能设计总稿

日期：2026-03-08  
状态：Design Complete  
范围：Panda Time-Note 在现有 Go + SQLite 架构下的后端能力全量设计

## 实施状态（2026-03-08）

1. 已完成：`settings` 服务端读写接口（handler + service）。
2. 已完成：`drafts` 表迁移与草稿恢复接口。
3. 已完成：`notes.version` 乐观锁与冲突检测更新。
4. 已完成：回收站恢复与物理清理接口（restore/purge）。
5. 已完成：service 错误类型结构化（validation/not_found/conflict/storage）。

## 1. 设计目标

1. 在不破坏现有前端调用契约前提下，完成后端能力体系化设计。
2. 保持本地优先（SQLite）和离线可用，优先提升可靠性与一致性。
3. 为 Editorial 单布局提供长期可扩展的数据与服务基础。

## 2. 当前后端基线（已实现）

### 2.1 分层结构

1. `backend/handlers`：Wails 暴露接口层（参数归一化与默认值）。
2. `backend/services`：业务逻辑层（CRUD、过滤、搜索、统计、批处理）。
3. `backend/db`：SQLite 初始化与迁移（含 FTS5/索引/触发器）。
4. `backend/models`：领域模型与请求 DTO。

### 2.2 现有能力清单

1. 笔记创建/查询/更新/软删除。
2. 归档与批量归档/批量删除。
3. 标签统计、全量标签、统计信息。
4. 高级过滤（标签/关键字/时间/归档）。
5. FTS5 全文检索（失败回退 LIKE）。
6. 全量重置（删表重建）与 FTS 重建能力。

## 3. 领域模型设计

### 3.1 Note（现状）

字段：

1. `id`
2. `title`
3. `content`
4. `tags`（JSON 数组）
5. `type`（`quick|article`）
6. `created_at` / `updated_at`
7. `is_archived` / `is_deleted`

### 3.2 Settings（现状）

1. `key`（PK）
2. `value`（JSON 字符串）
3. `updated_at`

说明：当前前端设置已先在 localStorage 持久化，后端 `settings` 表预留了服务端持久化能力。

## 4. 后端接口契约（现状）

### 4.1 Handler 暴露接口

1. `Create(title, content, tags, noteType)`
2. `GetAll(limit, offset, tags, archived)`
3. `GetFiltered(limit, offset, tags, search, archived, startTime, endTime)`
4. `GetByID(id)`
5. `Update(id, title?, content?, tags?)`
6. `Delete(id)`（软删）
7. `Archive(id, archive)`
8. `BatchDelete(ids)`
9. `BatchArchive(ids, archive)`
10. `Search(query, limit)` / `SearchWithHighlight(query, limit)`
11. `GetStats()` / `GetAllTags()` / `GetTagsWithCount()`
12. `ResetAllData()` / `IsFTSEnabled()`

### 4.2 一致性规则

1. 所有查询默认 `is_deleted = 0`。
2. 搜索默认过滤归档（仅 active）。
3. 写操作更新 `updated_at`。
4. FTS 通过触发器保持与 `notes` 同步。

## 5. 全功能演进设计（后端）

### 5.1 配置中心化（P1）

目标：将 Editorial 设置从前端本地存储迁移到后端 settings。

新增接口：

1. `GetSetting(key)`
2. `SetSetting(key, value)`
3. `GetSettings(prefix?)`

设计要点：

1. `value` 存 JSON，schema 由 key 命名空间约束（如 `editorial.typography`）。
2. 服务端做最小校验（类型/枚举值）。
3. 保持与 localStorage 双读迁移窗口（先读后端，无值回落本地）。

### 5.2 草稿与恢复（P1）

目标：支持编辑器异常退出后的恢复。

新增模型：`drafts`

1. `id`、`note_id`（nullable）
2. `payload`（JSON，含 title/content/tags/type）
3. `updated_at`

新增接口：

1. `SaveDraft(noteID?, payload)`
2. `GetDraft(noteID?)`
3. `DeleteDraft(noteID?)`

### 5.3 版本化与冲突检测（P2）

目标：减少多窗口/并发覆盖。

方案：

1. `notes` 增加 `version INTEGER DEFAULT 1`。
2. `Update` 增加 `expectedVersion` 参数。
3. 更新时 `WHERE id=? AND version=?`，成功后 `version+1`。
4. 失败返回 `conflict` 错误码并附最新内容摘要。

### 5.4 软删除回收站（P2）

目标：增强可恢复性。

新增接口：

1. `Restore(id)`
2. `BatchRestore(ids)`
3. `PurgeDeleted(beforeTime)`（物理清理）

### 5.5 搜索增强（P2）

1. 标签权重与字段权重可配置（title/content/tags）。
2. 搜索建议词（基于标签与高频词）。
3. 统一 Search/Filter 的分页一致性。

## 6. 数据库迁移策略

1. 所有新增列采用向后兼容默认值。
2. 新表迁移走 `RunMigrations` 幂等建表。
3. 每次迁移附带最小回填与索引创建。
4. 提供“迁移后自检”接口（表存在/索引存在/FTS 可用）。

## 7. 可观测性与错误模型

### 7.1 错误分层

1. `validation_error`
2. `not_found`
3. `conflict`
4. `storage_error`

### 7.2 日志规范

1. Handler 只记录入口参数摘要（避免大文本全量打印）。
2. Service 记录 SQL 失败与语义错误码。
3. 重置与清理类操作记录审计日志（本地文件）。

## 8. 性能与容量设计

1. 当前分页模型继续沿用 `limit + offset`。
2. 对高频列表查询保留复合索引（`is_archived,is_deleted,created_at`）。
3. FTS 失败自动回退 LIKE，确保功能可用。
4. 计划中可引入 keyset pagination 作为大数据量优化项。

## 9. 安全与数据保护

1. 输入长度限制（title/content/tags 数量）。
2. 标签与查询参数规范化，防止异常查询放大。
3. 重置接口默认加二次确认标志（后续实现）。
4. 本地数据库备份导出接口（后续实现）。

## 10. 验收标准（后端设计）

1. 保证现有前端调用契约不破坏。
2. 新增能力均有清晰模型、接口、迁移路径。
3. 每个阶段（P1/P2）可独立实施与验证。
4. 对应实现计划可直接按任务拆解为红绿提交流程。

## 11. 建议的下一步实现计划主题

1. `editorial-settings-backend-persistence`
2. `editor-draft-recovery-backend`
3. `note-versioning-and-conflict-detection`
4. `trash-restore-and-purge`
