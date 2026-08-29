import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { ViewMode, TimeFilter } from '../types';

const VIEW_MODE_KEY = 'sujian-view-mode-v2';
const SIDEBAR_KEY = 'sujian-sidebar-collapsed-v2';

function readKey(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** 全局 UI 状态：视图模式、侧栏、筛选条件、弹层开关 */
export const useUIStore = defineStore('ui', () => {
  const viewMode = ref<ViewMode>(readKey(VIEW_MODE_KEY, 'timeline') === 'grid' ? 'grid' : 'timeline');
  const sidebarCollapsed = ref(readKey(SIDEBAR_KEY, '0') === '1');

  const searchQuery = ref('');
  const selectedTags = ref<string[]>([]);
  const currentFilter = ref<TimeFilter>('all');
  const showArchived = ref(false);

  const showSearchPalette = ref(false);
  const showShortcuts = ref(false);
  const showSettings = ref(false);

  watch(viewMode, (v) => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, v);
    } catch {
      /* ignore */
    }
  });
  watch(sidebarCollapsed, (v) => {
    try {
      localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  });

  function toggleViewMode() {
    viewMode.value = viewMode.value === 'timeline' ? 'grid' : 'timeline';
  }
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }
  function setFilter(f: TimeFilter) {
    currentFilter.value = f;
  }
  function toggleTag(tag: string) {
    selectedTags.value = selectedTags.value.includes(tag)
      ? selectedTags.value.filter((t) => t !== tag)
      : [...selectedTags.value, tag];
  }
  function setSearchQuery(q: string) {
    searchQuery.value = q;
  }
  function clearFilters() {
    searchQuery.value = '';
    selectedTags.value = [];
    currentFilter.value = 'all';
  }
  function toggleArchived() {
    showArchived.value = !showArchived.value;
  }
  const hasActiveFilters = () =>
    searchQuery.value !== '' || selectedTags.value.length > 0 || currentFilter.value !== 'all';

  return {
    viewMode,
    sidebarCollapsed,
    searchQuery,
    selectedTags,
    currentFilter,
    showArchived,
    showSearchPalette,
    showShortcuts,
    showSettings,
    toggleViewMode,
    toggleSidebar,
    setFilter,
    toggleTag,
    setSearchQuery,
    clearFilters,
    toggleArchived,
    hasActiveFilters,
  };
});
