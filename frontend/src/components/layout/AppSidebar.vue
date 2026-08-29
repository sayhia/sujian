<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../../stores/ui';
import { useNotesStore } from '../../stores/notes';
import { useTagColors } from '../../composables/useTagColors';
import { useCountUp } from '../../composables/useCountUp';
import type { TimeFilter } from '../../types';

const { t } = useI18n();
const ui = useUIStore();
const notes = useNotesStore();
const { getTagColor } = useTagColors();

const totalCount = computed(() => notes.stats?.total_notes ?? 0);
const weekCount = computed(() => notes.stats?.weekly_count ?? 0);
const totalDisplay = useCountUp(totalCount);
const weekDisplay = useCountUp(weekCount);

const tagSearch = ref('');

const timeFilters: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'sidebar.all' },
  { key: 'today', label: 'sidebar.today' },
  { key: 'week', label: 'sidebar.week' },
  { key: 'month', label: 'sidebar.month' },
];

const filteredTags = computed(() => {
  const q = tagSearch.value.trim().toLowerCase();
  const list = q ? notes.tagsWithCount.filter((x) => x.name.toLowerCase().includes(q)) : notes.tagsWithCount;
  return list.slice(0, 40);
});

function pickTag(tag: string) {
  ui.toggleTag(tag);
}
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed: ui.sidebarCollapsed }">
    <!-- 时间筛选 -->
    <nav class="side-section" aria-label="time filter">
      <p class="side-label">{{ t('sidebar.navTitle') }}</p>
      <button
        v-for="f in timeFilters"
        :key="f.key"
        type="button"
        class="side-item"
        :class="{ active: !ui.showArchived && ui.currentFilter === f.key }"
        v-tip:right="ui.sidebarCollapsed ? t(f.label) : undefined"
        @click="ui.setFilter(f.key); ui.showArchived = false"
      >
        <span class="side-dot" aria-hidden="true" />
        <span class="side-text">{{ t(f.label) }}</span>
      </button>
      <button
        type="button"
        class="side-item"
        :class="{ active: ui.showArchived }"
        v-tip:right="ui.sidebarCollapsed ? t('sidebar.archived') : undefined"
        @click="ui.toggleArchived()"
      >
        <svg class="side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="4" rx="1.5" />
          <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
        </svg>
        <span class="side-text">{{ t('sidebar.archived') }}</span>
        <span v-if="notes.stats && notes.stats.archived_notes > 0" class="side-count">
          {{ notes.stats.archived_notes }}
        </span>
      </button>
    </nav>

    <!-- 标签 -->
    <nav class="side-section side-tags" aria-label="tags">
      <p class="side-label">{{ t('sidebar.tagsTitle') }}</p>
      <div class="tag-search">
        <svg class="tag-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          v-model="tagSearch"
          class="tag-search-input"
          type="text"
          :placeholder="t('sidebar.searchTagsPlaceholder')"
          aria-label="search tags"
        />
      </div>
      <div v-if="filteredTags.length" class="tag-list">
        <button
          v-for="tag in filteredTags"
          :key="tag.name"
          type="button"
          class="tag-item"
          :class="{ active: ui.selectedTags.includes(tag.name) }"
          v-tip:right="ui.sidebarCollapsed ? tag.name : undefined"
          @click="pickTag(tag.name)"
        >
          <span class="tag-item-dot" :style="{ background: getTagColor(tag.name) }" aria-hidden="true" />
          <span class="tag-item-name">{{ tag.name }}</span>
          <span class="tag-item-count">{{ tag.count }}</span>
        </button>
      </div>
      <p v-else-if="notes.tagsWithCount.length === 0" class="side-empty">
        {{ t('sidebar.noTagsHint') }}
      </p>
    </nav>

    <!-- 统计 -->
    <div v-if="notes.stats && !ui.sidebarCollapsed" class="side-footer">
      <div class="stat-block">
        <span class="stat-num">{{ totalDisplay }}</span>
        <span class="stat-label">{{ t('sidebar.statsTotal') }}</span>
      </div>
      <div class="stat-block">
        <span class="stat-num">{{ weekDisplay }}</span>
        <span class="stat-label">{{ t('sidebar.statsWeek') }}</span>
      </div>
      <div class="stat-switch">
        <span class="stat-dot" style="background: var(--accent)" />
        <span class="stat-name">{{ t('common.appName') }}</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  flex: none;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  padding: 14px 12px 12px;
  background: var(--paper-1);
  border-right: 1px solid var(--line);
  overflow-y: auto;
  transition: width var(--dur-med) var(--ease-out);
}
.app-sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
  padding: 14px 8px 12px;
}
.app-sidebar.collapsed .side-label,
.app-sidebar.collapsed .side-text,
.app-sidebar.collapsed .side-count,
.app-sidebar.collapsed .tag-search,
.app-sidebar.collapsed .tag-item-name,
.app-sidebar.collapsed .tag-item-count,
.app-sidebar.collapsed .side-footer {
  display: none;
}
.app-sidebar.collapsed .side-item {
  justify-content: center;
  padding: 0;
  height: 40px;
}
.app-sidebar.collapsed .side-dot,
.app-sidebar.collapsed .side-icon {
  margin: 0;
}
.app-sidebar.collapsed .tag-list {
  margin-top: 6px;
}
.app-sidebar.collapsed .tag-item {
  justify-content: center;
  padding: 0;
  height: 36px;
}
.app-sidebar.collapsed .tag-item-dot {
  margin: 0;
}

.side-section {
  margin-bottom: 18px;
}
.side-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-500);
  padding: 0 10px;
  margin-bottom: 6px;
}
.side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  font-size: 13.5px;
  color: var(--ink-700);
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.side-item:hover {
  background: var(--paper-2);
  color: var(--ink-900);
}
.side-item.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 600;
}
.side-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--ink-500);
  opacity: 0.6;
}
.side-item.active .side-dot {
  background: var(--accent);
  border-color: var(--accent);
  opacity: 1;
}
.side-icon {
  flex: none;
  width: 15px;
  height: 15px;
  opacity: 0.7;
}
.side-text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.side-count {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  background: var(--paper-2);
  color: var(--ink-500);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 标签 */
.tag-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  margin: 0 2px 8px;
  border-radius: var(--radius-md);
  background: var(--paper-0);
  border: 1px solid var(--line);
  color: var(--ink-500);
}
.tag-search:focus-within {
  border-color: var(--accent-ring);
}
.tag-search-icon {
  flex: none;
  width: 13px;
  height: 13px;
}
.tag-search-input {
  flex: 1;
  font-size: 12.5px;
  color: var(--ink-900);
}
.tag-search-input::placeholder {
  color: var(--ink-500);
}
.tag-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--ink-700);
}
.tag-item:hover {
  background: var(--paper-2);
}
.tag-item.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.tag-item-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.tag-item-name {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag-item-count {
  flex: none;
  font-size: 11px;
  color: var(--ink-500);
}
.side-empty {
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-500);
  padding: 4px 10px;
}

/* 统计 */
.side-footer {
  margin-top: auto;
  padding: 12px 6px 2px;
  border-top: 1px solid var(--line);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-num {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 11px;
  color: var(--ink-500);
}
.stat-switch {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: var(--ink-500);
  font-size: 11px;
}
.stat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
</style>
