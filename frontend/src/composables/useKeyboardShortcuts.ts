import { onMounted, onUnmounted } from 'vue';

export interface ShortcutHandlers {
  /** ⌘K 或 / ：打开搜索面板 */
  onSearch?: () => void;
  /** N：新建灵感小记 */
  onNewQuick?: () => void;
  /** ⇧N：新建文章 */
  onNewArticle?: () => void;
  /** G：切换 timeline/grid 视图 */
  onToggleView?: () => void;
  /** F：聚焦筛选（折叠/展开侧栏） */
  onToggleSidebar?: () => void;
  /** ?：快捷键帮助面板 */
  onShowShortcuts?: () => void;
  /** ⌘, ：打开设置 */
  onOpenSettings?: () => void;
  /** Esc：关闭当前弹层 */
  onEscape?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * 集中注册全局快捷键（⌘K / N / ⇧N / G / F / / / ? / Esc / ⌘,）。
 * 取代原先散落在 Home.vue 里基于 document.querySelector 的按键分发。
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  function handleKeydown(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;

    // 修饰键组合在任何焦点下都生效
    if (meta && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      handlers.onSearch?.();
      return;
    }
    if (meta && e.key === ',') {
      e.preventDefault();
      handlers.onOpenSettings?.();
      return;
    }

    if (e.key === 'Escape') {
      handlers.onEscape?.();
      return;
    }

    // 单键快捷键：输入框聚焦时不触发
    if (isEditableTarget(e.target) || meta || e.altKey) return;

    switch (e.key) {
      case 'n':
        e.preventDefault();
        handlers.onNewQuick?.();
        break;
      case 'N':
        e.preventDefault();
        handlers.onNewArticle?.();
        break;
      case 'g':
      case 'G':
        e.preventDefault();
        handlers.onToggleView?.();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        handlers.onToggleSidebar?.();
        break;
      case '/':
        e.preventDefault();
        handlers.onSearch?.();
        break;
      case '?':
        e.preventDefault();
        handlers.onShowShortcuts?.();
        break;
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown));
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

  return { handleKeydown };
}
