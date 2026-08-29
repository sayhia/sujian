<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import FilterBar from '../components/notes/FilterBar.vue';
import NoteTimeline from '../components/notes/NoteTimeline.vue';
import NoteGrid from '../components/notes/NoteGrid.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import SearchPalette from '../components/search/SearchPalette.vue';
import SettingsDrawer from '../components/settings/SettingsDrawer.vue';
import Modal from '../components/ui/Modal.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import { useUIStore } from '../stores/ui';
import { useNotesStore } from '../stores/notes';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts';
import { useToast, useConfirmDialog } from '../composables/useFeedback';
import type { Note } from '../types';

const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();
const notes = useNotesStore();
const toast = useToast();
const { showConfirm } = useConfirmDialog();
const feedEl = ref<HTMLElement | null>(null);

/* ---------- 数据加载 ---------- */
function refresh() {
  notes.loadList({
    filter: ui.currentFilter,
    tags: ui.selectedTags,
    search: ui.searchQuery,
    archived: ui.showArchived,
  });
}

onMounted(() => {
  notes.checkFTS();
  notes.loadStats();
  notes.loadTags();
  refresh();
});

watch(
  () => [ui.currentFilter, ui.selectedTags.join(','), ui.searchQuery, ui.showArchived] as const,
  () => refresh(),
);

watch(
  () => notes.notes.length,
  () => {
    notes.loadStats();
    notes.loadTags();
  },
);

/* ---------- 滚动状态：Header 阴影 + 返回顶部 ---------- */
const feedScrolled = ref(false);
const showBackTop = ref(false);

function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  feedScrolled.value = el.scrollTop > 8;
  showBackTop.value = el.scrollTop > 600;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
    notes.loadMore();
  }
}

function backToTop() {
  feedEl.value?.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 笔记操作 ---------- */
async function handleArchive(note: Note) {
  try {
    await notes.archiveNote(note.id, !note.is_archived);
    toast(note.is_archived ? t('toast.noteUnarchived') : t('toast.noteArchived'), 'success');
  } catch {
    toast(t('toast.archiveFailed'), 'error');
  }
}

async function handleDelete(note: Note) {
  const ok = await showConfirm({
    title: t('common.delete'),
    message: `${t('common.confirm')}「${note.title || t('noteCard.emptyTitle')}」？`,
    type: 'danger',
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  });
  if (!ok) return;
  try {
    await notes.deleteNote(note.id);
    toast(t('toast.noteDeleted'), 'success', 5000, {
      undoLabel: t('toast.undo'),
      onUndo: () => notes.restoreNote(note.id).then(() => toast(t('toast.noteRestored'), 'success')),
    });
  } catch {
    toast(t('toast.deleteFailed'), 'error');
  }
}

/* ---------- 快捷键 ---------- */
useKeyboardShortcuts({
  onSearch: () => {
    ui.showSearchPalette = true;
  },
  onNewQuick: () => router.push('/notes/new'),
  onNewArticle: () => router.push('/notes/new/article'),
  onToggleView: () => ui.toggleViewMode(),
  onToggleSidebar: () => ui.toggleSidebar(),
  onShowShortcuts: () => {
    ui.showShortcuts = true;
  },
  onOpenSettings: () => {
    ui.showSettings = true;
  },
  onEscape: () => {
    ui.showShortcuts = false;
    ui.showSettings = false;
  },
});

/* ---------- 快捷键面板 ---------- */
const shortcutItems = ref([
  { label: t('shortcuts.search'), keys: ['⌘K', '/'] },
  { label: t('shortcuts.newQuick'), keys: ['N'] },
  { label: t('shortcuts.newArticle'), keys: ['⇧N'] },
  { label: t('shortcuts.toggleView'), keys: ['G'] },
  { label: t('shortcuts.toggleSidebar'), keys: ['F'] },
  { label: t('shortcuts.openSettings'), keys: ['⌘,'] },
  { label: t('shortcuts.close'), keys: ['Esc'] },
]);
</script>

<template>
  <div class="home-shell">
    <AppHeader :scrolled="feedScrolled" />

    <div class="home-body">
      <AppSidebar />

      <main class="home-main">
        <div ref="feedEl" class="feed" @scroll.passive="onScroll">
          <FilterBar />

          <Skeleton v-if="notes.loading && notes.notes.length === 0" :rows="3" :grid="ui.viewMode === 'grid'" />

          <template v-else-if="notes.notes.length">
            <NoteTimeline
              v-if="ui.viewMode === 'timeline'"
              :notes="notes.sortedNotes"
              @archive="handleArchive"
              @delete="handleDelete"
            />
            <NoteGrid
              v-else
              :notes="notes.sortedNotes"
              @archive="handleArchive"
              @delete="handleDelete"
            />

            <div v-if="notes.loadingMore" class="feed-more">
              <span class="mini-spinner" aria-hidden="true" />
              {{ t('home.loadMore') }}
            </div>
            <p v-else-if="!notes.hasMore && notes.notes.length" class="feed-end">
              {{ t('home.noMore') }}
            </p>
          </template>

          <EmptyState
            v-else-if="ui.showArchived"
            :title="t('home.archivedEmptyTitle')"
            :hint="t('home.archivedEmptyHint')"
          />
          <EmptyState
            v-else-if="ui.hasActiveFilters()"
            :title="t('home.emptyFilteredTitle')"
            :hint="t('home.emptyFilteredHint')"
            :action-label="t('home.clearFilters')"
            :on-action="ui.clearFilters"
          />
          <EmptyState
            v-else
            :title="t('home.emptyTitle')"
            :hint="t('home.emptyHint')"
            :action-label="t('common.new')"
            :on-action="() => router.push('/notes/new')"
          />
        </div>
      </main>
    </div>

    <!-- 返回顶部 -->
    <Transition name="btt">
      <button v-if="showBackTop" type="button" class="back-top" aria-label="back to top" @click="backToTop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </Transition>

    <SearchPalette />
    <SettingsDrawer :visible="ui.showSettings" @close="ui.showSettings = false" />

    <!-- 快捷键面板 -->
    <Modal :visible="ui.showShortcuts" :title="t('shortcuts.title')" @close="ui.showShortcuts = false">
      <ul class="shortcut-list">
        <li v-for="item in shortcutItems" :key="item.label" class="shortcut-row">
          <span class="sc-label">{{ item.label }}</span>
          <span class="sc-keys">
            <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
          </span>
        </li>
      </ul>
    </Modal>
  </div>
</template>

<style scoped>
.home-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--paper-0);
  color: var(--ink-900);
}

/* 返回顶部浮钮 */
.back-top {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--paper-1) calc(var(--glass-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--line);
  box-shadow: var(--shadow-2);
  color: var(--ink-700);
  transition: transform var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}
.back-top:hover {
  transform: translateY(-2px);
  color: var(--accent-strong);
  border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
}
.back-top svg {
  width: 16px;
  height: 16px;
}
.btt-enter-active,
.btt-leave-active {
  transition: opacity var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out);
}
.btt-enter-from,
.btt-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.home-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
.home-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.feed {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 28px 40px;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
}

.feed-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.feed-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
  font-size: 12.5px;
  color: var(--ink-500);
}
.feed-end {
  text-align: center;
  padding: 22px 0;
  font-size: 12px;
  color: var(--ink-500);
  letter-spacing: 0.05em;
  position: relative;
}
.feed-end::before,
.feed-end::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 48px;
  height: 1px;
  background: var(--line);
}
.feed-end::before {
  left: calc(50% - 120px);
}
.feed-end::after {
  right: calc(50% - 120px);
}
.spinner,
.mini-spinner {
  border-radius: 50%;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  animation: spin 0.8s linear infinite;
}
.spinner {
  width: 20px;
  height: 20px;
}
.mini-spinner {
  width: 14px;
  height: 14px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sc-label {
  font-size: 13px;
  color: var(--ink-900);
}
.sc-keys {
  display: flex;
  gap: 4px;
}
.sc-keys kbd {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--paper-1);
  border: 1px solid var(--line);
  color: var(--ink-700);
  box-shadow: 0 1px 0 var(--line);
}
</style>
