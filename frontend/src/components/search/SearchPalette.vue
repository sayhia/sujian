<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../../stores/ui';
import { useNotesStore } from '../../stores/notes';
import { useSearchHistory } from '../../composables/useSearchHistory';
import { useTagColors } from '../../composables/useTagColors';
import Modal from '../ui/Modal.vue';
import type { Note } from '../../types';

const { t } = useI18n();
const router = useRouter();
const ui = useUIStore();
const notes = useNotesStore();
const { history, addHistory, clearHistory } = useSearchHistory();
const { getTagColor } = useTagColors();

const query = ref('');
const results = ref<Note[]>([]);
const searching = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const activeIndex = ref(-1);

watch(
  () => ui.showSearchPalette,
  (v) => {
    if (v) {
      query.value = '';
      results.value = [];
      activeIndex.value = -1;
      nextTick(() => inputRef.value?.focus());
    }
  },
);

let timer: ReturnType<typeof setTimeout> | null = null;
watch(query, (q) => {
  if (timer) clearTimeout(timer);
  activeIndex.value = -1;
  if (q.trim().length < 2) {
    results.value = [];
    return;
  }
  searching.value = true;
  timer = setTimeout(async () => {
    const res = await notes.searchNotes(q.trim(), 8);
    results.value = res?.notes ?? [];
    searching.value = false;
  }, 200);
});

function applyFilter() {
  const q = query.value.trim();
  if (!q) return;
  addHistory(q);
  ui.setSearchQuery(q);
  ui.showSearchPalette = false;
}

function pickHistory(q: string) {
  addHistory(q);
  ui.setSearchQuery(q);
  ui.showSearchPalette = false;
}

function openNote(note: Note) {
  if (query.value.trim().length >= 2) addHistory(query.value.trim());
  ui.showSearchPalette = false;
  router.push(`/notes/${note.id}/edit`);
}

/* ---------- 键盘导航 ---------- */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (results.value.length) {
      activeIndex.value = (activeIndex.value + 1) % results.value.length;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (results.value.length) {
      activeIndex.value =
        activeIndex.value <= 0 ? results.value.length - 1 : activeIndex.value - 1;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex.value >= 0 && results.value[activeIndex.value]) {
      openNote(results.value[activeIndex.value]);
    } else {
      applyFilter();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    ui.showSearchPalette = false;
  }
}
</script>

<template>
  <Modal
    :visible="ui.showSearchPalette"
    :title="t('search.title')"
    :width="'min(560px, calc(100vw - 48px))'"
    :close-on-esc="false"
    @close="ui.showSearchPalette = false"
  >
    <div class="search-palette">
      <div class="search-input-row">
        <svg class="s-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          class="s-input"
          type="text"
          :placeholder="t('search.placeholder')"
          @keydown="onKeydown"
        />
        <button class="s-apply" type="button" :title="t('search.applyHint')" @click="applyFilter">↵</button>
      </div>
      <p class="s-hint">
        <template v-if="query.trim().length >= 2 && results.length">
          {{ t('search.applyHint') }} · ↑↓ 选择
        </template>
        <template v-else>{{ t('search.applyHint') }}</template>
      </p>

      <div v-if="query.trim().length < 2" class="s-history">
        <div v-if="history.length" class="s-history-head">
          <span class="s-label">{{ t('search.history') }}</span>
          <button class="s-clear" type="button" @click="clearHistory">{{ t('search.clearHistory') }}</button>
        </div>
        <div class="s-history-list">
          <button v-for="h in history" :key="h" type="button" class="s-history-item" @click="pickHistory(h)">
            <svg class="s-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
            </svg>
            {{ h }}
          </button>
        </div>
      </div>

      <div v-else class="s-results">
        <div v-if="searching" class="s-status">{{ t('common.loading') }}</div>
        <div v-else-if="results.length === 0" class="s-status">{{ t('search.noResults') }}</div>
        <button
          v-for="(note, i) in results"
          :key="note.id"
          type="button"
          class="s-result"
          :class="{ active: activeIndex === i }"
          @mouseenter="activeIndex = i"
          @click="openNote(note)"
        >
          <h5 class="s-result-title" v-html="note.title || t('noteCard.emptyTitle')" />
          <p class="s-result-snippet" v-html="note.content" />
          <div v-if="note.tags.length" class="s-result-tags">
            <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="s-result-tag" :style="{ color: getTagColor(tag) }">
              {{ tag }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.search-palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.search-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 8px 0 14px;
  border-radius: var(--radius-md);
  background: var(--paper-1);
  border: 1px solid var(--line);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.search-input-row:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.s-icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--ink-500);
}
.s-input {
  flex: 1;
  font-size: 14px;
  color: var(--ink-900);
}
.s-input::placeholder {
  color: var(--ink-500);
}
.s-apply {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 14px;
  font-weight: 700;
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.s-apply:hover {
  background: var(--accent);
  color: #fff;
}
.s-hint {
  font-size: 11.5px;
  color: var(--ink-500);
  padding-left: 2px;
}

.s-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.s-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-500);
}
.s-clear {
  font-size: 12px;
  color: var(--ink-500);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.s-clear:hover {
  color: var(--danger);
}
.s-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.s-history-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  background: var(--paper-1);
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-700);
  transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.s-history-item:hover {
  background: var(--paper-2);
  border-color: var(--line-strong);
  color: var(--ink-900);
}
.s-icon-sm {
  width: 11px;
  height: 11px;
}

.s-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  margin: 0 -8px;
  padding: 0 8px;
}
.s-status {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ink-500);
}
.s-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  text-align: left;
  border: 1px solid transparent;
  transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.s-result:hover {
  background: var(--paper-1);
}
.s-result.active {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
}
.s-result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-900);
}
.s-result-title :deep(mark),
.s-result-snippet :deep(mark) {
  background: color-mix(in srgb, var(--accent) 28%, transparent);
  color: var(--accent-strong);
  border-radius: 3px;
  padding: 0 1px;
}
.s-result-snippet {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink-700);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.s-result-tags {
  display: flex;
  gap: 8px;
}
.s-result-tag {
  font-size: 11.5px;
}
</style>
