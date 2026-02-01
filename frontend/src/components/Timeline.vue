<template>
  <div class="timeline-container" data-component="timeline">
    <!-- Loading State with Skeleton -->
    <Transition name="fade">
      <div v-if="noteStore.loading" class="loading-state">
        <div class="skeleton-container">
          <div v-for="i in 5" :key="i" class="skeleton-note">
            <div class="skeleton-timeline-node">
              <div class="skeleton-dot"></div>
            </div>
            <div class="skeleton-card">
              <div class="skeleton-header">
                <div class="skeleton-date-badge"></div>
                <div class="skeleton-content">
                  <div class="skeleton-title"></div>
                  <div class="skeleton-text"></div>
                  <div class="skeleton-text short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Timeline Header -->
    <div v-if="!noteStore.loading && filteredNotes.length > 0" class="timeline-header">
      <div class="header-content">
        <h2 class="header-title">
          <CalendarDays class="header-icon" />
          {{ noteStore.archivedView ? '已归档笔记' : (viewMode === 'timeline' ? '时间线' : '卡片视图') }}
        </h2>
        <div class="header-right">
          <span class="note-count">{{ filteredNotes.length }} 条笔记</span>
          <div class="view-toggle-group">
            <button 
              @click="viewMode = 'timeline'"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'timeline' }"
              title="时间线视图"
              type="button"
            >
              <List class="view-toggle-icon" />
            </button>
            <button 
              @click="viewMode = 'grid'"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'grid' }"
              title="卡片视图"
              type="button"
            >
              <Grid3x3 class="view-toggle-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Line (only in timeline mode) -->
    <div v-if="!noteStore.loading && filteredNotes.length > 0 && viewMode === 'timeline'" class="timeline-line"></div>

    <!-- Notes -->
    <TransitionGroup
      v-if="!noteStore.loading"
      name="list"
      tag="div"
      :class="['notes-list', viewMode]"
      @scroll.passive="handleScroll"
    >
      <div 
        v-for="(note, index) in filteredNotes" 
        :key="note.id" 
        class="note-item"
        :class="{ 'grid-item': viewMode === 'grid' }"
      >
        <!-- Timeline Node (only in timeline mode) -->
        <div v-if="viewMode === 'timeline'" class="timeline-node">
          <div class="node-dot"></div>
          <div class="node-ring"></div>
        </div>
        
        <!-- Note Card -->
        <div class="note-card-wrapper" :class="{ 'grid-card-wrapper': viewMode === 'grid' }">
          <NoteCapsule
            :note="note"
            :view-mode="viewMode"
            @edit="onEditNote"
            @archive="onArchiveNote"
            @delete="onDeleteNote"
          />
        </div>
      </div>
      <!-- Load more indicator / 上拉加载提示 -->
      <div
        v-if="noteStore.isLoadingMore || noteStore.hasMore"
        :key="'load-more-indicator'"
        class="load-more-indicator"
      >
        <div v-if="noteStore.isLoadingMore" class="load-more-inner">
          <Loader2 class="load-more-icon" />
          <span class="load-more-text">加载中...</span>
        </div>
        <div v-else class="load-more-inner load-more-hint">
          <span class="load-more-text">上拉加载更多</span>
        </div>
      </div>
    </TransitionGroup>

    <!-- Empty State -->
    <Transition name="fade">
      <div v-if="!noteStore.loading && filteredNotes.length === 0 && noteStore.hasLoadedOnce" class="empty-state">
        <div class="empty-illustration">
          <div class="empty-bg"></div>
          <Search v-if="selectedTags.length > 0" class="empty-icon" />
          <FileText v-else class="empty-icon" />
        </div>
        <h3 class="empty-title">
          {{ emptyTitle }}
        </h3>
        <p class="empty-text">
          {{ emptyText }}
        </p>
        <div v-if="!noteStore.archivedView && selectedTags.length === 0 && noteStore.currentFilter === 'all'" class="empty-hint">
          <Sparkles class="hint-icon" />
          <span>记录每一个灵感瞬间</span>
          <div class="empty-shortcuts">
            <kbd>N</kbd> 新建笔记 · <kbd>⌘K</kbd> 搜索 · <kbd>⇧N</kbd> 新建文章
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import NoteCapsule from './NoteCapsule.vue';
import { useNoteStore } from '../stores/noteStore';
import type { Note } from '../types';
import { FileText, CalendarDays, Sparkles, Search, Loader2, Grid3x3, List, Filter } from 'lucide-vue-next';

interface Props {
  selectedTags: string[];
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
});

const emit = defineEmits<{
  edit: [note: Note];
  archive: [id: number];
  delete: [id: number];
}>();

const noteStore = useNoteStore();
const viewMode = ref<'timeline' | 'grid'>('timeline');

// 暴露视图切换方法给父组件（用于键盘快捷键）
function toggleViewMode() {
  viewMode.value = viewMode.value === 'timeline' ? 'grid' : 'timeline';
}

// 暴露方法
defineExpose({
  toggleViewMode
});

// Inject from parent with type guards
const showConfirmDialog = inject<(options: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  action: () => Promise<void>;
}) => void>('showConfirmDialog', () => {
  console.warn('showConfirmDialog not provided');
});

const showToast = inject<(message: string, type: 'success' | 'error' | 'warning' | 'info') => void>('showToast', () => {
  console.warn('showToast not provided');
});

// Notes are now filtered and sorted on backend, so we just use to store's sortedNotes
// The store handles archived/active filtering and sorting based on sortOption
const filteredNotes = computed(() => {
  let notes = noteStore.sortedNotes;
  
  // Apply search filter if searchQuery is provided
  if (props.searchQuery && props.searchQuery.trim().length >= 2) {
    const query = props.searchQuery.toLowerCase().trim();
    notes = notes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  return notes;
});

function handleScroll(event: Event) {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  
  // 使用 IntersectionObserver 风格的预加载，提前量调整为 300px
  const threshold = 300;
  const isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
  
  if (isNearBottom && !noteStore.isLoadingMore && noteStore.hasMore) {
    noteStore.loadMoreNotes();
  }
}

const emptyTitle = computed(() => {
  if (props.selectedTags.length > 0) return '没有匹配的笔记';
  if (props.searchQuery && props.searchQuery.trim().length >= 2) return '未找到匹配的笔记';
  if (noteStore.archivedView) return '暂无归档笔记';
  if (noteStore.currentFilter !== 'all') {
    const filterLabels: Record<string, string> = {
      'today': '今天',
      'week': '本周',
      'month': '本月'
    };
    return `${filterLabels[noteStore.currentFilter] || ''}暂无笔记`;
  }
  return '暂无笔记';
});

const emptyText = computed(() => {
  if (props.selectedTags.length > 0) return '尝试选择其他标签组合';
  if (props.searchQuery && props.searchQuery.trim().length >= 2) return '换个关键词试试';
  if (noteStore.archivedView) return '归档的笔记会显示在这里';
  if (noteStore.currentFilter !== 'all') return '切换到其他时间范围';
  return '点击「新建笔记」开始记录你的想法';
});

function onEditNote(note: Note) {
  emit('edit', note);
}

async function onArchiveNote(id: number) {
  const isArchiving = !noteStore.archivedView;
  const action = isArchiving ? '归档' : '取消归档';
  
  try {
    await noteStore.archiveNote(id, isArchiving);
    // Refresh stats to update counts (tags don't change but stats do)
    await noteStore.loadStats();
    showToast?.(`笔记已${action}`, 'success');
  } catch (e) {
    showToast?.(`${action}失败`, 'error');
  }
}

async function onDeleteNote(id: number) {
  emit('delete', id);
  
  showConfirmDialog?.({
    title: '删除笔记',
    message: '确定要删除这条笔记吗？此操作无法撤销。',
    type: 'danger',
    confirmText: '删除',
    action: async () => {
      try {
        await noteStore.deleteNote(id);
        await Promise.all([
          noteStore.loadStats(),
          noteStore.loadTagsWithCount()
        ]);
        showToast?.('笔记已删除', 'success');
      } catch (e) {
        showToast?.('删除失败', 'error');
      }
       }
     });
   }
</script>
<style scoped>
.timeline-container {
  position: relative;
  /* Reduced bottom padding as parent has padding */
  padding-bottom: 32px;
}

/* Header */
.timeline-header {
  margin-bottom: 24px;
  padding-bottom: 4px;
  animation: fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  position: relative;
  z-index: 1;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.header-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 18%, transparent),
    transparent
  );
  transition: left 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.header-content:hover::before {
  left: 100%;
}

.header-content:hover {
  box-shadow: var(
    --state-accent-soft-shadow,
    0 6px 20px color-mix(in srgb, var(--text-primary) 6%, transparent)
  );
  transform: translateY(-2px);
  border-color: var(--state-accent-soft-border, color-mix(in srgb, var(--color-accent) 24%, transparent));
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-body);
  margin: 0;
}

.header-icon {
  width: 22px;
  height: 22px;
  color: var(--color-accent-strong);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.note-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: color-mix(in srgb, var(--color-accent) 10%, color-mix(in srgb, var(--text-primary) 4%, transparent));
  padding: 6px 14px;
  border-radius: 20px;
}

/* View Toggle */
.view-toggle-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: color-mix(in srgb, var(--text-primary) 3%, var(--color-surface));
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
}

.view-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--color-text-muted);
  position: relative;
  overflow: hidden;
}

.view-toggle-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-surface) 40%, transparent) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.view-toggle-btn:hover::before {
  opacity: 1;
}

.view-toggle-btn:hover {
  background: color-mix(in srgb, var(--color-surface) 90%, var(--glass-bg));
  transform: scale(1.05);
  color: var(--color-text-body);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.view-toggle-btn:active {
  transform: scale(0.95);
  background: color-mix(in srgb, var(--color-surface) 95%, var(--glass-bg));
}

.view-toggle-btn.active {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
  color: var(--color-on-accent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-accent-strong) 28%, transparent);
}

.view-toggle-btn.active:hover {
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent-strong) 38%, transparent);
}

.view-toggle-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.2;
}

.header-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 18%, transparent),
    transparent
  );
  transition: left 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.header-content:hover::before {
  left: 100%;
}

.header-content:hover {
  box-shadow: var(
    --state-accent-soft-shadow,
    0 6px 20px color-mix(in srgb, var(--text-primary) 6%, transparent)
  );
  transform: translateY(-2px);
  border-color: var(--state-accent-soft-border, color-mix(in srgb, var(--color-accent) 24%, transparent));
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-body);
  margin: 0;
}

.header-icon {
  width: 22px;
  height: 22px;
  color: var(--color-accent-strong);
}

.note-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: color-mix(in srgb, var(--color-accent) 10%, color-mix(in srgb, var(--text-primary) 4%, transparent));
  padding: 6px 14px;
  border-radius: 20px;
}

/* Timeline Line */
.timeline-line {
  position: absolute;
  left: 44px;
  top: 80px;
  bottom: 60px;
  width: 3px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-accent) 0%, transparent) 0%,
    color-mix(in srgb, var(--color-accent) 80%, transparent) 10%,
    color-mix(in srgb, var(--color-accent-strong) 90%, transparent) 50%,
    color-mix(in srgb, var(--color-accent) 80%, transparent) 90%,
    color-mix(in srgb, var(--color-accent) 0%, transparent) 100%
  );
  border-radius: 2px;
  animation: lineDraw 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
  transform-origin: top;
  box-shadow: 0 0 8px color-mix(
      in srgb,
      var(--color-accent) 20%,
      transparent
    );
}

@keyframes lineDraw {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* Notes List */
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  contain: layout style paint;
  padding-top: 4px;
  padding-right: 12px; /* 右侧留白，避免卡片紧贴滚动条 */
  padding-bottom: 40px; /* 列表自身的缓冲空间，避免最后一条贴边 */
  /* 固定列表高度 + 内部滚动，保持左侧时间线背景连续 */
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Grid View Mode */
.notes-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  padding-right: 12px;
  padding-bottom: 30px;
}

.note-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  /* 去掉逐条进场动画，减少大列表渲染开销 */
  will-change: transform, opacity;
  margin-top: 4px;
}

.note-item:first-child {
  margin-top: 0;
}

.note-item.grid-item {
  display: block;
  margin-top: 0;
}

/* Load more indicator */
.load-more-indicator {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
}

.load-more-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.load-more-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent);
  transition: left 0.6s ease;
}

.load-more-inner:hover::before {
  left: 100%;
}

.load-more-icon {
  width: 16px;
  height: 16px;
  animation: spin 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  color: var(--color-accent-strong);
  filter: drop-shadow(0 1px 2px color-mix(in srgb, var(--color-accent-strong) 30%, transparent));
}

.load-more-hint {
  opacity: 0.85;
}

.load-more-text {
  white-space: nowrap;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-24px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Timeline Node */
.timeline-node {
  position: absolute;
  left: 34px;
  top: 30px;
  z-index: 10;
}

.node-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-accent) 35%, var(--color-surface)),
    0 2px 8px color-mix(in srgb, var(--color-accent-strong) 35%, transparent),
    0 0 12px color-mix(in srgb, var(--color-accent) 40%, transparent);
  position: relative;
  z-index: 2;
  animation: dotAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  will-change: transform, box-shadow;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.note-item:hover .node-dot {
  transform: scale(1.08);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-accent) 38%, var(--color-warning-light)),
    0 2px 8px color-mix(in srgb, var(--color-accent-strong) 40%, transparent),
    0 0 16px color-mix(in srgb, var(--color-accent) 45%, transparent);
}

@keyframes dotAppear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

 .node-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid color-mix(
      in srgb,
      var(--color-accent) 25%,
      transparent
    );
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  will-change: transform, opacity;
  pointer-events: none;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.note-item:hover .node-ring {
  width: 36px;
  height: 36px;
  border-width: 2.2px;
  border-color: color-mix(
    in srgb,
    var(--color-accent) 28%,
    transparent
  );
  animation-duration: 2.4s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* Note Card */
.note-card-wrapper {
  flex: 1;
  padding-left: 80px;
  padding-top: 4px;
  padding-bottom: 4px;
  transition: padding-left 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: visible;
}

.note-card-wrapper.grid-card-wrapper {
  padding-left: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.note-card-wrapper::before {
  content: '';
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 14%, transparent) 20%,
    color-mix(in srgb, var(--color-accent) 18%, transparent) 50%,
    color-mix(in srgb, var(--color-accent) 14%, transparent) 80%,
    transparent
  );
  opacity: 0;
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.note-item:hover .note-card-wrapper::before {
  opacity: 1;
}

/* Loading State */
.loading-state {
  padding: 40px 0;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-note {
  position: relative;
  display: flex;
  align-items: flex-start;
  animation: skeletonPulse 2s ease-in-out infinite;
  will-change: opacity;
  opacity: 0;
  animation: skeletonFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
             skeletonPulse 2s ease-in-out infinite 0.5s;
}

.skeleton-timeline-node {
  position: absolute;
  left: 34px;
  top: 36px;
  z-index: 10;
}

.skeleton-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(90deg, 
    color-mix(in srgb, var(--color-surface-muted) 95%, transparent) 25%, 
    color-mix(in srgb, var(--text-primary) 4%, var(--color-surface)) 50%, 
    color-mix(in srgb, var(--color-surface-muted) 95%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-card {
  flex: 1;
  padding-left: 80px;
  background: color-mix(
    in srgb,
    var(--color-surface) 96%,
    #000000
  );
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid var(--color-border-subtle);
  padding: 24px;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--text-primary) 4%, transparent);
}

.skeleton-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.skeleton-date-badge {
  flex-shrink: 0;
  width: 72px;
  height: 88px;
  border-radius: 14px;
  background: linear-gradient(90deg, 
    color-mix(in srgb, var(--color-surface-muted) 98%, transparent) 25%, 
    color-mix(in srgb, var(--text-primary) 3%, var(--color-surface)) 50%, 
    color-mix(in srgb, var(--color-surface-muted) 98%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  border-radius: 6px;
  background: linear-gradient(90deg, 
    color-mix(in srgb, var(--text-primary) 4%, var(--color-surface)) 25%, 
    color-mix(in srgb, var(--text-primary) 6%, var(--color-surface)) 50%, 
    color-mix(in srgb, var(--text-primary) 4%, var(--color-surface)) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-text {
  height: 16px;
  width: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, 
    color-mix(in srgb, var(--color-surface-muted) 98%, transparent) 25%, 
    color-mix(in srgb, var(--text-primary) 3%, var(--color-surface)) 50%, 
    color-mix(in srgb, var(--color-surface-muted) 98%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-text.short {
  width: 75%;
}

.skeleton-note:nth-child(1) { animation-delay: 0s; }
.skeleton-note:nth-child(2) { animation-delay: 0.1s; }
.skeleton-note:nth-child(3) { animation-delay: 0.2s; }
.skeleton-note:nth-child(4) { animation-delay: 0.3s; }
.skeleton-note:nth-child(5) { animation-delay: 0.4s; }

@keyframes skeletonFadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeletonPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.65;
  }
}

@keyframes skeletonShimmer {
  0% {
    background-position: 200% 0;
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    background-position: -200% 0;
    opacity: 1;
  }
}

.loading-spinner {
  width: 48px;
  height: 48px;
  color: var(--color-accent);
  animation: spin 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  will-change: transform;
}

.loading-state span {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-body);
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border-radius: var(--radius-3xl, 28px);
  border: 1px solid var(--glass-border);
  padding: 96px 48px;
  text-align: center;
  box-shadow: var(--glass-shadow);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent) 8%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.empty-state:hover::before {
  opacity: 1;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.empty-state:hover {
  box-shadow: var(
    --state-accent-soft-shadow,
    0 16px 48px color-mix(in srgb, var(--text-primary) 10%, transparent),
    0 4px 12px color-mix(in srgb, var(--color-accent) 8%, transparent)
  );
  transform: translateY(-6px) scale(1.01);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  background: color-mix(in srgb, var(--color-surface) 99%, #ffffff);
}

.empty-illustration {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 40px;
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--color-accent) 15%, transparent));
}

.empty-bg {
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-palette-3) 40%, var(--color-palette-5)),
    color-mix(in srgb, var(--color-palette-2) 30%, var(--color-palette-4))
  );
  transform: rotate(-6deg);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.empty-state:hover .empty-bg {
  transform: rotate(-4deg) scale(1.02);
}

.empty-icon {
  position: relative;
  width: 64px;
  height: 64px;
  color: var(--color-palette-2);
  margin-top: 38px;
  margin-left: 38px;
  animation: iconFloat 3s ease-in-out infinite;
  animation-delay: 0.3s;
  filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--color-palette-2) 30%, transparent));
  transition: all 0.3s ease;
  z-index: 1;
}

.empty-state:hover .empty-icon {
  transform: translateY(-4px) rotate(2deg) scale(1.05);
  filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--color-palette-2) 40%, transparent));
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-4px) rotate(2deg);
  }
}

.empty-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-palette-1);
  margin-bottom: 16px;
  letter-spacing: -0.03em;
  background: linear-gradient(
    135deg,
    var(--color-palette-1) 0%,
    color-mix(in srgb, var(--color-palette-2) 30%, var(--color-palette-1)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
}

.empty-text {
  font-size: 17px;
  color: var(--color-palette-2);
  margin-bottom: 32px;
  line-height: 1.7;
  animation: textFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards;
}

@keyframes titleFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes textFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-hint {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-palette-3) 25%, transparent),
    color-mix(in srgb, var(--color-palette-4) 20%, transparent)
  );
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-palette-2);
  margin-top: 8px;
}

.hint-icon {
  width: 18px;
  height: 18px;
}

.empty-shortcuts {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-palette-2);
  opacity: 0.8;
  margin-top: 4px;
}

.empty-shortcuts kbd {
  display: inline-block;
  padding: 3px 7px;
  background: color-mix(in srgb, var(--color-palette-3) 30%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 40%, transparent);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
  color: var(--color-palette-1);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-palette-1) 10%, transparent);
}

/* List Transitions */
.list-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-32px) scale(0.96);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(32px) scale(0.96);
}

.list-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Fade Transition */
.fade-enter-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

 /* Responsive */
@media (max-width: 768px) {
  .timeline-header {
    margin-bottom: 20px;
  }
  
  .header-content {
    padding: 12px 16px;
  }
  
  .header-title {
    font-size: 16px;
  }
  
  .note-count {
    font-size: 12px;
    padding: 4px 10px;
  }
  
  .view-toggle-group {
    gap: 6px;
  }
  
  .view-toggle-btn {
    padding: 8px 12px;
  }
  
  .view-toggle-icon {
    width: 16px;
    height: 16px;
  }
  
  .timeline-line {
    left: 24px;
    top: 70px;
  }
  
  .timeline-node {
    left: 14px;
    top: 32px;
  }
  
  .node-dot {
    width: 18px;
    height: 18px;
  }
  
  .node-ring {
    width: 28px;
    height: 28px;
  }
  
  .note-card-wrapper {
    padding-left: 60px;
  }
  
  .empty-state {
    padding: 60px 24px;
    border-radius: 20px;
  }
  
  .empty-illustration {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
  }
  
  .empty-icon {
    width: 48px;
    height: 48px;
    margin-top: 26px;
    margin-left: 26px;
  }
  
  .empty-title {
    font-size: 24px;
  }
  
  .empty-text {
    font-size: 14px;
  }
  
  /* Grid View - Tablet */
  .notes-list.grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding-right: 8px;
    padding-bottom: 24px;
  }
  
  .loading-state {
    padding: 20px 0;
  }
  
  .skeleton-container {
    padding: 20px 0;
  }
}

@media (max-width: 480px) {
  .timeline-header {
    margin-bottom: 16px;
  }
  
  .header-content {
    padding: 10px 12px;
    border-radius: 12px;
  }
  
  .header-title {
    font-size: 15px;
    gap: 8px;
  }
  
  .header-icon {
    width: 18px;
    height: 18px;
  }
  
  .note-count {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .view-toggle-group {
    gap: 4px;
  }
  
  .view-toggle-btn {
    padding: 6px 10px;
  }
  
  .view-toggle-icon {
    width: 14px;
    height: 14px;
  }
  
  /* Grid View - Mobile */
  .notes-list.grid {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    gap: 12px;
    padding-right: 0;
    padding-bottom: 24px;
  }
  
  .note-item.grid-item {
    margin-top: 0;
  }
  
  .timeline-line {
    left: 20px;
    top: 65px;
  }
  
  .timeline-node {
    left: 12px;
    top: 30px;
  }
  
  .node-dot {
    width: 16px;
    height: 16px;
  }
  
  .node-ring {
    width: 24px;
    height: 24px;
  }
  
  .note-card-wrapper {
    padding-left: 48px;
  }
  
  .empty-state {
    padding: 48px 20px;
    border-radius: 16px;
  }
  
  .empty-illustration {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }
  
  .empty-icon {
    width: 40px;
    height: 40px;
    margin-top: 24px;
    margin-left: 24px;
  }
  
  .empty-title {
    font-size: 20px;
    margin-bottom: 12px;
  }
  
  .empty-text {
    font-size: 13px;
  }
  
  .empty-hint {
    font-size: 12px;
  }
  
  .empty-shortcuts {
    flex-direction: column;
    gap: 4px;
  }
  
  .empty-shortcuts kbd {
    font-size: 10px;
    padding: 2px 4px;
  }
  
  .loading-state {
    padding: 16px 0;
  }
  
  .skeleton-container {
    padding: 16px 0;
  }
  
  .skeleton-header {
    gap: 10px;
  }
  
  .skeleton-date-badge {
    width: 50px;
    height: 60px;
  }
  
  .skeleton-title {
    height: 18px;
  }
  
  .skeleton-text {
    height: 12px;
  }
}
</style>
