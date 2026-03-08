<template>
   <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">
            <Feather class="logo-feather" />
        </div>
          <div class="logo-text">
            <span class="logo-panda">Panda</span>
            <span class="logo-note">Note</span>
          </div>
        </div>

        <!-- Search with Combobox -->
        <Combobox v-model="selectedSearchNote" @update:modelValue="onSearchSelect" nullable>
          <div class="search-container">
            <Search class="search-icon" />
              <ComboboxInput 
                class="search-input"
                :placeholder="t('search.placeholder')"
                :displayValue="() => searchQuery"
                @change="searchQuery = $event.target.value"
                @keydown.escape="searchQuery = ''; highlightedIndex = -1; $event.target.blur()"
                @keydown.enter.prevent="handleSearchEnter"
                @keydown.arrowdown.prevent="navigateResults('down')"
                @keydown.arrowup.prevent="navigateResults('up')"
                :aria-label="t('search.aria')"
                :aria-activedescendant="highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined"
              />
                <button 
                  v-if="searchQuery" 
                  class="search-clear"
                  @click="searchQuery = ''"
                  :aria-label="t('search.clear')"
                  type="button"
                >
                  <X class="clear-icon" aria-hidden="true" />
                </button>
            <kbd class="search-shortcut">⌘K</kbd>
            
            <TransitionRoot
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ComboboxOptions v-if="searchQuery === '' && searchHistory.length > 0" class="search-results">
                <div class="search-history-section">
                  <div class="search-history-header">
                    <Clock class="history-icon" />
                    <span class="history-title">搜索历史</span>
                    <button 
                      v-if="searchHistory.length > 0"
                      @click="clearSearchHistory"
                      class="history-clear"
                      :aria-label="t('search.clearHistory')"
                    >
                      <Trash2 class="clear-history-icon" />
                    </button>
                  </div>
                  <div
                    v-for="(item, index) in searchHistory"
                    :key="item"
                    class="search-history-item"
                    @click="searchQuery = item"
                  >
                    <Clock class="history-item-icon" />
                    <span class="history-item-text">{{ item }}</span>
                  </div>
                </div>
              </ComboboxOptions>
              
              <ComboboxOptions v-else-if="searchResults.length > 0 || searchLoading" class="search-results">
                <!-- FTS5 indicator -->
                <div v-if="noteStore.ftsEnabled" class="fts-indicator">
                  <Zap class="fts-icon" />
                  <span>{{ t('search.ftsLabel') }}</span>
                </div>
                
                <!-- Loading state -->
                <div v-if="searchLoading" class="search-loading">
                  <Loader2 class="loading-icon" />
                  <span>{{ t('search.loading') }}</span>
                </div>
                
                <!-- Results -->
                <ComboboxOption
                  v-for="(note, index) in searchResults"
                  :key="note.id"
                  :value="note"
                  v-slot="{ active }"
                  as="template"
                >
                  <li 
                    class="search-result-item" 
                    :class="{ active: active || highlightedIndex === index }" 
                    :id="`search-result-${index}`"
                  >
                    <div class="result-icon-wrapper">
                      <FileText v-if="note.type !== 'article'" class="result-icon" />
                      <FileText v-else class="result-icon article-icon" />
                      <span v-if="note.type === 'article'" class="result-type-badge">
                        {{ t('header.article') }}
                      </span>
                    </div>
                    <div class="result-content">
                      <span class="result-title">{{ note.title }}</span>
                      <span class="result-preview">{{ truncate(note.content, 60) }}</span>
                      <div v-if="note.tags && note.tags.length > 0" class="result-tags">
                        <Hash v-for="tag in note.tags.slice(0, 3)" :key="tag" class="result-tag" />
                        <span v-if="note.tags.length > 3" class="result-tag-more">+{{ note.tags.length - 3 }}</span>
                      </div>
                    </div>
                  </li>
                </ComboboxOption>
                
                <!-- No results -->
                <div v-if="!searchLoading && searchResults.length === 0 && searchQuery.length >= 2" class="no-results">
                  <Search class="no-results-icon" />
                  <p class="no-results-text">
                    {{ t('search.noResults') }}
                  </p>
                  <p class="no-results-hint">
                    {{ t('search.noResultsHint') }}
                  </p>
                </div>
                
                <!-- Search hint -->
                <div v-if="searchQuery.length === 1" class="search-hint">
                  {{ t('search.minCharsHint') }}
                </div>
              </ComboboxOptions>
            </TransitionRoot>
          </div>
        </Combobox>
        
        <div class="header-actions">
          <!-- Shortcuts Button -->
          <button 
            @click="showShortcutsModal = true" 
            class="btn-shortcuts"
            :aria-label="t('header.shortcuts')"
            :title="t('header.shortcutsWithShortcut')"
          >
            <Keyboard class="btn-icon" aria-hidden="true" />
          </button>

          <button
            @click="openDemoLab"
            class="btn-shortcuts"
            aria-label="打开风格实验室"
            title="风格实验室"
            type="button"
          >
            <Sparkles class="btn-icon" aria-hidden="true" />
          </button>
          
          <!-- Split Button: New Note -->
          <Menu as="div" class="split-button-wrapper">
            <div class="split-button">
              <button 
                @click="openCreateQuickNote" 
                class="split-button-main"
                :aria-label="t('header.newQuickNote')"
                :title="t('header.newQuickNoteWithShortcut')"
              >
                <Sparkles class="btn-icon" aria-hidden="true" />
                <span>{{ t('header.newNote') }}</span>
              </button>
              <MenuButton class="split-button-arrow">
                <ChevronDown class="arrow-icon" aria-hidden="true" />
              </MenuButton>
            </div>
            
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <MenuItems class="split-button-menu">
                <MenuItem v-slot="{ active }">
                  <button 
                    @click="openCreateQuickNote"
                    class="menu-item"
                    :class="{ active }"
                    :aria-label="t('header.newQuickNote')"
                  >
                    <Sparkles class="item-icon" aria-hidden="true" />
                    <div class="item-content">
                      <span class="item-title">{{ t('header.quickNote') }}</span>
                      <span class="item-desc">{{ t('header.quickNoteDesc') }}</span>
                    </div>
                    <kbd class="item-shortcut">N</kbd>
                  </button>
                </MenuItem>
                
                <div class="menu-divider" />
                
                <MenuItem v-slot="{ active }">
                  <button 
                    @click="openCreateArticle"
                    class="menu-item"
                    :class="{ active }"
                    :aria-label="t('header.newArticle')"
                    type="button"
                  >
                    <FileText class="item-icon" aria-hidden="true" />
                    <div class="item-content">
                      <span class="item-title">{{ t('header.article') }}</span>
                      <span class="item-desc">{{ t('header.articleDesc') }}</span>
                    </div>
                    <kbd class="item-shortcut">⇧N</kbd>
                  </button>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
          
          <button 
            @click="openSettingsModal" 
            class="btn-settings"
            :aria-label="t('header.openSettings')"
            :title="t('header.openSettingsWithShortcut')"
          >
            <Settings class="btn-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="main">
      <div class="main-content">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-inner">
            
            <!-- Filter - Tiled Mode -->
            <div class="sidebar-section">
              <h2 class="section-title">{{ t('sidebar.filterTitle') }}</h2>
              <div class="filter-tiles">
            <button 
              v-for="option in filterOptions" 
              :key="option.value"
              class="filter-tile"
              :class="{ active: selectedFilter.value === option.value }"
              @click="selectedFilter = option"
              :aria-label="option.label"
              :aria-pressed="selectedFilter.value === option.value"
            >
                  <component :is="option.icon" class="filter-tile-icon" />
                  <span class="filter-tile-label">{{ option.label }}</span>
                  <Check v-if="selectedFilter.value === option.value" class="filter-tile-check" />
            </button>
              </div>
            </div>

            <!-- Sort Options -->
            <div class="sidebar-section">
              <h2 class="section-title">{{ t('sidebar.sortTitle') }}</h2>
              <div class="sort-options">
                <select 
                  v-model="noteStore.sortOption" 
                  class="sort-select"
                  @change="handleSortChange"
                  :aria-label="t('sidebar.sortAria')"
                >
                  <option value="date-desc">最新创建</option>
                  <option value="date-asc">最早创建</option>
                  <option value="title-asc">标题 A-Z</option>
                  <option value="title-desc">标题 Z-A</option>
                  <option value="tags-desc">标签数最多</option>
                  <option value="tags-asc">标签数最少</option>
                </select>
                <ArrowUpDown class="sort-icon" />
              </div>
            </div>

            <!-- Tags -->
            <div class="sidebar-section">
              <div class="tags-header">
                <h2 class="section-title">{{ t('sidebar.tagsTitle') }}</h2>
                <span v-if="noteStore.tagsWithCount.length > 0" class="tags-count">({{ noteStore.tagsWithCount.length }})</span>
              </div>
              
              <!-- Tag Search -->
              <div v-if="allTags.length > 0" class="tag-search">
                <Search class="tag-search-icon" />
                <input 
                  v-model="tagSearchQuery"
                  type="text"
                  class="tag-search-input"
                  :placeholder="t('sidebar.searchTagsPlaceholder')"
                  @input="onTagSearch"
                  :aria-label="t('sidebar.searchTagsAria')"
                />
                <button 
                  v-if="tagSearchQuery" 
                  class="tag-search-clear"
                  @click="tagSearchQuery = ''"
                  :aria-label="t('sidebar.clearTagSearchAria')"
                >
                  <X class="clear-icon" aria-hidden="true" />
                </button>
              </div>
              
              <!-- Tags List with Scroll -->
              <div class="tags-container" :class="{ 'has-many': filteredTagsInfo.length > 12 }">
                <div class="tags-list">
                  <button 
                    v-for="tagInfo in filteredTagsInfo" 
                    :key="tagInfo.name" 
                    @click="toggleTagFilter(tagInfo.name)"
                    @contextmenu="showTagContextMenu($event, tagInfo.name)"
                    class="tag-btn"
                    :class="{ active: selectedTags.includes(tagInfo.name) }"
                    :style="{ '--tag-color': getTagColor(tagInfo.name) }"
                    :aria-label="t('tags.filterTagAria', { tag: tagInfo.name })"
                    :aria-pressed="selectedTags.includes(tagInfo.name)"
                  >
                    <Hash class="tag-hash" />
                    <span 
                      class="tag-name" 
                      v-html="highlightTagMatch(tagInfo.name, tagSearchQueryDebounced)"
                    ></span>
                    <span class="tag-count">{{ tagInfo.count }}</span>
                  </button>
                  <div v-if="filteredTagsInfo.length === 0 && tagSearchQueryDebounced" class="no-tags">
                    <Search class="no-tags-icon" />
                    <span class="no-tags-text">
                      {{ t('sidebar.noTagsFound') }} "{{ tagSearchQueryDebounced }}"
                    </span>
                    <span class="no-tags-hint">{{ t('sidebar.noTagsHint') }}</span>
                  </div>
                  <span v-else-if="noteStore.tagsWithCount.length === 0" class="no-tags">
                    {{ t('sidebar.noTags') }}
                  </span>
                </div>
              </div>
            </div>
  
            <div class="sidebar-section">
              <h2 class="section-title">{{ t('sidebar.viewTitle') }}</h2>
              <div class="view-toggle">
          <button 
            class="view-btn"
            :class="{ active: !noteStore.archivedView }"
            @click="toggleArchived(false)"
            :aria-label="t('sidebar.viewActiveAria')"
            :aria-pressed="!noteStore.archivedView"
          >
                  <Layers class="view-btn-icon" />
                  <span class="view-btn-label">{{ t('sidebar.viewActive') }}</span>
                  <span class="view-btn-count">{{ noteStore.activeNotes.length }}</span>
          </button>
                <button 
                class="view-btn view-btn-archived"
                :class="{ active: noteStore.archivedView }"
                @click="toggleArchived(true)"
                :aria-label="t('sidebar.viewArchivedAria')"
                :aria-pressed="noteStore.archivedView"
                >
                  <Archive class="view-btn-icon" />
                  <span class="view-btn-label">{{ t('sidebar.viewArchived') }}</span>
                  <span class="view-btn-count">{{ archivedCount }}</span>
                </button>
              </div>
            </div>

            <!-- Stats -->
            <div class="sidebar-stats">
              <div class="stat-item">
                <span class="stat-label">{{ t('sidebar.totalNotes') }}</span>
                <span class="stat-value">{{ noteStore.stats?.total_notes || noteStore.notes.length }}</span>
              </div>
            </div>
          </div>
         </aside>

         <!-- Timeline Content -->
         <div class="timeline-content">
           <Timeline :selectedTags="selectedTags" :searchQuery="searchQuery" @edit="openEditModal" @archive="handleArchiveNote" @delete="handleDeleteNote" />
         </div>
       </div>
     </main>

     <!-- Shortcuts Modal -->
    <Teleport to="body">
      <TransitionRoot appear :show="showShortcutsModal" as="template">
        <Dialog as="div" @close="showShortcutsModal = false" class="shortcuts-dialog" style="z-index: 999999; position: fixed; inset: 0;">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div class="shortcuts-backdrop" />
          </TransitionChild>

          <div class="shortcuts-wrapper">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95 translate-y-4"
              enter-to="opacity-100 scale-100 translate-y-0"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100 translate-y-0"
              leave-to="opacity-0 scale-95 translate-y-4"
            >
              <DialogPanel class="modal-panel">
                <!-- Header -->
                <div class="modal-header">
                  <div class="modal-title-wrapper">
                    <div class="modal-icon">
                      <Keyboard class="title-icon" />
                    </div>
                    <DialogTitle as="h2" class="modal-title">
                      键盘快捷键
                    </DialogTitle>
                  </div>
                  <button
                    @click="showShortcutsModal = false"
                    class="modal-close"
                    aria-label="关闭快捷键面板"
                    type="button"
                  >
                    <X class="close-icon" aria-hidden="true" />
                  </button>
                </div>

                <!-- Content -->
                <div class="shortcuts-content">
                  <div class="shortcuts-grid">
                    <div 
                      v-for="shortcut in shortcuts" 
                      :key="shortcut.key"
                      class="shortcut-card"
                    >
                      <div class="shortcut-key">
                        <kbd class="kbd-key">{{ shortcut.key }}</kbd>
                      </div>
                      <div class="shortcut-description">
                        {{ shortcut.description }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Hint -->
                  <div class="shortcuts-hint">
                    <Info class="hint-icon" />
                    <span>提示：按 <kbd class="kbd-hint">?</kbd> 可以随时打开此面板</span>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </TransitionRoot>
    </Teleport>

    <!-- Settings Modal -->
    <Teleport to="body">
      <TransitionRoot appear :show="showSettingsModal" as="template">
        <Dialog as="div" @close="closeSettingsModal" class="settings-dialog">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div class="settings-backdrop" />
          </TransitionChild>

          <div class="settings-wrapper">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 translate-x-full"
              enter-to="opacity-100 translate-x-0"
              leave="duration-200 ease-in"
              leave-from="opacity-100 translate-x-0"
              leave-to="opacity-0 translate-x-full"
            >
              <DialogPanel class="settings-panel">
                <SettingsPanel @close="closeSettingsModal" />
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </TransitionRoot>
    </Teleport>

    <!-- Keyboard Shortcut Hint -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div class="keyboard-hint" v-if="showKeyboardHint">
        <span v-html="keyboardHintHtml"></span>
      </div>
    </Transition>
  
  </div>
</template>

<script setup lang="ts">
 import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
 import { useI18n } from 'vue-i18n';
 import { useRouter } from 'vue-router';
 import {
   Dialog,
   DialogPanel,
   DialogTitle,
   TransitionRoot,
   TransitionChild,
   Combobox,
   ComboboxInput,
   ComboboxOptions,
   ComboboxOption,
   Menu,
   MenuButton,
   MenuItems,
   MenuItem,
 } from '@headlessui/vue';
 import Timeline from '../components/Timeline.vue';
 import ConfirmDialog from '../components/ConfirmDialog.vue';
 import Toast from '../components/Toast.vue';
 import SettingsPanel from '../components/SettingsPanel.vue';
 import { useNoteStore } from '../stores/noteStore';
 import { useSettingsStore } from '../stores/settingsStore';
 import type { Note, CreateNoteRequest } from '../types';
import { 
  Plus, 
  Feather,
  Layers,
  Calendar,
  CalendarDays,
  CalendarRange,
  Archive,
  X,
  Edit3,
  PenLine,
  Check,
  Loader2,
  Search,
  Hash,
  FileText,
  Zap,
  Settings,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Keyboard,
  Info,
  ArrowUpDown,
  Clock,
  Trash2
} from 'lucide-vue-next';

 const { t, d, n } = useI18n();
 const router = useRouter();
 const noteStore = useNoteStore();
 const settingsStore = useSettingsStore();

 const showSettingsModal = ref(false);
 const showShortcutsModal = ref(false);
const loading = ref(false);
const searchQuery = ref('');
const searchResults = ref<Note[]>([]);
const searchLoading = ref(false);
const selectedSearchNote = ref<Note | null>(null);
const highlightedIndex = ref(-1);
 const selectedTags = ref<string[]>([]);
 const tagSearchQuery = ref('');

 // 快捷键列表
 const shortcuts = [
   { key: 'N', description: '新建快速笔记', icon: 'Sparkles' },
   { key: '⇧ N', description: '新建文章', icon: 'FileText' },
   { key: '⌘ K / Ctrl K', description: '聚焦搜索框', icon: 'Search' },
   { key: '⌘ , / Ctrl ,', description: '打开设置', icon: 'Settings' },
   { key: 'G', description: '切换视图模式', icon: 'Layers' },
   { key: 'F', description: '聚焦标签搜索', icon: 'Hash' },
   { key: '/', description: '聚焦搜索框', icon: 'Search' },
   { key: '↑ / ↓', description: '搜索结果导航（搜索框中）', icon: 'ArrowUp' },
   { key: 'ESC', description: '关闭模态框/清空搜索', icon: 'X' },
 ];
const toastRef = ref<InstanceType<typeof Toast> | null>(null);
const showKeyboardHint = ref(false);
const searchDebounceTimer = ref<number | null>(null);
const tagSearchDebounceTimer = ref<number | null>(null);
const tagSearchQueryDebounced = ref('');

// 撤销队列 - 用于存储被删除的笔记，支持撤销操作
const deletedNotesQueue = ref<Array<{
  note: Note;
  timestamp: number;
}>>([]);

// 搜索历史记录
const searchHistory = ref<string[]>([]);
const MAX_SEARCH_HISTORY = 10;

// 标签颜色映射（存储到 localStorage）
const tagColors = ref<Map<string, string>>(new Map());
const defaultTagColors = [
  '#fbbf24', '#f59e0b', '#d97706', '#b45309',
  '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
  '#ec4899', '#db2777', '#be185d', '#9d174d',
  '#06b6d4', '#0891b2', '#0e7490', '#155e75',
  '#10b981', '#059669', '#047857', '#065f46',
  '#f87171', '#ef4444', '#dc2626', '#b91c1c'
];

function loadTagColors() {
  try {
    const saved = localStorage.getItem('panda-tag-colors');
    if (saved) {
      const colors = JSON.parse(saved);
      tagColors.value = new Map(Object.entries(colors));
    }
  } catch (e) {
    console.error('加载标签颜色失败:', e);
  }
}

function saveTagColors() {
  try {
    const obj = Object.fromEntries(tagColors.value);
    localStorage.setItem('panda-tag-colors', JSON.stringify(obj));
  } catch (e) {
    console.error('保存标签颜色失败:', e);
  }
}

function getTagColor(tagName: string): string {
  if (!tagColors.value.has(tagName)) {
    // 为标签分配一个随机颜色
    const index = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaultTagColors.length;
    const color = defaultTagColors[index];
    tagColors.value.set(tagName, color);
    saveTagColors();
  }
  return tagColors.value.get(tagName) || defaultTagColors[0];
}

function setTagColor(tagName: string, color: string) {
  tagColors.value.set(tagName, color);
  saveTagColors();
}

// 标签右键菜单
const tagContextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  tagName: string | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  tagName: null
});

function showTagContextMenu(event: MouseEvent, tagName: string) {
  event.preventDefault();
  event.stopPropagation();
  tagContextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    tagName
  };
}

function hideTagContextMenu() {
  tagContextMenu.value.visible = false;
  tagContextMenu.value.tagName = null;
}

function handleTagRename(newName: string) {
  const oldName = tagContextMenu.value.tagName;
  if (!oldName || !newName.trim()) return;
  
  // 这里需要实现重命名逻辑，暂略
  hideTagContextMenu();
  toastRef.value?.addToast(`标签 "${oldName}" 已重命名为 "${newName}"`, 'success');
}

function handleTagDelete() {
  const tagName = tagContextMenu.value.tagName;
  if (!tagName) return;
  
  // 这里需要实现删除逻辑，暂略
  hideTagContextMenu();
  toastRef.value?.addToast(`标签 "${tagName}" 已删除`, 'success');
}

const filterOptions = [
  { value: 'all', label: t('sidebar.filterAll'), icon: Layers },
  { value: 'today', label: t('sidebar.filterToday'), icon: Calendar },
  { value: 'week', label: t('sidebar.filterWeek'), icon: CalendarDays },
  { value: 'month', label: t('sidebar.filterMonth'), icon: CalendarRange }
];

const selectedFilter = ref(filterOptions[0]);

// Watch filter changes and reload notes from backend
watch(selectedFilter, async (newFilter) => {
  await noteStore.loadFilteredNotes({
    filter: newFilter.value as 'all' | 'today' | 'week' | 'month',
    tags: selectedTags.value,
    archived: noteStore.archivedView
  });
});

// Watch selected tags and reload notes
watch(selectedTags, async (newTags) => {
  await noteStore.loadFilteredNotes({
    filter: selectedFilter.value.value as 'all' | 'today' | 'week' | 'month',
    tags: newTags,
    archived: noteStore.archivedView
  });
}, { deep: true });

// Confirm Dialog State
const confirmDialog = ref({
  visible: false,
  title: '',
  message: '',
  type: 'danger' as 'info' | 'warning' | 'danger',
  confirmText: t('common.confirm'),
  loading: false,
  action: null as (() => Promise<void>) | null
});

// Use tags with counts from backend (sorted by frequency)
const allTags = computed(() => {
  return noteStore.tagsWithCount.map(t => t.name);
});

// Calculate tag match score for sorting
function calculateTagMatchScore(tagName: string, query: string): number {
  const tagLower = tagName.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (tagLower === queryLower) {
    return 100;
  }
  
  if (tagLower.startsWith(queryLower)) {
    return 80;
  }
  
  if (tagLower.includes(queryLower)) {
    const index = tagLower.indexOf(queryLower);
    return 60 - index;
  }
  
  return 0;
}

// Filter tags based on search query with smart matching
const filteredTags = computed(() => {
  if (!tagSearchQueryDebounced.value) {
    return allTags.value;
  }
  const query = tagSearchQueryDebounced.value.toLowerCase().trim();
  if (!query) {
    return allTags.value;
  }
  
  return allTags.value
    .filter(tag => {
      const tagLower = tag.toLowerCase();
      return tagLower.includes(query);
    })
    .sort((a, b) => {
      const scoreA = calculateTagMatchScore(a, query);
      const scoreB = calculateTagMatchScore(b, query);
      return scoreB - scoreA;
    });
});

// Filter tags info (with counts) based on search query with smart matching and sorting
const filteredTagsInfo = computed(() => {
  if (!tagSearchQueryDebounced.value) {
    return noteStore.tagsWithCount;
  }
  const query = tagSearchQueryDebounced.value.toLowerCase().trim();
  if (!query) {
    return noteStore.tagsWithCount;
  }
  
  return noteStore.tagsWithCount
    .filter(t => {
      const tagLower = t.name.toLowerCase();
      return tagLower.includes(query);
    })
    .sort((a, b) => {
      const scoreA = calculateTagMatchScore(a.name, query);
      const scoreB = calculateTagMatchScore(b.name, query);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return b.count - a.count;
    });
});

// Highlight matching text in tag name
function highlightTagMatch(tagName: string, query: string): string {
  if (!query || !query.trim()) {
    return tagName;
  }
  const queryLower = query.toLowerCase().trim();
  const tagLower = tagName.toLowerCase();
  const index = tagLower.indexOf(queryLower);
  
  if (index === -1) {
    return tagName;
  }
  
  const before = tagName.substring(0, index);
  const match = tagName.substring(index, index + query.length);
  const after = tagName.substring(index + query.length);
  
  return `${before}<mark class="tag-highlight">${match}</mark>${after}`;
}

// Use stats from backend for accurate archived count
const archivedCount = computed(() => noteStore.stats?.archived_notes ?? 0);

const weeklyCount = computed(() => {
  // Use stats from backend if available
  if (noteStore.stats) {
    return noteStore.stats.weekly_count;
  }
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return noteStore.notes.filter(n => new Date(n.created_at) > oneWeekAgo).length;
});

 const keyboardHintHtml = computed(() => t('keyboardHint.hint'));

 // Watch search query and call backend FTS5 search
watch(searchQuery, (newQuery) => {
  // Clear previous timer
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
  
  if (!newQuery || newQuery.length < 2) {
    searchResults.value = [];
    highlightedIndex.value = -1;
    return;
  }
  
  // Debounce search by 300ms
  searchDebounceTimer.value = window.setTimeout(async () => {
    searchLoading.value = true;
    try {
      const result = await noteStore.searchNotes(newQuery, 8);
      if (result && result.notes) {
        searchResults.value = result.notes.filter((n): n is Note => n !== null);
  } else {
        searchResults.value = [];
      }
    } catch (e) {
      console.error('搜索失败:', e);
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 300);
});

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

function onSearchSelect(note: Note | null) {
  if (note) {
    // 添加到搜索历史
    addToSearchHistory(searchQuery.value);
    openEditModal(note);
    searchQuery.value = '';
    selectedSearchNote.value = null;
    highlightedIndex.value = -1;
  }
}

function toggleTagFilter(tag: string) {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(index, 1);
  }
}

// Watch tag search query with debounce
watch(tagSearchQuery, (newQuery) => {
  if (tagSearchDebounceTimer.value) {
    clearTimeout(tagSearchDebounceTimer.value);
  }
  
  tagSearchDebounceTimer.value = window.setTimeout(() => {
    tagSearchQueryDebounced.value = newQuery;
  }, 200);
}, { immediate: true });

function onTagSearch() {
  // Tag search is handled by watch with debounce
}

function handleSearchEnter() {
  if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
    const selectedResult = searchResults.value[highlightedIndex.value];
    openEditModal(selectedResult);
    searchQuery.value = '';
    selectedSearchNote.value = null;
    highlightedIndex.value = -1;
  } else if (searchResults.value.length > 0) {
    const firstResult = searchResults.value[0];
    openEditModal(firstResult);
    searchQuery.value = '';
    selectedSearchNote.value = null;
    highlightedIndex.value = -1;
  }
}

function navigateResults(direction: 'up' | 'down') {
  if (searchResults.value.length === 0) return;
  
  if (direction === 'down') {
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, searchResults.value.length - 1);
  } else {
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
  }
  
  if (highlightedIndex.value >= 0) {
    const resultElement = document.getElementById(`search-result-${highlightedIndex.value}`);
    if (resultElement) {
      resultElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

async function toggleArchived(value: boolean) {
  await noteStore.loadFilteredNotes({
    filter: selectedFilter.value.value as 'all' | 'today' | 'week' | 'month',
    tags: selectedTags.value,
    archived: value
  });
}

 function openCreateQuickNote() {
   router.push('/notes/new');
 }

 function openCreateArticle() {
   router.push('/notes/new/article');
 }

 function openCreateModal() {
   openCreateQuickNote();
 }

 function openEditModal(note: Note) {
   router.push(`/notes/${note.id}/edit`);
 }

 function openDetailModal(note: Note) {
   openEditModal(note);
 }
 
 function clearSearchHistory() {
  searchHistory.value = [];
  saveSearchHistory();
  toastRef.value?.addToast('搜索历史已清除', 'info');
}

function loadSearchHistory() {
  try {
    const saved = localStorage.getItem('panda-search-history');
    if (saved) {
      searchHistory.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载搜索历史失败:', e);
  }
}

function saveSearchHistory() {
  try {
    localStorage.setItem('panda-search-history', JSON.stringify(searchHistory.value));
  } catch (e) {
    console.error('保存搜索历史失败:', e);
  }
}

function addToSearchHistory(query: string) {
  if (!query || query.trim().length < 2) return;
  
  const trimmedQuery = query.trim();
  const existingIndex = searchHistory.value.indexOf(trimmedQuery);
  
  if (existingIndex !== -1) {
    searchHistory.value.splice(existingIndex, 1);
  }
  
  searchHistory.value.unshift(trimmedQuery);
  
  if (searchHistory.value.length > MAX_SEARCH_HISTORY) {
    searchHistory.value = searchHistory.value.slice(0, MAX_SEARCH_HISTORY);
  }
  
  saveSearchHistory();
}

function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  toastRef.value?.addToast(message, type);
}

function openSettingsModal() {
  showSettingsModal.value = true;
}

function openDemoLab() {
  router.push('/demo/styles');
}

function closeSettingsModal() {
  showSettingsModal.value = false;
}

function handleSortChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  noteStore.setSortOption(target.value as 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'tags-asc' | 'tags-desc');
 }

 async function handleArchiveNote(id: number) {
  const note = noteStore.notes.find(n => n.id === id);
  if (note) {
    const action = note.is_archived ? 'unarchive' : 'archive';
    await noteStore.archiveNote(id, action === 'archive');
    showToast(action === 'archive' ? t('toast.noteArchived') : t('toast.noteUnarchived'), 'success');
  }
}

async function handleDeleteNote(id: number) {
  const note = noteStore.notes.find(n => n.id === id);
  if (note) {
    deletedNotesQueue.value.push({
      note: { ...note },
      timestamp: Date.now()
    });
    await noteStore.deleteNote(id);
    
    // 撤销队列最多保存 10 条记录
    if (deletedNotesQueue.value.length > 10) {
      deletedNotesQueue.value.shift();
    }
    
    toastRef.value?.addToast('笔记已删除', 'info', 5000, {
      undoAction: {
        label: '撤销',
        action: () => undoDeleteNote()
      }
    });
  }
}

async function undoDeleteNote() {
  if (deletedNotesQueue.value.length === 0) return;
  
  const lastDeleted = deletedNotesQueue.value.pop();
  if (!lastDeleted) return;
  
  try {
    await noteStore.createNote({
      title: lastDeleted.note.title,
      content: lastDeleted.note.content,
      tags: lastDeleted.note.tags,
      type: lastDeleted.note.type
    });
    toastRef.value?.addToast('已恢复笔记', 'success');
  } catch (error) {
    toastRef.value?.addToast('恢复笔记失败', 'error');
  }
 }

 async function onConfirmAction() {
  if (confirmDialog.value.action) {
    confirmDialog.value.loading = true;
    try {
      await confirmDialog.value.action();
    } finally {
      confirmDialog.value.loading = false;
      confirmDialog.value.visible = false;
    }
  }
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Don't trigger shortcuts when typing in inputs or comboboxes
  const target = e.target as HTMLElement;
  if (target instanceof HTMLInputElement || 
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable ||
      target.closest('[role="combobox"]')) {
    // Allow Escape to blur input
    if (e.key === 'Escape') {
      target.blur();
      // Clear search if in search input
      if (target.classList.contains('search-input')) {
        searchQuery.value = '';
      }
    }
    return;
  }

  // ⌘K or Ctrl+K for search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // ⌘, or Ctrl+, for settings
  if ((e.metaKey || e.ctrlKey) && e.key === ',') {
    e.preventDefault();
    openSettingsModal();
  }
  
   // N for quick note, Shift+N for article
   if (e.key === 'n' || e.key === 'N') {
     if (!showSettingsModal.value) {
       e.preventDefault();
       if (e.shiftKey) {
         openCreateArticle();
       } else {
         openCreateQuickNote();
       }
     }
   }
  
   // G to toggle view mode (grid/timeline)
   if (e.key === 'g' || e.key === 'G') {
     if (!showSettingsModal.value) {
       e.preventDefault();
       const timelineComponent = document.querySelector('[data-component="timeline"]') as any;
       if (timelineComponent && timelineComponent.toggleViewMode) {
         timelineComponent.toggleViewMode();
       }
     }
   }
  
   // F to focus on tag search in sidebar
   if (e.key === 'f' || e.key === 'F') {
     if (!showSettingsModal.value) {
       e.preventDefault();
       const tagSearchInput = document.querySelector('.tag-search-input') as HTMLInputElement;
       if (tagSearchInput) {
         tagSearchInput.focus();
       }
     }
   }

   // Escape to close modal
   if (e.key === 'Escape') {
     if (showSettingsModal.value) {
       closeSettingsModal();
     } else if (confirmDialog.value.visible) {
       confirmDialog.value.visible = false;
     } else if (searchQuery.value) {
       searchQuery.value = '';
       const searchInput = document.querySelector('.search-input') as HTMLInputElement;
       searchInput?.blur();
     }
   }

  // / key to focus search
  if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      searchInput?.focus();
    }
  }
  
  // ? key to show shortcuts
  if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      showShortcutsModal.value = true;
    }
  }
}

// Expose methods for child components
function showConfirmDialog(options: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  action: () => Promise<void>;
}) {
  confirmDialog.value = {
    visible: true,
    title: options.title,
    message: options.message,
    type: options.type || 'danger',
    confirmText: options.confirmText || t('common.confirm'),
    loading: false,
    action: options.action
  };
}

// Provide to child components
import { provide } from 'vue';
provide('showConfirmDialog', showConfirmDialog);
provide('showToast', showToast);

onMounted(async () => {
  // Load search history
  loadSearchHistory();
  
  // Load tag colors
  loadTagColors();
  
  // Check if FTS5 is enabled
  await noteStore.checkFTSEnabled();
  
  // Load notes
  await noteStore.loadNotes(false);
  
  // Load statistics and tags
  await Promise.all([
    noteStore.loadStats(),
    noteStore.loadTagsWithCount()
  ]);
  
  // Add keyboard listener
  window.addEventListener('keydown', handleKeydown);
  
  // Show keyboard hint briefly
  setTimeout(() => {
    showKeyboardHint.value = true;
    setTimeout(() => {
      showKeyboardHint.value = false;
    }, 5000);
  }, 2000);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  // Clear search debounce timer
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
  // Clear tag search debounce timer
  if (tagSearchDebounceTimer.value) {
    clearTimeout(tagSearchDebounceTimer.value);
  }
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 12px 32px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.header:hover .header-content {
  box-shadow: none;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.logo-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: color-mix(in srgb, #ffffff 30%, transparent);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.logo-icon:hover::before {
  width: 100%;
  height: 100%;
}

.logo-icon:hover {
  transform: scale(1.01);
  box-shadow: var(--shadow-sm);
}

.logo-feather {
  position: relative;
  z-index: 1;
}

.logo-feather {
  width: 22px;
  height: 22px;
  color: var(--color-on-accent, #ffffff);
}

.logo-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.logo-panda {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-palette-1);
  letter-spacing: -0.02em;
}

.logo-note {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-palette-2);
  letter-spacing: -0.02em;
}

/* Search with Combobox */
.search-container {
  max-width: 480px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-self: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  width: 18px;
  height: 18px;
  color: var(--color-palette-2);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 13px 100px 13px 50px;
  border-radius: var(--radius-lg, 16px);
  cursor: text;
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  color: var(--color-text-body);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, background, border-color, box-shadow;
  font-family: inherit;
}

.search-input:focus {
  background: var(--color-surface);
  border-color: var(--color-accent);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
  outline: none;
}

.search-input:hover:not(:focus) {
  background: var(--color-surface);
  border-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-clear {
  position: absolute;
  right: 56px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1;
  user-select: none;
  will-change: transform, background-color;
}

.search-clear:hover {
  background: var(
    --state-accent-soft-bg,
    color-mix(in srgb, var(--color-accent) 15%, transparent)
  );
  color: var(--color-accent-strong);
}

.search-clear:active {
  transform: none;
  background: color-mix(
    in srgb,
    var(--color-accent) 20%,
    transparent
  );
}

.clear-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
}

.search-shortcut {
  position: absolute;
  right: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--text-primary) 5%, var(--color-surface));
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  font-family: system-ui, sans-serif;
  z-index: 1;
  pointer-events: none;
  user-select: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-input:focus ~ .search-shortcut,
.search-container:focus-within .search-shortcut {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  color: var(--color-accent-strong);
}

/* Search Results Dropdown */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg), var(--shadow-inset-soft);
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
  animation: none;
}

@keyframes searchResultsSlideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  border-radius: 10px;
  margin: 2px 8px;
  position: relative;
  will-change: background-color;
}

.search-result-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  border-radius: 10px 0 0 10px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-result-item:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
}

.search-result-item:hover::before {
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  width: 3px;
}

.search-result-item.active {
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));
}

.search-result-item.active::before {
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  width: 3px;
}

.search-result-item:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 50%, transparent);
  outline-offset: 2px;
  border-radius: 10px;
}

.result-icon-wrapper {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent-strong);
  flex-shrink: 0;
  margin-top: 2px;
}

.result-icon.article-icon {
  color: var(--type-article);
}

.result-type-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  background: linear-gradient(135deg, var(--type-article), var(--type-article-strong));
  color: var(--color-on-accent);
  border-radius: 4px;
  line-height: 1;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--type-article) 30%, transparent);
}

.result-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

.result-tag {
  width: 12px;
  height: 12px;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.result-tag-more {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 600;
}

.result-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent-strong);
  flex-shrink: 0;
  margin-top: 2px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-body);
  margin-bottom: 4px;
}

.result-preview {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* FTS Indicator */
.fts-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-accent-strong);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 20%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 12%, transparent)
  );
  border-bottom: 1px solid var(--color-border-subtle);
}

.fts-icon {
  width: 12px;
  height: 12px;
}

/* Search Loading */
.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.loading-icon {
  width: 14px;
  height: 14px;
  animation: none;
  opacity: 0.6;
}

/* No Results */
.no-results {
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-results-icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-bottom: 8px;
}

.no-results-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-body);
  margin: 0;
}

.no-results-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
}

.search-hint {
  padding: 12px 20px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
  border-top: 1px solid var(--color-border-subtle);
}

/* Search History */
.search-history-section {
  padding: 12px 8px;
}

.search-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 12px;
  gap: 8px;
}

.history-icon {
  width: 14px;
  height: 14px;
  color: var(--color-accent-strong);
  flex-shrink: 0;
}

.history-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex: 1;
}

.history-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-muted);
}

.history-clear:hover {
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
  color: var(--color-text-body);
}

.clear-history-icon {
  width: 12px;
  height: 12px;
}

.search-history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 4px;
}

.search-history-item:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  transform: translateX(2px);
}

.search-history-item:active {
  transform: translateX(1px);
}

.history-item-icon {
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
  opacity: 0.6;
  flex-shrink: 0;
}

.history-item-text {
  font-size: 13px;
  color: var(--color-text-body);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* New Note Button */
.btn-new-note {
  padding: 12px 24px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    color-mix(in srgb, var(--color-accent) 70%, var(--color-accent-strong)) 50%,
    var(--color-accent-strong) 100%
  );
  color: var(--color-on-accent);
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px color-mix(
      in srgb,
      var(--color-accent-strong) 45%,
      transparent
    );
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
  user-select: none;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
}

.btn-new-note::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-on-accent) 30%, transparent), transparent);
  transition: left 0.5s ease;
}

.btn-new-note:hover {
  box-shadow: 0 6px 20px color-mix(
      in srgb,
      var(--color-accent-strong) 55%,
      transparent
    );
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-new-note:hover::before {
  left: 100%;
}

.btn-new-note:active {
  transform: translateY(0);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 6px 18px color-mix(
      in srgb,
      var(--color-accent-strong) 42%,
      transparent
    )
  );
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-new-note:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

/* Split Button */
.split-button-wrapper {
  position: relative;
}

.split-button {
  display: flex;
  align-items: center;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 14px color-mix(
      in srgb,
      var(--color-accent-strong) 45%,
      transparent
    );
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    color-mix(in srgb, var(--color-accent) 70%, var(--color-accent-strong)) 50%,
    var(--color-accent-strong) 100%
  );
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.split-button:hover {
  box-shadow: var(
    --state-accent-soft-shadow,
    0 8px 24px color-mix(
      in srgb,
      var(--color-accent-strong) 52%,
      transparent
    )
  );
  filter: brightness(1.05);
}

.split-button-main {
  padding: 12px 20px;
  background: transparent;
  color: var(--color-on-accent);
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  will-change: transform, background-color;
}

.split-button-main:hover {
  background: color-mix(in srgb, var(--color-on-accent) 22%, transparent);
  transform: translateY(-1px);
}

.split-button-main:active {
  background: color-mix(in srgb, var(--color-on-accent) 28%, transparent);
  transform: translateY(0) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.split-button-main:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-on-accent) 50%, transparent);
  outline-offset: -2px;
}

.split-button-arrow {
  padding: 12px 10px;
  background: color-mix(in srgb, var(--color-on-accent) 10%, transparent);
  border: none;
  border-left: 1px solid color-mix(in srgb, var(--color-on-accent) 20%, transparent);
  color: var(--color-on-accent);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  will-change: transform, background-color;
}

.split-button-arrow:hover {
  background: color-mix(in srgb, var(--color-on-accent) 25%, transparent);
  transform: translateY(-1px);
  border-left-color: color-mix(in srgb, var(--color-on-accent) 30%, transparent);
}

.split-button-arrow:active {
  background: color-mix(in srgb, var(--color-on-accent) 32%, transparent);
  transform: translateY(0) scale(0.95);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.split-button-arrow:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-on-accent) 50%, transparent);
  outline-offset: -2px;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.split-button-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 280px;
  background: color-mix(in srgb, var(--color-surface) 98%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  box-shadow: 0 10px 40px color-mix(in srgb, var(--text-primary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 45%, var(--color-palette-4));
  padding: 8px;
  z-index: 100;
  overflow: hidden;
  transform-origin: top right;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  user-select: none;
  will-change: transform, background-color;
  position: relative;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  border-radius: 12px 0 0 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-item:hover,
.menu-item.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 18%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 14%, transparent)
  );
  transform: translateX(4px);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 6px 18px color-mix(
      in srgb,
      var(--color-accent-strong) 30%,
      transparent
    )
  );
}

.menu-item:hover::before,
.menu-item.active::before {
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
}

.menu-item:active {
  transform: translateX(2px) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 50%, transparent);
  outline-offset: 2px;
}

.item-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent-strong);
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-body);
}

.item-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.item-shortcut {
  padding: 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--text-primary) 5%, var(--color-surface));
  font-size: 11px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
  color: var(--color-text-muted);
}

.menu-divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 4px 0;
}

.btn-settings {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--color-text-muted);
  box-shadow: var(--shadow-sm), var(--shadow-inset-soft);
  will-change: transform, box-shadow, background-color;
}

.btn-settings:hover {
  background: var(--color-surface);
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  color: var(--color-accent-strong);
  box-shadow: var(--shadow-md);
  transform: none;
}

.btn-settings:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-settings:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: end;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Main */
.main {
  padding-top: 88px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px;
  display: flex;
  gap: 40px;
  scroll-behavior: smooth;
}

/* Sidebar */
.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.sidebar-inner {
  position: sticky;
  top: 108px;
  background: var(--color-surface);
  border-radius: var(--radius-2xl, 24px);
  border: 1px solid var(--color-border-subtle);
  padding: var(--spacing-xl, 24px);
  box-shadow: var(--shadow-md), var(--shadow-inset-soft);
}

.sidebar-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin-bottom: 14px;
}

/* Filter Tiles */
.filter-tiles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  user-select: none;
  will-change: transform, box-shadow, border-color;
  position: relative;
  overflow: hidden;
}

.filter-tile::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  border-radius: 12px 0 0 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-tile:hover {
  background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
  box-shadow: var(--shadow-sm);
}

.filter-tile:hover::before {
  background: var(--color-accent);
}

.filter-tile:active {
  transform: none;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-tile.active {
  background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
  animation: none;
  transform: none;
}

@keyframes filterActive {
  0% { opacity: 0.9; }
  50% { opacity: 1; }
  100% { opacity: 1; }
}

.filter-tile-icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

.filter-tile:hover .filter-tile-icon {
  transform: scale(1.1);
}

.filter-tile.active .filter-tile-icon {
  color: var(--color-accent-strong);
}

.filter-tile-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-body);
  transition: all 0.2s ease;
}

.filter-tile.active .filter-tile-label {
  color: var(--color-accent-strong);
  font-weight: 600;
}

.filter-tile-check {
  width: 16px;
  height: 16px;
  color: var(--color-accent-strong);
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.8) rotate(-90deg);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

.filter-tile.active .filter-tile-check {
  opacity: 1;
  transform: scale(1) rotate(0deg);
  animation: checkPop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes checkPop {
  0% {
    transform: scale(0.5) rotate(-90deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.filter-tile:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

/* Tags */
.tags-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.tags-count {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Tag Search */
.tag-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-surface) 78%, transparent),
    color-mix(in srgb, var(--color-surface) 88%, transparent)
  );
  border-radius: 18px;
  padding: 10px 14px;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 
    0 2px 4px color-mix(in srgb, var(--text-primary) 2%, transparent),
    0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
  will-change: transform, box-shadow, background;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.tag-search:hover:not(:focus-within) {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-surface) 90%, transparent),
    color-mix(in srgb, var(--color-surface) 96%, transparent)
  );
  box-shadow: 
    0 4px 12px color-mix(in srgb, var(--text-primary) 4%, transparent),
    0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
  transform: translateY(-1px);
}

.tag-search:focus-within {
  background: linear-gradient(
    135deg,
    var(--color-surface),
    color-mix(in srgb, var(--color-surface) 98%, transparent)
  );
  box-shadow:
    0 6px 24px color-mix(
      in srgb,
      var(--color-accent-strong) 18%,
      transparent
    ),
    0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
  transform: translateY(-1px);
}

.tag-search-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-right: 10px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, color;
}

.tag-search:hover .tag-search-icon,
.tag-search:focus-within .tag-search-icon {
  color: var(--color-accent-strong);
  transform: scale(1.1);
}

.tag-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-body);
  padding: 0;
  line-height: 1.5;
  transition: all 0.2s ease;
  -webkit-appearance: none;
  appearance: none;
}

.tag-search-input:focus {
  outline: none;
  border: none;
  box-shadow: none;
}

.tag-search-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 400;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.tag-search-input:focus::placeholder {
  opacity: 0.5;
}

.tag-search-clear {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: color-mix(in srgb, var(--text-primary) 6%, var(--color-surface));
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;
  user-select: none;
  margin-left: 8px;
  will-change: transform, background-color, box-shadow;
  position: relative;
  overflow: hidden;
}

.tag-search-clear::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: color-mix(
    in srgb,
    var(--color-accent) 30%,
    transparent
  );
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.tag-search-clear:hover {
  background: var(
    --state-accent-soft-bg,
    color-mix(in srgb, var(--color-accent) 22%, transparent)
  );
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 2px 8px color-mix(
    in srgb,
    var(--color-accent-strong) 25%,
    transparent
  );
}

.tag-search-clear:hover::before {
  width: 100%;
  height: 100%;
}

.tag-search-clear:active {
  transform: scale(0.95) rotate(90deg);
  background: color-mix(
    in srgb,
    var(--color-accent) 35%,
    transparent
  );
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-search-clear .clear-icon {
  width: 13px;
  height: 13px;
  color: var(--color-text-muted);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
  will-change: transform, color;
}

.tag-search-clear:hover .clear-icon {
  color: var(--color-accent-strong);
  transform: scale(1.1);
}

/* Tags Container with Scroll */
.tags-container {
  max-height: none;
  transition: max-height 0.3s ease;
}

.tags-container.has-many {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Custom Scrollbar for Tags - Hidden */
.tags-container::-webkit-scrollbar {
  width: 0;
  display: none;
}

.tags-container::-webkit-scrollbar-track {
  display: none;
}

.tags-container::-webkit-scrollbar-thumb {
  display: none;
}

.tags-container::-webkit-scrollbar-thumb:hover {
  display: none;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 22px;
  font-size: 12px;
  font-weight: 600;
  background: color-mix(in srgb, var(--color-palette-1) 5%, var(--color-palette-5));
  color: var(--color-text-body);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
}

.tag-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  color: var(--color-accent-strong);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 4px 12px color-mix(in srgb, var(--color-accent) 15%, transparent),
    0 2px 4px color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.tag-btn:active {
  transform: translateY(0) scale(0.98);
}

.tag-btn.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--tag-color, var(--color-accent)) 22%, transparent),
    color-mix(in srgb, var(--tag-color, var(--color-accent-strong)) 18%, transparent)
  );
  border-color: color-mix(in srgb, var(--tag-color, var(--color-accent)) 32%, transparent);
  color: var(--tag-color, var(--color-accent-strong));
}

.tag-hash {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}

.tag-name {
  flex: 1;
}

.tag-count {
  padding: 2px 6px;
  background: color-mix(in srgb, var(--text-primary) 6%, var(--color-surface));
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  min-width: 20px;
  text-align: center;
  transition: all 0.15s ease;
}

.tag-btn:hover .tag-count {
  background: var(
    --state-accent-soft-bg,
    color-mix(in srgb, var(--color-accent) 20%, transparent)
  );
  color: var(--color-accent-strong);
}

.tag-btn.active .tag-count {
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  color: var(--color-on-accent);
  box-shadow: 0 1px 3px
    color-mix(in srgb, var(--color-accent-strong) 30%, transparent);
  animation: countPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes countPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

.tag-btn:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.no-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  text-align: center;
}

.no-tags-icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.no-tags-text {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.no-tags-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}

.tag-highlight {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 30%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 25%, transparent)
  );
  color: var(--color-accent-strong);
  font-weight: 700;
  padding: 0 2px;
  border-radius: 3px;
}

/* Sidebar Tags - Neutral Business Palette */
.tag-search {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  box-shadow: none;
}

.tag-search:hover:not(:focus-within),
.tag-search:focus-within {
  background: var(--color-surface);
  box-shadow: none;
  transform: none;
}

.tag-search-icon {
  color: var(--color-text-muted);
  transform: none;
}

.tag-search-clear {
  background: color-mix(in srgb, var(--text-primary) 4%, var(--color-surface));
  transform: none;
  box-shadow: none;
}

.tag-search-clear:hover,
.tag-search-clear:active {
  background: color-mix(in srgb, var(--text-primary) 6%, var(--color-surface));
  transform: none;
}

.tag-search-clear .clear-icon {
  color: var(--color-text-muted);
  transform: none;
}

.tag-btn {
  background: color-mix(in srgb, var(--text-primary) 4%, var(--color-surface));
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-body);
  box-shadow: none;
}

.tag-btn:hover {
  background: color-mix(in srgb, var(--text-primary) 6%, var(--color-surface));
  border-color: var(--color-border-subtle);
  color: var(--color-text-body);
  transform: none;
  box-shadow: none;
}

.tag-btn.active {
  background: color-mix(in srgb, var(--text-primary) 8%, var(--color-surface));
  border-color: color-mix(in srgb, var(--text-primary) 12%, transparent);
  color: var(--color-text-body);
}

.tag-count {
  background: color-mix(in srgb, var(--text-primary) 6%, var(--color-surface));
  color: var(--color-text-muted);
}

.tag-btn:hover .tag-count,
.tag-btn.active .tag-count {
  background: color-mix(in srgb, var(--text-primary) 10%, var(--color-surface));
  color: var(--color-text-body);
  box-shadow: none;
  animation: none;
}

/* View Toggle */
.view-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-surface) 60%, transparent);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.view-btn:hover {
  background: var(
    --state-surface-hover-bg,
    color-mix(in srgb, var(--color-surface) 95%, #000000)
  );
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  transform: none;
  box-shadow: var(--shadow-sm);
}

.view-btn:active {
  transform: translateY(0) scale(0.98);
}

.view-btn.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 20%, var(--color-surface)),
    color-mix(in srgb, var(--color-accent-strong) 18%, var(--color-surface))
  );
  border-color: var(--color-accent);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 6px 18px color-mix(
      in srgb,
      var(--color-accent-strong) 32%,
      transparent
    )
  );
}

.view-btn-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.view-btn.active .view-btn-icon {
  color: var(--color-accent-strong);
}

.view-btn-label {
  flex: 1;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.view-btn.active .view-btn-label {
  color: var(--color-accent-strong);
  font-weight: 600;
}

.view-btn-count {
  padding: 4px 10px;
  background: color-mix(in srgb, var(--text-primary) 5%, var(--color-surface));
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.view-btn.active .view-btn-count {
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  color: var(--color-on-accent);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 4px 12px color-mix(
      in srgb,
      var(--color-accent-strong) 36%,
      transparent
    )
  );
  animation: countBounce 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes countBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Archived View Button Special Style */
.view-btn-archived:hover {
  border-color: color-mix(in srgb, var(--text-primary) 30%, transparent);
}

.view-btn-archived.active {
  background: linear-gradient(135deg, var(--color-surface-muted), var(--color-surface));
  border-color: var(--color-text-muted);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--text-primary) 15%, transparent);
}

.view-btn-archived.active .view-btn-icon {
  color: var(--color-text-body);
}

.view-btn-archived.active .view-btn-label {
  color: var(--color-text-body);
}

.view-btn-archived.active .view-btn-count {
  background: linear-gradient(135deg, var(--color-text-muted), var(--color-text-body));
}

.view-btn:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

/* Sort Options */
.sort-options {
  position: relative;
}

.sort-select {
  width: 100%;
  padding: 12px 40px 12px 16px;
  background: color-mix(in srgb, var(--color-surface) 60%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-body);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  appearance: none;
  -webkit-appearance: none;
  font-family: inherit;
}

.sort-select:hover {
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  box-shadow: var(--shadow-sm);
}

.sort-select:focus {
  background: color-mix(in srgb, var(--color-surface) 98%, transparent);
  border-color: var(--color-accent);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent),
    var(--shadow-sm);
  outline: none;
}

.sort-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.sort-select:hover + .sort-icon {
  color: var(--color-accent-strong);
  transform: translateY(-50%) scale(1.1);
}

.sort-select:focus + .sort-icon {
  color: var(--color-accent);
}

/* Stats */
.sidebar-stats {
  padding-top: 24px;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-accent-strong);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-block;
}

.stat-item:hover .stat-value {
  transform: scale(1.1);
  color: color-mix(
    in srgb,
    var(--color-accent-strong) 92%,
    var(--color-text-body)
  );
}

.fts-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 16px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 24%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 18%, transparent)
  );
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent-strong);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: default;
  position: relative;
  overflow: hidden;
}

.fts-badge::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: color-mix(
    in srgb,
    var(--color-accent) 30%,
    transparent
  );
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.fts-badge:hover::before {
  width: 200%;
  height: 200%;
}

.fts-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(
      in srgb,
      var(--color-accent) 22%,
      transparent
    );
}

.fts-badge-icon {
  position: relative;
  z-index: 1;
  animation: zapPulse 2s ease-in-out infinite;
}

@keyframes zapPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.fts-badge-icon {
  width: 14px;
  height: 14px;
}

/* Content */
.content {
  flex: 1;
  min-width: 0;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

/* Active Filters */
.active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: color-mix(in srgb, var(--color-surface) 85%, transparent);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 45%, var(--color-palette-4));
}

.filters-label {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.active-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 26%, var(--color-surface)),
    color-mix(in srgb, var(--color-accent-strong) 22%, var(--color-surface))
  );
  color: var(--color-accent-strong);
  border: 1px solid color-mix(
      in srgb,
      var(--color-accent) 30%,
      transparent
    );
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
}

.active-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-on-accent) 40%, transparent), transparent);
  transition: left 0.5s ease;
}

.active-tag:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 32%, var(--color-surface)),
    color-mix(in srgb, var(--color-accent-strong) 28%, var(--color-surface))
  );
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 8px 24px color-mix(
      in srgb,
      var(--color-accent-strong) 42%,
      transparent
    )
  );
  border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.active-tag:hover::before {
  left: 100%;
}

.active-tag:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.remove-tag {
  width: 14px;
  height: 14px;
}

.clear-filters {
  padding: 7px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: 1.5px dashed var(--color-border-subtle);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  will-change: transform, box-shadow, border-color;
}

.clear-filters:hover {
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  border-style: solid;
  border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  color: var(--color-accent-strong);
  transform: translateY(-2px);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 6px 18px color-mix(
      in srgb,
      var(--color-accent-strong) 30%,
      transparent
    )
  );
  font-weight: 600;
}

.clear-filters:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-filters:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}



/* Form */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-subtle);
  font-size: 16px;
  color: var(--color-text-body);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, border-color, box-shadow, background;
  font-family: inherit;
  position: relative;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.form-input:hover:not(:focus):not(:disabled),
.form-textarea:hover:not(:focus):not(:disabled) {
  border-color: color-mix(
    in srgb,
    var(--color-accent) 40%,
    transparent
  );
  background: var(
    --state-surface-hover-bg,
    color-mix(in srgb, var(--color-surface) 90%, #000000)
  );
  box-shadow: var(
    --state-accent-soft-shadow,
    0 4px 12px color-mix(
      in srgb,
      var(--color-accent-strong) 18%,
      transparent
    )
  );
  transform: translateY(-1px);
}

.form-input:hover:not(:focus):not(:disabled)::placeholder,
.form-textarea:hover:not(:focus):not(:disabled)::placeholder {
  opacity: 0.5;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow:
    0 0 0 4px
      color-mix(in srgb, var(--color-accent) 20%, transparent),
    var(
      --state-accent-soft-shadow,
      0 6px 16px color-mix(
        in srgb,
        var(--color-accent-strong) 28%,
        transparent
      )
    );
  background: var(--color-surface);
  transform: translateY(-2px) scale(1.002);
}

.form-input:focus::placeholder,
.form-textarea:focus::placeholder {
  opacity: 0.4;
}

.form-input:focus-visible,
.form-textarea:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.form-input.invalid,
.form-textarea.invalid {
  border-color: var(--color-status-danger);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-status-danger) 12%, transparent),
              0 4px 12px color-mix(in srgb, var(--color-status-danger) 20%, transparent);
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  background: color-mix(in srgb, var(--color-status-danger) 3%, var(--color-surface));
}

.form-input:disabled,
.form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-surface-muted);
}

.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-status-danger);
  font-weight: 500;
  animation: fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  line-height: 1.4;
}

.form-error .error-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Touched state styling */
.form-input.touched,
.form-textarea.touched {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.form-input.invalid,
.form-textarea.invalid {
  animation: formShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.form-input.invalid:focus,
.form-textarea.invalid:focus {
  border-color: var(--color-status-danger);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-status-danger) 15%, transparent),
    0 2px 8px color-mix(in srgb, var(--color-status-danger) 20%, transparent);
}

@keyframes formShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0) translateY(-2px) scale(1.002); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px) translateY(-2px) scale(1.002); }
  20%, 40%, 60%, 80% { transform: translateX(6px) translateY(-2px) scale(1.002); }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 200px;
  line-height: 1.6;
}

.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  animation: tagsSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes tagsSlideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-tag {
  padding: 5px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 15%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 10%, transparent)
  );
  color: var(--color-accent-strong);
  border: 1px solid
    color-mix(in srgb, var(--color-accent) 25%, transparent);
  transition: all 0.2s ease;
  animation: tagFadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.preview-tag:nth-child(1) { animation-delay: 0.05s; }
.preview-tag:nth-child(2) { animation-delay: 0.1s; }
.preview-tag:nth-child(3) { animation-delay: 0.15s; }
.preview-tag:nth-child(4) { animation-delay: 0.2s; }
.preview-tag:nth-child(n+5) { animation-delay: 0.25s; }

@keyframes tagFadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Tag Remove Button */
.tag-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 6px;
  border-radius: 50%;
  border: none;
  background: color-mix(in srgb, var(--color-accent-strong) 15%, transparent);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  color: var(--color-accent-strong);
}

.tag-remove-btn:hover {
  background: color-mix(in srgb, var(--color-accent-strong) 25%, transparent);
  color: var(--color-accent-strong);
  transform: scale(1.15);
}

.tag-remove-btn:active {
  transform: scale(0.95);
  background: color-mix(in srgb, var(--color-accent-strong) 30%, transparent);
}

.tag-remove-icon {
  width: 8px;
  height: 8px;
  stroke-width: 2.5;
}

/* Tag Input Hint */
.tag-input-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 6px;
  line-height: 1.5;
  font-weight: 500;
  opacity: 0.85;
}

/* ============================================
   Custom Scrollbar Styles (Modern & Elegant)
   ============================================ */

/* Webkit Browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--text-primary) 2%, var(--color-surface));
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 30%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 40%, transparent)
  );
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 2%, var(--color-surface));
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 40%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 50%, transparent)
  );
  border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

::-webkit-scrollbar-thumb:active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 50%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 60%, transparent)
  );
  border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: 
    color-mix(in srgb, var(--color-accent-strong) 50%, transparent)
    color-mix(in srgb, var(--text-primary) 2%, var(--color-surface));
}

/* Specific Scrollbar Styles for Components */
.notes-list::-webkit-scrollbar,
.search-results::-webkit-scrollbar,
.markdown-editor-textarea::-webkit-scrollbar,
.markdown-editor-preview::-webkit-scrollbar,
.sidebar-inner::-webkit-scrollbar,
.tags-list::-webkit-scrollbar {
  width: 8px;
}

.notes-list::-webkit-scrollbar-track,
.search-results::-webkit-scrollbar-track,
.markdown-editor-textarea::-webkit-scrollbar-track,
.markdown-editor-preview::-webkit-scrollbar-track,
.sidebar-inner::-webkit-scrollbar-track,
.tags-list::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--text-primary) 1.5%, var(--color-surface));
}

.notes-list::-webkit-scrollbar-thumb,
.search-results::-webkit-scrollbar-thumb,
.markdown-editor-textarea::-webkit-scrollbar-thumb,
.markdown-editor-preview::-webkit-scrollbar-thumb,
.sidebar-inner::-webkit-scrollbar-thumb,
.tags-list::-webkit-scrollbar-thumb {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 25%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 35%, transparent)
  );
  border-radius: 8px;
  border: 1.5px solid color-mix(in srgb, var(--text-primary) 1.5%, var(--color-surface));
}

.notes-list::-webkit-scrollbar-thumb:hover,
.search-results::-webkit-scrollbar-thumb:hover,
.markdown-editor-textarea::-webkit-scrollbar-thumb:hover,
.markdown-editor-preview::-webkit-scrollbar-thumb:hover,
.sidebar-inner::-webkit-scrollbar-thumb:hover,
.tags-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 35%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 45%, transparent)
  );
}

/* Modal Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.btn-cancel {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  will-change: transform, box-shadow, background-color;
}

.btn-cancel:hover {
  background: color-mix(in srgb, var(--text-primary) 8%, var(--color-surface));
  color: var(--color-text-body);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--text-primary) 12%, transparent);
  border-color: var(--color-border-subtle);
}

.btn-cancel:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-cancel:active {
  transform: translateY(0) scale(0.98);
}

.btn-cancel:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.btn-submit {
  padding: 12px 28px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    color-mix(in srgb, var(--color-accent) 70%, var(--color-accent-strong)) 50%,
    var(--color-accent-strong) 100%
  );
  color: var(--color-on-accent);
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 14px color-mix(
      in srgb,
      var(--color-accent-strong) 45%,
      transparent
    );
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
}

.btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-on-accent) 30%, transparent), transparent);
  transition: left 0.5s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px color-mix(
      in srgb,
      var(--color-accent-strong) 55%,
      transparent
    );
  filter: brightness(1.1);
}

.btn-submit:hover:not(:disabled)::before {
  left: 100%;
}

.btn-submit:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 8px 24px color-mix(
      in srgb,
      var(--color-accent-strong) 52%,
      transparent
    )
  );
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-submit:focus-visible:not(:disabled) {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.btn-loading {
  width: 14px;
  height: 14px;
  animation: none;
  opacity: 0.6;
}

.btn-check {
  width: 16px;
  height: 16px;
}

/* Keyboard Hint */
.keyboard-hint {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  background: color-mix(in srgb, var(--text-primary) 95%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  font-size: 13px;
  color: color-mix(in srgb, var(--color-on-accent) 90%, transparent);
  z-index: 50;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--text-primary) 30%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-on-accent) 10%, transparent);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.keyboard-hint:hover {
  background: color-mix(in srgb, var(--text-primary) 100%, transparent);
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 12px 40px color-mix(in srgb, var(--text-primary) 40%, transparent);
}

.keyboard-hint kbd {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 4px;
  background: color-mix(in srgb, var(--color-on-accent) 15%, transparent);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Headless UI Transitions */
.duration-300 {
  transition-duration: 300ms;
}
.duration-200 {
  transition-duration: 200ms;
}
.duration-100 {
  transition-duration: 100ms;
}
.duration-75 {
  transition-duration: 75ms;
}
.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}
.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
.opacity-0 {
  opacity: 0;
}
.opacity-100 {
  opacity: 1;
}
.scale-95 {
  transform: scale(0.95);
}
.scale-100 {
  transform: scale(1);
}
.translate-y-2 {
  transform: translateY(8px);
}
.translate-y-0 {
  transform: translateY(0);
}



.shortcuts-content {
  padding: 32px;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.shortcut-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: color-mix(in srgb, var(--text-primary) 2%, var(--color-surface));
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 14px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.shortcut-card:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.shortcut-key {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kbd-key {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    var(--color-surface) 0%,
    color-mix(in srgb, var(--text-primary) 3%, var(--color-surface)) 100%
  );
  border: 1.5px solid var(--color-border-subtle);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-body);
  box-shadow: 
    0 2px 4px color-mix(in srgb, var(--text-primary) 5%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.shortcut-description {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-body);
  line-height: 1.5;
}

.shortcuts-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 12%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 8%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent-strong);
}

.hint-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.kbd-hint {
  display: inline-block;
  padding: 3px 7px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
  font-size: 11px;
  font-weight: 600;
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--color-accent-strong);
  margin: 0 2px;
}

.btn-shortcuts {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--color-text-muted);
}

.btn-shortcuts:hover {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  color: var(--color-accent-strong);
  transform: scale(1.1);
}

.btn-shortcuts:active {
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .search-container {
    max-width: 320px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
  }
  
  .search-container {
    max-width: 100%;
    justify-self: stretch;
  }
  
  .header-actions {
    gap: 8px;
  }
  
  .search-shortcut {
    display: none;
  }
  
  .main-content {
    flex-direction: column;
    padding: 20px 16px;
  }
  
  .sidebar {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .sidebar-inner {
    position: static;
  }
  
  .filter-tiles,
  .tags-container,
  .view-toggle {
    margin-bottom: 16px;
  }
  
  .modal-panel {
    padding: 20px;
    border-radius: 16px;
    margin: 16px;
    max-width: calc(100% - 32px);
  }
  
  .keyboard-hint {
    display: none;
  }
  
  .note-capsule {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 10px 12px;
  }
  
  .btn-new-note span {
    display: none;
  }
  
  .btn-new-note {
    padding: 10px;
    min-width: 44px;
  }
  
  .modal-panel {
    padding: 16px;
    margin: 12px;
    max-width: calc(100% - 24px);
  }
  
  .form-input,
  .form-textarea {
    padding: 12px 14px;
    font-size: 16px;
  }
  
  .filter-tile,
  .view-btn {
    padding: 10px 14px;
  }
  
  .tag-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
}

/* Tag Context Menu */
.tag-context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 240px;
  max-width: 320px;
  background: color-mix(in srgb, var(--color-surface) 98%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1.5px solid var(--color-border-subtle);
  box-shadow: 
    0 12px 48px color-mix(in srgb, var(--text-primary) 15%, transparent),
    0 4px 16px color-mix(in srgb, var(--text-primary) 8%, transparent);
  padding: 8px 0;
  animation: contextMenuIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes contextMenuIn {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.context-menu-icon {
  width: 16px;
  height: 16px;
  color: var(--tag-color, var(--color-accent-strong));
}

.context-menu-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-body);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-menu-divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 6px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--color-text-body);
  font-size: 13px;
}

.context-menu-item:hover {
  background: color-mix(in srgb, var(--text-primary) 5%, var(--color-surface));
}

.context-menu-item:active {
  background: color-mix(in srgb, var(--text-primary) 8%, var(--color-surface));
}

.context-menu-item.danger {
  color: var(--color-status-danger);
}

.context-menu-item.danger:hover {
  background: color-mix(in srgb, var(--color-status-danger) 8%, var(--color-surface));
}

.context-item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Color Picker */
.color-picker-section {
  padding: 10px 16px;
}

.color-picker-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.color-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-btn:hover {
  transform: scale(1.03);
  box-shadow: var(--shadow-sm);
}

.color-btn.selected {
  border-color: var(--color-text-body);
  transform: scale(1.02);
}

.color-check {
  width: 12px;
  height: 12px;
  color: var(--color-on-accent);
}

/* Business-calm overrides */
.logo-icon:hover,
.btn-settings:hover,
.btn-settings:active,
.search-result-item:hover,
.search-result-item.active,
.filter-tile:hover,
.filter-tile:active,
.view-btn:hover,
.view-btn:active {
  transform: none;
}

.filter-tile:hover .filter-tile-icon,
.filter-tile.active .filter-tile-icon,
.filter-tile.active .filter-tile-check {
  transform: none;
}

/* Business-calm animation overrides */
.filter-tile.active .filter-tile-check,
.tag-btn.active .tag-count,
.view-btn.active .view-btn-count,
.fts-badge-icon,
.form-input.invalid,
.form-textarea.invalid,
.form-error,
.tag-preview,
.preview-tag,
.context-menu {
  animation: none;
}

/* Business-calm motion clamp */
.search-clear:active,
.filter-tile-check,
.tag-btn.active .tag-count,
.view-btn.active .view-btn-count,
.context-menu,
.context-menu-item:hover,
.context-menu-item:active {
  transform: none;
}

/* Dark mode – component-level overrides moved to styles/theme-dark.css */

/* Business-calm overrides (Home) */
.search-result-item:hover,
.search-result-item.active,
.search-clear:hover,
.search-clear:active,
.filter-tile:hover,
.filter-tile:active,
.filter-tile:hover .filter-tile-icon,
.filter-tile.active .filter-tile-icon,
.filter-tile.active .filter-tile-check,
.view-btn:hover,
.view-btn:active,
.view-btn.active,
.sort-select:hover,
.sort-select:focus,
.context-item:hover,
.context-item:active,
.tag-chip:hover,
.tag-chip:active,
.tag-suggestions .suggestion-item:hover,
.tag-suggestions .suggestion-item.highlighted {
  transform: none;
}
</style>
