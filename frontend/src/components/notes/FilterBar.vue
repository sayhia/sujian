<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../../stores/ui';
import { useNotesStore } from '../../stores/notes';
import { useTagColors } from '../../composables/useTagColors';
import Segmented from '../ui/Segmented.vue';
import Dropdown, { type DropdownItem } from '../ui/Dropdown.vue';
import type { ViewMode, SortOption } from '../../types';

const { t } = useI18n();
const ui = useUIStore();
const notes = useNotesStore();
const { getTagColor } = useTagColors();

const viewOptions = [
  { value: 'timeline' as ViewMode, label: t('home.viewTimeline'), icon: 'M5 6h14M5 12h14M5 18h14' },
  { value: 'grid' as ViewMode, label: t('home.viewGrid'), icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: t('home.sort.dateDesc') },
  { value: 'date-asc', label: t('home.sort.dateAsc') },
  { value: 'title-asc', label: t('home.sort.titleAsc') },
  { value: 'title-desc', label: t('home.sort.titleDesc') },
];

const sortItems: DropdownItem[] = sortOptions.map((o) => ({
  key: o.value,
  label: o.label,
  icon: o.value.startsWith('date')
    ? 'M3 12a9 9 0 1 0 9-9M12 7v5l3 2'
    : o.value.endsWith('asc')
      ? 'M5 12h14M12 5l7 7-7 7M5 12h14M12 5l7 7-7 7'
      : 'M5 12h14M12 19l-7-7 7-7',
}));

function currentSortLabel(): string {
  return sortOptions.find((o) => o.value === notes.sortOption)?.label ?? '';
}

function onSortSelect(key: string) {
  notes.setSortOption(key as SortOption);
}

function clearAll() {
  ui.clearFilters();
}
</script>

<template>
  <div class="filter-bar">
    <div class="fb-left">
      <div v-if="ui.hasActiveFilters()" class="fb-chips">
        <span v-if="ui.searchQuery" class="chip chip-search">
          <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
          </svg>
          {{ ui.searchQuery }}
          <button class="chip-x" type="button" :aria-label="t('common.close')" @click="ui.setSearchQuery('')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
        <span v-for="tag in ui.selectedTags" :key="tag" class="chip" :style="{ '--chip-color': getTagColor(tag) }">
          <span class="chip-dot" aria-hidden="true" />
          {{ tag }}
          <button class="chip-x" type="button" :aria-label="`remove ${tag}`" @click="ui.toggleTag(tag)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
        <span v-if="ui.currentFilter !== 'all'" class="chip chip-time">
          {{ t(`sidebar.${ui.currentFilter}`) }}
          <button class="chip-x" type="button" :aria-label="t('common.close')" @click="ui.setFilter('all')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
        <button class="chip-clear" type="button" @click="clearAll">{{ t('home.clearFilters') }}</button>
      </div>
    </div>

    <div class="fb-right">
      <Dropdown :items="sortItems" align="left" @select="onSortSelect">
        <template #default="{ toggle }">
          <button type="button" class="sort-trigger" @click="toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h9M3 12h9M3 18h9M14 6l7 7-3.5 3.5L21 20M18.5 9.5h-4.5" />
            </svg>
            <span class="sort-label">{{ currentSortLabel() }}</span>
            <svg class="sort-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </template>
      </Dropdown>
      <Segmented
        :model-value="ui.viewMode"
        :options="viewOptions"
        @update:model-value="(v) => (ui.viewMode = v as ViewMode)"
      />
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 6px 0 8px;
}
.fb-left {
  flex: 1;
  min-width: 0;
  display: flex;
}
.fb-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 6px 0 11px;
  border-radius: var(--radius-full);
  background: var(--paper-1);
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-700);
}
.chip-search {
  color: var(--accent-strong);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
  background: var(--accent-soft);
}
.chip-time {
  color: var(--accent-strong);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
}
.chip-icon {
  width: 11px;
  height: 11px;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chip-color, var(--accent));
}
.chip-x {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.6;
}
.chip-x:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}
.chip-x svg {
  width: 9px;
  height: 9px;
}
.chip-clear {
  font-size: 12px;
  color: var(--ink-500);
  padding: 2px 4px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.chip-clear:hover {
  color: var(--danger);
}

.fb-right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sort-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  background: var(--paper-1);
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-700);
  transition: border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
}
.sort-trigger:hover {
  border-color: var(--line-strong);
  background: var(--paper-2);
}
.sort-trigger svg {
  width: 13px;
  height: 13px;
}
.sort-chevron {
  width: 10px !important;
  height: 10px !important;
  opacity: 0.6;
}
.sort-label {
  min-width: 52px;
  text-align: left;
}
</style>
