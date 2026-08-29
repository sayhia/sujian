# 项目长期约定

- 素笺 Sujian：Wails v3 (Go) + Vue 3 桌面笔记应用，设计语言「纸墨 Paper & Ink」，样式走 CSS 变量令牌（tokens/themes/base）。
- 主题系统：六套墨色 olive/violet/navy/amber/emerald/crimson（配色取自人民币色系），但**命名禁止出现人民币/面额字样**，用中性颜色名 + 气质词。
- 后端保持 API/schema 兼容策略：Wails bindings 不重生成，方法签名不可随意变更。
