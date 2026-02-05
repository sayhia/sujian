<template>
   <article 
     @click="handleClick"
     class="note-capsule"
     :class="{ 'is-archived': note.is_archived, 'grid-mode': props.viewMode === 'grid' }"
     role="article"
     tabindex="0"
     @keydown.enter="handleClick"
     @keydown.space.prevent="handleClick"
   >
    <!-- Grid Mode Layout -->
    <template v-if="props.viewMode === 'grid'">
      <!-- Type accent bar -->
      <div v-if="note.type === 'article'" class="note-type-top-accent article-type">
        <span class="accent-dot accent-dot-1"></span>
        <span class="accent-dot accent-dot-2"></span>
      </div>
      <div v-else class="note-type-top-accent quick-type">
        <span class="accent-dot accent-dot-1"></span>
        <span class="accent-dot accent-dot-2"></span>
      </div>

      <!-- Header -->
      <div class="note-header">
        <!-- Date Badge -->
        <div class="date-badge">
         <div class="date-day">{{ dateDay }}</div>
         <div class="date-month">{{ dateMonth }}</div>
         <div class="date-time">{{ dateTime }}</div>
        </div>

         <!-- Content Preview -->
         <div class="note-content">
           <h3 class="note-title" v-html="highlightText(note.title)"></h3>
           <p class="note-preview" v-html="highlightText(truncateContent(note.content, 120))"></p>
 
           <!-- Tags Preview -->
           <div v-if="note.tags?.length" class="tags-preview">
             <span
               v-for="tag in note.tags.slice(0, 3)"
               :key="tag"
               class="tag-mini"
             >#{{ tag }}</span>
             <span v-if="note.tags.length > 3" class="tag-more" :title="note.tags.slice(3).join(', ')">
               +{{ note.tags.length - 3 }}
             </span>
           </div>
         </div>
 
        <!-- Actions Menu -->
        <Menu as="div" class="actions-menu" @click.stop>
          <MenuButton class="menu-button" aria-label="笔记操作菜单">
            <MoreHorizontal class="menu-icon" aria-hidden="true" />
          </MenuButton>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems class="menu-items">
              <MenuItem v-slot="{ active }">
                <button class="menu-item" :class="{ active }" @click="onEdit" aria-label="编辑笔记">
                  <Edit3 class="item-icon" aria-hidden="true" />
                </button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button class="menu-item" :class="{ active }" @click="onArchive" :aria-label="note.is_archived ? '取消归档' : '归档笔记'">
                  <ArchiveRestore v-if="note.is_archived" class="item-icon" aria-hidden="true" />
                  <Archive v-else class="item-icon" aria-hidden="true" />
                </button>
              </MenuItem>
              <div class="menu-divider" />
              <MenuItem v-slot="{ active }">
                <button class="menu-item danger" :class="{ active }" @click="onDelete">
                  <Trash2 class="item-icon" aria-hidden="true" />
                </button>
              </MenuItem>
            </MenuItems>
          </transition>
          </Menu>

        </div>
     </template>

 <!-- Timeline Mode Layout -->
    <template v-else>
      <!-- 方案 4: 顶部装饰线 - 增强版 -->
      <div v-if="note.type === 'article'" class="note-type-top-accent article-type">
        <span class="accent-dot accent-dot-1"></span>
        <span class="accent-dot accent-dot-2"></span>
      </div>
      <div v-else class="note-type-top-accent quick-type">
        <span class="accent-dot accent-dot-1"></span>
        <span class="accent-dot accent-dot-2"></span>
      </div>

      <!-- Header -->
      <div class="note-header">
        <!-- Date Badge -->
        <div class="date-badge">
         <div class="date-day">{{ dateDay }}</div>
         <div class="date-month">{{ dateMonth }}</div>
         <div class="date-time">{{ dateTime }}</div>
        </div>

         <!-- Content Preview -->
         <div class="note-content">
           <h3 class="note-title" v-html="highlightText(note.title)"></h3>
           <p class="note-preview" v-html="highlightText(truncateContent(note.content, 120))"></p>
 
           <!-- Tags Preview -->
           <div v-if="note.tags?.length" class="tags-preview">
             <span
               v-for="tag in note.tags.slice(0, 3)"
               :key="tag"
               class="tag-mini"
             >#{{ tag }}</span>
             <span v-if="note.tags.length > 3" class="tag-more" :title="note.tags.slice(3).join(', ')">
               +{{ note.tags.length - 3 }}
             </span>
           </div>
         </div>

        <!-- Actions Menu -->
        <Menu as="div" class="actions-menu" @click.stop>
          <MenuButton class="menu-button" aria-label="笔记操作菜单">
            <MoreHorizontal class="menu-icon" aria-hidden="true" />
          </MenuButton>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems class="menu-items">
              <MenuItem v-slot="{ active }">
                <button class="menu-item" :class="{ active }" @click="onEdit" aria-label="编辑笔记">
                  <Pencil class="item-icon" aria-hidden="true" />
                </button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button class="menu-item" :class="{ active }" @click="onArchive" :aria-label="note.is_archived ? '取消归档' : '归档笔记'">
                  <ArchiveRestore v-if="note.is_archived" class="item-icon" aria-hidden="true" />
                  <Archive v-else class="item-icon" aria-hidden="true" />
                </button>
              </MenuItem>
              <div class="menu-divider" />
              <MenuItem v-slot="{ active }">
                <button class="menu-item danger" :class="{ active }" @click="onDelete" aria-label="删除笔记">
                  <Trash2 class="item-icon" aria-hidden="true" />
                </button>
              </MenuItem>
            </MenuItems>
           </transition>
       </Menu>
     </div>

     </template>
   </article>
 </template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  TransitionRoot,
} from '@headlessui/vue';
import {
  Pencil,
  Edit3,
  Archive,
  ArchiveRestore,
  Trash2,
  Tag,
  Clock,
  RefreshCw,
  MoreHorizontal,
  FileText,
  Sparkles
} from 'lucide-vue-next';
import type { Note } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { useSafeHTML } from '../composables/useSafeHTML';
import { useDateFormat, useShortDateFormat } from '../composables/useDateFormat';

interface Props {
  note: Note;
  searchQuery?: string;
  viewMode?: 'timeline' | 'grid';
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  viewMode: 'timeline'
});

const emit = defineEmits<{
  edit: [note: Note];
  archive: [id: number];
  delete: [id: number];
  openDetail: [note: Note];
}>();

const settingsStore = useSettingsStore();
const { sanitizeHtml } = useSafeHTML();

const currentLocale = computed(() => {
  return settingsStore.settings.language === 'en' ? 'en-US' : 'zh-CN';
});

const is24Hour = computed(() => settingsStore.settings.timeFormat === '24h');

const noteDateRef = computed(() => props.note.created_at);
const formattedDate = useDateFormat(noteDateRef);
const shortFormattedDate = useShortDateFormat(noteDateRef);

const dateDay = computed(() => {
  return new Date(props.note.created_at).getDate();
});

const dateMonth = computed(() => {
  return new Date(props.note.created_at).toLocaleDateString(currentLocale.value, { month: 'short' });
});

const dateTime = computed(() => {
  const date = new Date(props.note.created_at);
  return date.toLocaleTimeString(currentLocale.value, { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: !is24Hour.value,
  });
});

function handleClick() {
  emit('openDetail', props.note);
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

function highlightText(text: string): string {
  if (!props.searchQuery || !text) return sanitizeHtml(text);
  
  const query = props.searchQuery.toLowerCase();
  const safeText = sanitizeHtml(text);
  const safeQuery = sanitizeHtml(query);
  
  const regex = new RegExp(`(${escapeRegex(safeQuery)})`, 'gi');
  return safeText.replace(regex, '<mark class="highlight">$1</mark>');
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function onEdit() {
  emit('edit', props.note);
}

function onArchive() {
  emit('archive', props.note.id);
}

function onDelete() {
  emit('delete', props.note.id);
}
</script>

<style scoped>
/* ============================================
   Glassmorphism Card Design (Modern & Elegant)
   ============================================ */

 .note-capsule {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-md), var(--shadow-inset-soft);
  padding: 24px;
  cursor: pointer;
  transition: all 0.35s var(--ease-spring);
  user-select: none;
  will-change: transform, box-shadow, background, border-color;
  contain: layout style paint;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 148px;
}

/* Light reflection effect on card */
.note-capsule::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-accent) 8%, transparent) 0%, transparent 60%);
  pointer-events: none;
  transition: opacity 0.5s ease;
  opacity: 0;
  z-index: 1;
}

/* Subtle gradient overlay */
.note-capsule::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-surface) 92%, transparent) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
  border-radius: inherit;
}

.note-capsule:hover::before {
  opacity: 1;
}

 /* Hover state - enhanced glassmorphism */
.note-capsule:hover {
  transform: none;
  background: color-mix(in srgb, var(--color-accent) 4%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
  box-shadow: var(--shadow-lg), var(--shadow-inset-soft);
}

/* Active state */
.note-capsule:active {
  transform: none;
  background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface));
  box-shadow: var(--shadow-sm), var(--shadow-inset-soft);
  transition: all 0.1s var(--ease-out-expo);
}

 .note-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  padding-top: 0;
  z-index: 1;
  width: 100%;
}

/* Date Badge - Glassmorphism Style */
.date-badge {
  flex-shrink: 0;
  width: 72px;
  text-align: center;
  padding: 14px 10px;
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
  box-shadow: var(--shadow-sm), var(--shadow-inset-soft);
  transition: transform 0.35s var(--ease-spring),
              box-shadow 0.35s var(--ease-spring),
              background 0.35s var(--ease-spring),
              border-color 0.35s ease;
  position: relative;
  overflow: hidden;
  will-change: transform, box-shadow;
}

/* Inner glow effect */
.date-badge::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-surface) 30%, transparent) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  will-change: opacity;
}

/* Shine effect */
.date-badge::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%,
    transparent 50%,
    color-mix(in srgb, var(--color-palette-4) 30%, transparent) 100%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  border-radius: inherit;
}

.note-capsule:hover .date-badge::before {
  opacity: 0;
}

.note-capsule:hover .date-badge::after {
  opacity: 0;
}

.note-capsule:hover .date-badge {
  transform: none;
  background: color-mix(in srgb, var(--text-primary) 8%, var(--color-surface));
  border-color: color-mix(in srgb, var(--text-primary) 14%, transparent);
  box-shadow: none;
}

/* 性能优化：减少动画属性，使用 transform 和 opacity 为主 */
@media (prefers-reduced-motion: no-preference) {
  .note-capsule {
    will-change: transform, box-shadow, background, border-color;
  }
  
  .date-badge {
    will-change: transform, box-shadow;
  }
}

 .note-capsule:active .date-badge {
  transform: scale(1.02) rotate(-0.3deg);
  transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 3px 10px color-mix(in srgb, var(--color-accent) 22%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-accent) 22%, transparent) inset,
    inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

 .date-day {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-palette-1);
  line-height: 1;
  letter-spacing: -0.015em;
  text-shadow: 0 2px 4px color-mix(
    in srgb,
    var(--color-palette-2) 30%,
    transparent
  );
  position: relative;
  z-index: 1;
  font-variant-numeric: tabular-nums;
}

.date-month {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-palette-2);
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  position: relative;
  z-index: 1;
}

.date-time {
  font-size: 8px;
  font-weight: 600;
  color: var(--color-palette-2);
  margin-top: 2px;
  opacity: 0.95;
  position: relative;
  z-index: 1;
  font-variant-numeric: tabular-nums;
}

/* Note Content */
.note-content {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

 .note-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-palette-1);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
  line-height: 1.35;
  position: relative;
  padding-right: 8px;
}

.note-title::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-palette-5) 98%, transparent));
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.note-capsule:hover .note-title::after {
  opacity: 1;
}

.note-preview {
  font-size: 13px;
  color: var(--color-palette-2);
  line-height: 1.55;
  height: 3.1em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}
 
 /* ============================================
    Glassmorphism Tag Style (Modern & Elegant)
    ============================================ */

.tag-mini {
  padding: 3px 9px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: color-mix(
    in srgb,
    var(--color-accent) 100%,
    var(--color-text-body)
  );
  transition: all 0.2s ease;
  display: inline-block;
  position: relative;
  cursor: default;
}

 .note-capsule:hover .tag-mini {
  transform: translateY(-0.5px);
}

 .tag-more {
  padding: 3px 9px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: color-mix(in srgb, var(--color-accent) 100%, var(--color-text-muted));
  cursor: help;
  transition: all 0.2s ease;
}

/* ============================================
   类型标记 - 多种设计方案
   ============================================ */

/* 方案 1: 极简图标徽章 (当前启用) */
.note-type-badge-corner.variant-icon-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-surface) 80%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-subtle);
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  box-shadow: 
    0 1px 4px color-mix(in srgb, var(--text-primary) 4%, transparent),
    0 0 0 0.5px color-mix(in srgb, var(--color-surface) 95%, transparent) inset;
}

.note-type-badge-corner.variant-icon-badge.article-type {
  border-color: var(--type-article-border);
  background: var(--type-article-bg);
}

.note-type-badge-corner.variant-icon-badge.quick-type {
  border-color: color-mix(
    in srgb,
    var(--color-accent) 24%,
    transparent
  );
  background: color-mix(
    in srgb,
    var(--color-surface) 85%,
    var(--color-accent) 10%
  );
}

.note-capsule:hover .note-type-badge-corner.variant-icon-badge {
  transform: scale(1.1);
  box-shadow: 
    0 3px 10px color-mix(in srgb, var(--text-primary) 8%, transparent),
    0 0 0 0.5px color-mix(in srgb, var(--color-surface) 98%, transparent) inset;
}

.note-capsule:hover .note-type-badge-corner.variant-icon-badge.article-type {
  border-color: var(--type-article-border-hover);
  background: var(--type-article-bg-hover);
}

.note-capsule:hover .note-type-badge-corner.variant-icon-badge.quick-type {
  border-color: color-mix(
    in srgb,
    var(--color-accent-strong) 42%,
    transparent
  );
  background: color-mix(
    in srgb,
    var(--color-surface) 80%,
    var(--color-accent) 16%
  );
}

.type-badge-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

.note-type-badge-corner.variant-icon-badge.article-type .type-badge-icon {
  color: var(--type-article);
  opacity: 0.8;
}

.note-type-badge-corner.variant-icon-badge.quick-type .type-badge-icon {
  color: var(--color-accent-strong);
  opacity: 0.9;
}

.note-capsule:hover .note-type-badge-corner.variant-icon-badge.article-type .type-badge-icon {
  color: var(--type-article-strong);
  opacity: 1;
  transform: scale(1.1);
}

.note-capsule:hover .note-type-badge-corner.variant-icon-badge.quick-type .type-badge-icon {
  color: var(--color-accent-strong);
  opacity: 1;
  transform: scale(1.1);
}

/* 方案 2: 圆点指示器 */
.note-type-badge-dot {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  z-index: 10;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 
    0 0 0 2px color-mix(in srgb, var(--color-surface) 90%, transparent),
    0 2px 4px color-mix(in srgb, var(--text-primary) 10%, transparent);
}

.note-type-badge-dot.article-type {
  background: var(--type-article);
  box-shadow: 
    0 0 0 2px color-mix(in srgb, var(--color-surface) 90%, transparent),
    0 0 0 4px color-mix(in srgb, var(--type-article) 15%, transparent),
    0 2px 4px color-mix(in srgb, var(--type-article-shadow) 67%, transparent);
}

.note-type-badge-dot.quick-type {
  background: var(--color-accent-strong);
  box-shadow: 
    0 0 0 2px color-mix(in srgb, var(--color-surface) 90%, transparent),
    0 0 0 4px color-mix(
      in srgb,
      var(--color-accent) 24%,
      transparent
    ),
    0 2px 4px color-mix(
      in srgb,
      var(--color-accent-strong) 26%,
      transparent
    );
}

.note-capsule:hover .note-type-badge-dot {
  transform: scale(1.3);
}

/* 方案 3: 左侧色条 */
.note-type-side-stripe {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  border-radius: 22px 0 0 22px;
  z-index: 1;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.note-type-side-stripe.article-type {
  background: linear-gradient(180deg, var(--type-article) 0%, var(--type-article-strong) 100%);
  box-shadow: 2px 0 8px var(--type-article-shadow);
}

.note-type-side-stripe.quick-type {
  background: linear-gradient(
    180deg,
    var(--color-accent) 0%,
    var(--color-accent-strong) 100%
  );
  box-shadow: 2px 0 8px color-mix(
    in srgb,
    var(--color-accent-strong) 30%,
    transparent
  );
}

.note-capsule:hover .note-type-side-stripe {
  width: 5px;
}

.note-capsule:hover .note-type-side-stripe.article-type {
  box-shadow: 3px 0 12px var(--type-article-shadow-hover);
}

.note-capsule:hover .note-type-side-stripe.quick-type {
  box-shadow: 3px 0 12px color-mix(
    in srgb,
    var(--color-accent-strong) 40%,
    transparent
  );
}

/* ============================================
   Glassmorphism Note Type Accent (Modern)
   ============================================ */

.note-type-top-accent {
  position: absolute;
  top: -1px;
  left: -1px;
  width: 80px;
  height: 4px;
  border-radius: var(--radius-3xl, 28px) var(--radius-3xl, 28px) 0 0;
  z-index: 50;
  pointer-events: none;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.4s ease,
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              border-radius 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              left 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              top 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: visible;
  opacity: 0;
  will-change: width, height, box-shadow, transform, opacity, left, top;
  transform-origin: left center;
  animation: accentFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid transparent;
}

/* 主光泽扫过效果 - 双层 */
.note-type-top-accent::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    color-mix(in srgb, var(--color-surface) 90%, transparent) 15%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 30%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 50%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 70%,
    color-mix(in srgb, var(--color-surface) 90%, transparent) 85%,
    transparent 100%
  );
  transition: left 1s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: left;
  border-radius: inherit;
  animation: shimmerSweep 4s ease-in-out infinite;
  z-index: 2;
}

/* 背景光晕层 - 多层 */
.note-type-top-accent::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -10px;
  right: -10px;
  height: 300%;
  transform: translateY(-50%);
  background: inherit;
  border-radius: inherit;
  opacity: 0.3;
  transition: opacity 0.6s ease, 
              height 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              left 0.6s ease,
              right 0.6s ease;
  filter: blur(6px);
  z-index: -2;
  animation: glowPulse 5s ease-in-out infinite;
}

/* 文章类型样式 - 现代化渐变 */
.note-type-top-accent.article-type {
  background: linear-gradient(90deg, 
    var(--type-article) 0%, 
    var(--type-article-light) 25%,
    var(--type-article-lighter) 50%,
    var(--type-article-lightest) 75%,
    var(--type-article-lightest) 100%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  animation: gradientFlow 6s ease-in-out infinite;
  box-shadow: 
    0 0 0 0.5px color-mix(in srgb, var(--type-article) 30%, transparent) inset,
    0 0 12px color-mix(in srgb, var(--type-article) 25%, transparent),
    0 0 24px color-mix(in srgb, var(--type-article) 15%, transparent);
  border-color: color-mix(in srgb, var(--type-article) 40%, transparent);
}

/* 快速笔记类型样式 - 现代化渐变 */
.note-type-top-accent.quick-type {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-accent) 80%, transparent) 0%,
    var(--color-accent) 25%,
    var(--color-accent-strong) 50%,
    var(--color-accent) 75%,
    var(--color-accent) 100%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  animation: gradientFlow 6s ease-in-out infinite;
  box-shadow:
    0 0 0 0.5px color-mix(in srgb, var(--color-accent) 30%, transparent) inset,
    0 0 12px color-mix(in srgb, var(--color-accent) 25%, transparent),
    0 0 24px color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
}

/* 悬停状态 - 增强 */
.note-capsule:hover .note-type-top-accent {
  width: 140px;
  height: 5px;
  opacity: 1;
  border-radius: var(--radius-3xl, 28px) var(--radius-3xl, 28px) 0 8px;
  border-width: 2px;
}

/* 点击状态 */
.note-capsule:active .note-type-top-accent {
  width: 120px;
  height: 4px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 背景光晕层 - 多层 */
.note-type-top-accent::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -10px;
  right: -10px;
  height: 250%;
  transform: translateY(-50%);
  background: inherit;
  border-radius: inherit;
  opacity: 0.25;
  transition: opacity 0.6s ease, 
              height 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              left 0.7s ease,
              right 0.7s ease;
  filter: blur(5px);
  z-index: -2;
  animation: glowPulse 4s ease-in-out infinite;
}

/* 文章类型样式 - 动态渐变 */
.note-type-top-accent.article-type {
  background: linear-gradient(90deg, 
    var(--type-article) 0%, 
    var(--type-article-light) 18%,
    var(--type-article-lighter) 35%,
    var(--type-article-lightest) 45%,
    color-mix(in srgb, var(--type-article-lightest) 100%, var(--color-surface)) 50%,
    var(--type-article-lightest) 55%,
    var(--type-article-lighter) 65%,
    color-mix(in srgb, var(--type-article) 65%, transparent) 82%,
    color-mix(in srgb, var(--type-article) 25%, transparent) 100%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  animation: pulseGlow 4.5s ease-in-out infinite,
             gradientFlow 8s ease-in-out infinite;
  box-shadow: 
    0 2px 14px var(--type-article-shadow),
    0 0 0 0.5px color-mix(in srgb, var(--type-article) 18%, transparent) inset,
    0 1px 5px color-mix(in srgb, var(--type-article) 20%, transparent),
    0 0 24px color-mix(in srgb, var(--type-article) 12%, transparent),
    0 0 0 1px color-mix(in srgb, var(--type-article-strong) 10%, transparent);
  border-color: var(--type-article-border);
}

/* 快速笔记类型样式 - 动态渐变 */
.note-type-top-accent.quick-type {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--type-quick) 90%, transparent) 0%,
    color-mix(in srgb, var(--type-quick) 70%, var(--color-surface)) 18%,
    color-mix(in srgb, var(--type-quick) 55%, var(--color-surface)) 35%,
    color-mix(in srgb, var(--type-quick) 40%, var(--color-surface)) 45%,
    color-mix(in srgb, var(--type-quick) 26%, var(--color-surface)) 50%,
    color-mix(in srgb, var(--type-quick) 40%, var(--color-surface)) 55%,
    color-mix(in srgb, var(--type-quick) 55%, var(--color-surface)) 65%,
    color-mix(in srgb, var(--type-quick) 80%, transparent) 82%,
    color-mix(in srgb, var(--type-quick) 32%, transparent) 100%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  animation: pulseGlowQuick 4.5s ease-in-out infinite,
             gradientFlow 8s ease-in-out infinite;
  box-shadow: 
    0 2px 14px color-mix(
      in srgb,
      var(--type-quick-strong) 30%,
      transparent
    ),
    0 0 0 0.5px color-mix(
      in srgb,
      var(--type-quick) 20%,
      transparent
    ) inset,
    0 1px 5px color-mix(
      in srgb,
      var(--type-quick-strong) 18%,
      transparent
    ),
    0 0 24px color-mix(
      in srgb,
      var(--type-quick) 14%,
      transparent
    ),
    0 0 0 1px color-mix(
      in srgb,
      var(--type-quick-strong) 16%,
      transparent
    );
  border-color: color-mix(
    in srgb,
    var(--type-quick) 26%,
    transparent
  );
}

/* 悬停状态 - 增强 */
.note-capsule:hover .note-type-top-accent {
  width: 120px;
  height: 5px;
  opacity: 1;
  transform: scaleY(1.15) translateY(-0.5px);
  border-radius: 22px 0 8px 0;
  border-width: 0.75px;
  top: -1.5px;
  left: -1.5px;
}

.note-capsule:hover .note-type-top-accent::before {
  left: 100%;
  animation: shimmerSweep 1.2s ease-in-out infinite;
  background: linear-gradient(90deg, 
    transparent 0%,
    color-mix(in srgb, var(--color-surface) 90%, transparent) 10%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 25%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 50%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 75%,
    color-mix(in srgb, var(--color-surface) 90%, transparent) 90%,
    transparent 100%
  );
}

.note-capsule:hover .note-type-top-accent::after {
  opacity: 0.6;
  height: 400%;
  filter: blur(8px);
  left: -15px;
  right: -15px;
}

.note-capsule:hover .note-type-top-accent.article-type {
  background-position: 100% 0%;
  box-shadow: 
    0 6px 24px color-mix(in srgb, var(--type-article-shadow-hover) 112%, transparent),
    0 0 0 0.75px color-mix(in srgb, var(--type-article) 30%, transparent) inset,
    0 4px 10px var(--type-article-shadow),
    0 0 40px color-mix(in srgb, var(--type-article) 18%, transparent),
    0 0 0 1.5px color-mix(in srgb, var(--type-article-strong) 15%, transparent);
  animation: pulseGlowHover 2s ease-in-out infinite,
             gradientFlow 5s ease-in-out infinite;
  border-color: color-mix(in srgb, var(--type-article) 35%, transparent);
}

.note-capsule:hover .note-type-top-accent.quick-type {
  background-position: 100% 0%;
  box-shadow: 
    0 6px 24px color-mix(
      in srgb,
      var(--type-quick-strong) 45%,
      transparent
    ),
    0 0 0 0.75px color-mix(
      in srgb,
      var(--type-quick) 32%,
      transparent
    ) inset,
    0 4px 10px color-mix(
      in srgb,
      var(--type-quick-strong) 30%,
      transparent
    ),
    0 0 40px color-mix(
      in srgb,
      var(--type-quick) 20%,
      transparent
    ),
    0 0 0 1.5px color-mix(
      in srgb,
      var(--type-quick-strong) 22%,
      transparent
    );
  animation: pulseGlowHoverQuick 2s ease-in-out infinite,
             gradientFlow 5s ease-in-out infinite;
  border-color: color-mix(in srgb, var(--type-quick) 40%, transparent);
}

/* 闪烁点动画 */
.note-capsule:hover .accent-dot {
  opacity: 1;
  animation: dotPulse 1.5s ease-in-out infinite;
}

.note-capsule:hover .accent-dot-1 {
  animation-delay: 0s;
}

.note-capsule:hover .accent-dot-2 {
  animation-delay: 0.75s;
}

/* 点击状态 - 增强 */
.note-capsule:active .note-type-top-accent {
  width: 100px;
  height: 4.2px;
  transform: scaleY(0.92) translateY(0.2px);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  border-width: 0.5px;
}

.note-capsule:active .note-type-top-accent::before {
  animation: none;
  left: 100%;
  transition: left 0.15s ease;
  opacity: 0.8;
}

.note-capsule:active .note-type-top-accent::after {
  opacity: 0.4;
  height: 350%;
  filter: blur(7px);
}

.note-capsule:active .accent-dot {
  opacity: 0.7;
  animation: none;
  transform: scale(0.9);
}

/* 展开状态 - 增强 */
.note-capsule.is-expanded .note-type-top-accent {
  width: 115px;
  height: 4.2px;
  opacity: 1;
  border-radius: 22px 0 6px 0;
}

.note-capsule.is-expanded .note-type-top-accent.article-type {
  background-position: 50% 0%;
  box-shadow: 
    0 5px 22px color-mix(in srgb, var(--type-article-shadow-hover) 95%, transparent),
    0 0 0 0.6px color-mix(in srgb, var(--type-article) 22%, transparent) inset,
    0 3px 9px color-mix(in srgb, var(--type-article-shadow) 83%, transparent),
    0 0 32px color-mix(in srgb, var(--type-article) 15%, transparent),
    0 0 0 1.2px color-mix(in srgb, var(--type-article-strong) 12%, transparent);
  border-color: color-mix(in srgb, var(--type-article) 28%, transparent);
}

.note-capsule.is-expanded .note-type-top-accent.quick-type {
  background-position: 50% 0%;
  box-shadow: 
    0 5px 22px color-mix(
      in srgb,
      var(--type-quick-strong) 38%,
      transparent
    ),
    0 0 0 0.6px color-mix(
      in srgb,
      var(--type-quick) 24%,
      transparent
    ) inset,
    0 3px 9px color-mix(
      in srgb,
      var(--type-quick-strong) 26%,
      transparent
    ),
    0 0 32px color-mix(
      in srgb,
      var(--type-quick) 16%,
      transparent
    ),
    0 0 0 1.2px color-mix(
      in srgb,
      var(--type-quick-strong) 18%,
      transparent
    );
  border-color: color-mix(
    in srgb,
    var(--type-quick) 34%,
    transparent
  );
}

.note-capsule.is-expanded .accent-dot {
  opacity: 0.8;
}

/* 闪烁点样式 */
.accent-dot {
  position: absolute;
  top: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.4s ease;
  z-index: 3;
}

.accent-dot-1 {
  left: 15px;
}

.accent-dot-2 {
  left: 35px;
}

.note-type-top-accent.article-type .accent-dot {
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--type-article) 80%, transparent),
              0 0 12px color-mix(in srgb, var(--type-article) 50%, transparent);
}

.note-type-top-accent.quick-type .accent-dot {
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  box-shadow:
    0 0 6px color-mix(
      in srgb,
      var(--type-quick-strong) 80%,
      transparent
    ),
    0 0 12px color-mix(
      in srgb,
      var(--type-quick-strong) 50%,
      transparent
    );
}

/* 动画定义 */
@keyframes accentFadeIn {
  0% {
    opacity: 0;
    transform: scaleX(0.3) translateX(-10px);
  }
  60% {
    opacity: 0.85;
    transform: scaleX(1.05) translateX(2px);
  }
  100% {
    opacity: 0.92;
    transform: scaleX(1) translateX(0);
  }
}

@keyframes shimmerSweep {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: -100%;
  }
}

@keyframes gradientFlow {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 0%;
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.25;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 0.35;
    transform: translateY(-50%) scale(1.05);
  }
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.6;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-50%) scale(1.4);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 
      0 2px 12px color-mix(in srgb, var(--type-article-shadow) 93%, transparent),
      0 0 0 0.5px color-mix(in srgb, var(--type-article-border) 100%, transparent) inset,
      0 1px 4px color-mix(in srgb, var(--type-article-shadow) 60%, transparent),
      0 0 20px color-mix(in srgb, var(--type-article) 10%, transparent);
  }
  50% {
    box-shadow: 
      0 3px 14px color-mix(in srgb, var(--type-article-shadow) 107%, transparent),
      0 0 0 0.5px color-mix(in srgb, var(--type-article-border) 120%, transparent) inset,
      0 2px 5px color-mix(in srgb, var(--type-article-shadow) 67%, transparent),
      0 0 25px color-mix(in srgb, var(--type-article) 12%, transparent);
  }
}

.note-type-top-accent.quick-type {
  animation-name: pulseGlowQuick;
}

@keyframes pulseGlowQuick {
  0%, 100% {
    box-shadow: 
      0 2px 12px color-mix(
        in srgb,
        var(--color-accent-strong) 28%,
        transparent
      ),
      0 0 0 0.5px color-mix(
        in srgb,
        var(--color-accent) 18%,
        transparent
      ) inset,
      0 1px 4px color-mix(
        in srgb,
        var(--color-accent-strong) 20%,
        transparent
      ),
      0 0 20px color-mix(
        in srgb,
        var(--color-accent) 12%,
        transparent
      );
  }
  50% {
    box-shadow: 
      0 3px 14px color-mix(
        in srgb,
        var(--color-accent-strong) 34%,
        transparent
      ),
      0 0 0 0.5px color-mix(
        in srgb,
        var(--color-accent) 22%,
        transparent
      ) inset,
      0 2px 5px color-mix(
        in srgb,
        var(--color-accent-strong) 24%,
        transparent
      ),
      0 0 25px color-mix(
        in srgb,
        var(--color-accent) 15%,
        transparent
      );
  }
}

@keyframes pulseGlowHover {
  0%, 100% {
    box-shadow: 
      0 5px 20px var(--type-article-shadow-hover),
      0 0 0 0.5px color-mix(in srgb, var(--type-article) 25%, transparent) inset,
      0 3px 8px color-mix(in srgb, var(--type-article-shadow) 83%, transparent),
      0 0 30px color-mix(in srgb, var(--type-article) 15%, transparent);
  }
  50% {
    box-shadow: 
      0 6px 24px color-mix(in srgb, var(--type-article-shadow-hover) 112%, transparent),
      0 0 0 0.5px color-mix(in srgb, var(--type-article) 30%, transparent) inset,
      0 4px 10px var(--type-article-shadow),
      0 0 35px color-mix(in srgb, var(--type-article) 18%, transparent);
  }
}

.note-capsule:hover .note-type-top-accent.quick-type {
  animation-name: pulseGlowHoverQuick;
}

@keyframes pulseGlowHoverQuick {
  0%, 100% {
    box-shadow: 
      0 5px 20px color-mix(
        in srgb,
        var(--color-accent-strong) 40%,
        transparent
      ),
      0 0 0 0.5px color-mix(
        in srgb,
        var(--color-accent) 26%,
        transparent
      ) inset,
      0 3px 8px color-mix(
        in srgb,
        var(--color-accent-strong) 26%,
        transparent
      ),
      0 0 30px color-mix(
        in srgb,
        var(--color-accent) 18%,
        transparent
      );
  }
  50% {
    box-shadow: 
      0 6px 24px color-mix(
        in srgb,
        var(--color-accent-strong) 46%,
        transparent
      ),
      0 0 0 0.5px color-mix(
        in srgb,
        var(--color-accent) 32%,
        transparent
      ) inset,
      0 4px 10px color-mix(
        in srgb,
        var(--color-accent-strong) 32%,
        transparent
      ),
      0 0 35px color-mix(
        in srgb,
        var(--color-accent) 22%,
        transparent
      );
  }
}

/* 可访问性：减少动画 */
@media (prefers-reduced-motion: reduce) {
  .note-type-top-accent,
  .note-type-top-accent::before,
  .note-type-top-accent::after,
  .accent-dot {
    animation: none !important;
    transition-duration: 0.2s !important;
  }
  
  .note-type-top-accent::before {
    left: -100% !important;
  }
  
  .note-type-top-accent {
    opacity: 0.92 !important;
    animation: none !important;
  }
  
  .accent-dot {
    opacity: 0 !important;
  }
}

/* 方案 5: 小图标徽章 (28px版本) */
.note-type-badge-corner.variant-mini-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-surface) 75%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1.5px solid var(--color-border-subtle);
  z-index: 10;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  box-shadow: 
    0 2px 8px color-mix(in srgb, var(--text-primary) 5%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-surface) 90%, transparent) inset;
}

.note-type-badge-corner.variant-mini-badge.article-type {
  border-color: color-mix(in srgb, var(--type-article-border) 167%, transparent);
  background: color-mix(in srgb, var(--type-article-bg) 114%, transparent);
}

.note-type-badge-corner.variant-mini-badge.quick-type {
  border-color: color-mix(
    in srgb,
    var(--color-accent) 32%,
    transparent
  );
  background: color-mix(
    in srgb,
    var(--color-surface) 82%,
    var(--color-accent) 14%
  );
}

.note-capsule:hover .note-type-badge-corner.variant-mini-badge {
  transform: scale(1.04);
}

.note-type-badge-corner.variant-mini-badge .type-badge-icon {
  width: 16px;
  height: 16px;
}

/* 方案 6: 极简圆点 + 图标 */
.note-type-badge-corner.variant-dot-icon {
  position: absolute;
  top: 18px;
  left: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  z-index: 10;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.note-type-badge-corner.variant-dot-icon.article-type {
  background: var(--type-article-border);
  border: 1px solid var(--type-article-border-hover);
}

.note-type-badge-corner.variant-dot-icon.quick-type {
  background: color-mix(
    in srgb,
    var(--color-accent) 18%,
    transparent
  );
  border: 1px solid color-mix(
    in srgb,
    var(--color-accent) 34%,
    transparent
  );
}

.note-capsule:hover .note-type-badge-corner.variant-dot-icon {
  transform: scale(1.02);
}

.note-type-badge-corner.variant-dot-icon .type-badge-icon {
  width: 10px;
  height: 10px;
}

.note-type-badge-corner.variant-dot-icon.article-type .type-badge-icon {
  color: var(--type-article);
}

.note-type-badge-corner.variant-dot-icon.quick-type .type-badge-icon {
  color: var(--color-accent-strong);
}

/* ============================================
   Glassmorphism Action Button (Modern & Elegant)
   ============================================ */

.menu-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-border-subtle));
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  opacity: 0;
  will-change: transform, opacity, background, border-color;
  box-shadow: var(--shadow-sm), var(--shadow-inset-soft);
}

.note-capsule:hover .menu-button {
  opacity: 1;
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
  transform: none;
  box-shadow: var(--shadow-sm), var(--shadow-inset-soft);
}

.menu-button:active {
  transform: none;
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));
  transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm), var(--shadow-inset-soft);
}

.menu-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.note-capsule:hover .menu-icon {
  color: var(--color-accent-strong);
  filter: drop-shadow(0 2px 6px color-mix(in srgb, var(--color-accent) 25%, transparent));
}

/* Menu Dropdown - Glassmorphism Style */
.menu-items {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 6px;
  width: auto;
  min-width: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg), var(--shadow-inset-soft);
  border: 1px solid var(--color-border-subtle);
  padding: 4px;
  z-index: 50;
  outline: none;
}

.menu-item {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.menu-item .item-icon {
  width: 14px;
  height: 14px;
}

.menu-item.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 14%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 18%, transparent)
  );
  color: color-mix(
    in srgb,
    var(--color-accent-strong) 95%,
    var(--color-text-body)
  );
  transform: scale(1.1);
  box-shadow:
    0 4px 12px color-mix(
      in srgb,
      var(--color-accent) 30%,
      transparent
    ),
    0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent) inset;
}

.menu-item:active {
  transform: scale(0.95);
}

.menu-item.danger {
  color: var(--color-status-danger);
}

.menu-item.danger.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-danger) 14%, transparent),
    color-mix(in srgb, var(--color-danger-soft) 18%, transparent)
  );
  color: color-mix(in srgb, var(--color-danger) 95%, var(--color-text-body));
  box-shadow:
    0 4px 12px color-mix(
      in srgb,
      var(--color-danger) 30%,
      transparent
    ),
    0 0 0 1px color-mix(in srgb, var(--color-danger) 20%, transparent) inset;
}

.menu-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-subtle);
  margin: 0 2px;
  flex-shrink: 0;
}



/* ============================================
   Glassmorphism Expand Indicator (Modern & Elegant)
    ============================================ */

.expand-indicator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent) 30%, transparent) 0%,
    color-mix(in srgb, var(--color-accent) 12%, transparent) 100%
  );
  transform: translate(-50%, -50%);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: width, height;
}

.expand-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 14%, transparent) 0%,
    transparent 50%,
    color-mix(in srgb, var(--color-accent) 8%, transparent) 100%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  border-radius: inherit;
  pointer-events: none;
}

.note-capsule:hover .expand-indicator {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 16%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 25%, transparent)
  );
  border-color: var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 40%, transparent)
  );
  transform: scale(1.03);
  box-shadow:
    var(
      --state-accent-soft-shadow,
      0 8px 20px color-mix(
        in srgb,
        var(--color-accent-strong) 35%,
        transparent
      )
    ),
    0 0 0 1px color-mix(
      in srgb,
      var(--color-accent) 26%,
      transparent
    ) inset;
}

.note-capsule:hover .expand-indicator::before {
  width: 100%;
  height: 100%;
}

.note-capsule:hover .expand-indicator::after {
  opacity: 1;
}

.expand-indicator:active {
  transform: scale(0.96) rotate(3deg);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 20%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 30%, transparent)
  );
  box-shadow:
    0 2px 8px color-mix(in srgb, var(--color-accent) 25%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-surface) 95%, transparent) inset;
}

.expand-icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, color;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 0 transparent);
}

.note-capsule:hover .expand-icon {
  color: var(--color-accent-strong);
  filter: drop-shadow(
    0 2px 4px color-mix(
      in srgb,
      var(--color-accent-strong) 40%,
      transparent
    )
  );
  transform: none;
}

.expand-icon.rotated {
  transform: rotate(180deg);
  color: var(--color-accent-strong);
  filter: drop-shadow(
    0 2px 4px color-mix(
      in srgb,
      var(--color-accent-strong) 40%,
      transparent
    )
  );
}

.note-capsule:hover .expand-icon.rotated {
  transform: rotate(180deg);
}

/* ============================================
   Glassmorphism Expanded Content
   ============================================ */

 .expanded-content {
  overflow: visible;
  animation: expandContent 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
  margin-top: 24px;
  position: relative;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--color-border-subtle) 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
}

.expanded-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.08) 0%,
    rgba(139, 92, 246, 0.03) 100%
  );
  pointer-events: none;
  border-radius: inherit;
  z-index: -1;
}

/* Content Divider */
.content-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-accent) 35%, transparent) 20%,
    color-mix(in srgb, var(--color-accent) 50%, transparent) 50%,
    color-mix(in srgb, var(--color-accent) 35%, transparent) 80%,
    transparent 100%
  );
  margin-bottom: 20px;
  opacity: 0.6;
  filter: blur(1px);
}

.full-content {
  font-size: 15px;
  color: var(--color-text-body);
  line-height: 1.8;
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 0 4px;
  position: relative;
  z-index: 1;
}

/* ============================================
   Glassmorphism Tags & Meta Info
   ============================================ */

.tags-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-surface) 80%, transparent),
    color-mix(in srgb, var(--color-surface) 95%, transparent)
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid var(--color-border-subtle);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.tags-container:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-surface) 90%, transparent),
    color-mix(in srgb, var(--color-surface) 98%, transparent)
  );
  border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px color-mix(in srgb, var(--color-accent) 15%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-surface) 95%, transparent) inset;
}

.tags-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-surface) 25%, transparent), transparent);
  transition: left 0.6s ease;
  will-change: left;
}

.tags-container:hover::before {
  left: 100%;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.tag {
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 12%, transparent),
    color-mix(in srgb, var(--color-accent) 18%, transparent)
  );
  color: color-mix(
    in srgb,
    var(--color-accent-strong) 95%,
    var(--color-text-body)
  );
  border: 1.5px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-surface) 25%, transparent), transparent);
  transition: left 0.6s ease;
}

.tag:hover::before {
  left: 100%;
}

.tag:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 18%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 25%, transparent)
  );
  border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

/* Meta Info */
.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  font-size: 12px;
  position: relative;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.25s ease;
  cursor: pointer;
}

.meta-item:hover {
  color: var(--color-text-body);
}

.meta-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.meta-item:hover .meta-icon {
  opacity: 1;
  transform: translateY(-1px);
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--color-accent) 30%, transparent));
}

@keyframes expandContent {
  0% {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.content-divider {
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-accent) 25%, transparent) 20%,
    color-mix(in srgb, var(--color-accent) 50%, transparent) 50%,
    color-mix(in srgb, var(--color-accent) 25%, transparent) 80%,
    transparent 100%
  );
  margin: 28px 0;
  border-radius: 2px;
  animation: dividerExpand 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s backwards;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px color-mix(
    in srgb,
    var(--color-accent) 24%,
    transparent
  );
}

.content-divider::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%,
    color-mix(in srgb, var(--color-surface) 30%, transparent) 30%,
    color-mix(in srgb, var(--color-surface) 50%, transparent) 50%,
    color-mix(in srgb, var(--color-surface) 30%, transparent) 70%,
    transparent 100%
  );
  opacity: 0.6;
  border-radius: inherit;
}

.content-divider::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    color-mix(in srgb, var(--color-surface) 80%, transparent) 30%,
    color-mix(in srgb, var(--color-surface) 100%, transparent) 50%,
    color-mix(in srgb, var(--color-surface) 80%, transparent) 70%,
    transparent 100%
  );
  animation: dividerShimmer 3s ease-in-out infinite;
  border-radius: inherit;
}

@keyframes dividerShimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes dividerExpand {
  0% {
    width: 0;
    opacity: 0;
    transform: scaleX(0);
  }
  50% {
    opacity: 0.7;
  }
  100% {
    width: 100%;
    opacity: 1;
    transform: scaleX(1);
  }
}

.full-content {
  color: var(--color-text-body);
  line-height: 1.85;
  white-space: pre-wrap;
  font-size: 15.5px;
  word-break: break-word;
  overflow-wrap: break-word;
  animation: contentFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
  letter-spacing: 0.01em;
  will-change: opacity, transform;
}

@keyframes contentFadeIn {
  0% {
    opacity: 0;
    transform: translateY(6px);
    filter: blur(2px);
  }
  60% {
    opacity: 0.8;
    filter: blur(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* Tags */
.tags-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 8px 14px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 10%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 6%, transparent)
  );
  border-radius: 12px;
  border: 1px solid var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 26%, transparent)
  );
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
  box-shadow: var(
      --state-accent-soft-shadow,
      0 6px 16px color-mix(
        in srgb,
        var(--color-accent-strong) 22%,
        transparent
      )
    ),
    0 0 0 0.5px color-mix(
      in srgb,
      var(--color-accent) 12%,
      transparent
    ) inset;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.tags-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-on-accent) 30%, transparent), transparent);
  transition: left 0.6s ease;
}

.note-capsule:hover .tags-container {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 18%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 12%, transparent)
  );
  border-color: var(
    --state-accent-strong-border,
    color-mix(in srgb, var(--color-accent-strong) 40%, transparent)
  );
  box-shadow: var(
      --state-accent-soft-shadow,
      0 8px 20px color-mix(
        in srgb,
        var(--color-accent-strong) 30%,
        transparent
      )
    ),
    0 0 0 0.5px color-mix(
      in srgb,
      var(--color-accent) 16%,
      transparent
    ) inset;
}

.note-capsule:hover .tags-container::before {
  left: 100%;
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

.tags-icon {
  width: 18px;
  height: 18px;
  color: var(--color-accent-strong);
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.3s ease;
  filter: drop-shadow(
    0 1px 2px color-mix(
      in srgb,
      var(--color-accent) 28%,
      transparent
    )
  );
}

.note-capsule:hover .tags-icon {
  color: var(--color-accent-strong);
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(
    0 2px 4px color-mix(
      in srgb,
      var(--color-accent-strong) 36%,
      transparent
    )
  );
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 7px 16px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 700;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 26%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 20%, transparent)
  );
  color: color-mix(
    in srgb,
    var(--color-accent-strong) 90%,
    var(--color-text-body)
  );
  border: 1.5px solid var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 40%, transparent)
  );
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              background 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: default;
  user-select: none;
  will-change: transform, box-shadow;
  animation: tagFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  box-shadow: var(
      --state-accent-soft-shadow,
      0 6px 16px color-mix(
        in srgb,
        var(--color-accent-strong) 26%,
        transparent
      )
    ),
    0 0 0 0.5px color-mix(in srgb, var(--color-surface) 30%, transparent) inset;
  position: relative;
  overflow: hidden;
}

.tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%,
    color-mix(in srgb, var(--color-surface) 50%, transparent) 30%,
    color-mix(in srgb, var(--color-surface) 70%, transparent) 50%,
    color-mix(in srgb, var(--color-surface) 50%, transparent) 70%,
    transparent 100%
  );
  transition: left 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: left;
}

.note-capsule:hover .tag {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 32%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 26%, transparent)
  );
  border-color: var(
    --state-accent-strong-border,
    color-mix(in srgb, var(--color-accent-strong) 50%, transparent)
  );
  box-shadow: var(
      --state-accent-soft-shadow,
      0 8px 20px color-mix(
        in srgb,
        var(--color-accent-strong) 36%,
        transparent
      )
    ),
    0 0 0 0.5px color-mix(in srgb, var(--color-surface) 40%, transparent) inset;
  transform: translateY(-2px) scale(1.02);
}

.note-capsule:hover .tag::before {
  left: 100%;
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tag:hover {
  transform: translateY(-3px) scale(1.08);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 40%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 34%, transparent)
  );
  box-shadow: var(
    --state-accent-soft-shadow,
    0 10px 26px color-mix(
      in srgb,
      var(--color-accent-strong) 42%,
      transparent
    )
  );
  border-color: color-mix(
    in srgb,
    var(--color-accent-strong) 55%,
    transparent
  );
}

.tag:hover::before {
  left: 100%;
}

.tag:active {
  transform: translateY(-1px) scale(1.02);
}

.tag:nth-child(1) { animation-delay: 0.1s; }
.tag:nth-child(2) { animation-delay: 0.15s; }
.tag:nth-child(3) { animation-delay: 0.2s; }
.tag:nth-child(4) { animation-delay: 0.25s; }
.tag:nth-child(5) { animation-delay: 0.3s; }
.tag:nth-child(n+6) { animation-delay: 0.35s; }

/* Business-calm overrides */
.note-capsule:hover,
.note-capsule:active,
.note-capsule:hover .date-badge,
.note-capsule:hover .note-type-top-accent,
.note-capsule:hover .accent-dot,
.note-capsule:hover .note-type-badge-corner,
.note-capsule:hover .note-type-badge-dot,
.note-capsule:hover .note-type-side-stripe,
.note-capsule:hover .menu-button,
.note-capsule:hover .expand-indicator,
.note-capsule:hover .expand-icon,
.note-capsule:hover .tags-container,
.note-capsule:hover .tags-icon,
.note-capsule:hover .tag-mini,
.note-capsule:hover .tag,
.tag:hover,
.tag:active {
  transform: none;
}

/* Business-calm animation overrides */
.note-type-top-accent,
.note-type-top-accent::before,
.note-type-top-accent::after,
.accent-dot,
.note-type-badge-dot,
.note-type-badge-corner,
.expand-indicator,
.tags-container,
.tags-preview,
.tag,
.expanded-content,
.divider,
.note-content,
.note-content p,
.note-content ul,
.note-content ol,
.note-content blockquote,
.note-content pre,
.note-content code {
  animation: none;
}

/* Business-calm motion clamp */
.note-capsule,
.note-type-top-accent,
.accent-dot,
.note-type-badge,
.note-type-side-stripe,
.note-type-badge-dot,
.note-type-badge-corner,
.menu-button,
.expand-indicator,
.expand-icon,
.tags-container,
.tags-preview,
.tag,
.divider,
.expanded-content {
  transition: none;
}

/* ==================== Card View Harmonization (Business) ==================== */
.note-capsule {
  border-radius: var(--radius-xl);
  border-color: color-mix(in srgb, var(--text-primary) 10%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--text-primary) 6%, transparent);
}

.note-capsule::before,
.note-capsule::after {
  display: none;
}

.dark .note-capsule::before,
.dark .note-capsule::after {
  display: none;
}

.note-header {
  gap: 14px;
}

.date-badge {
  width: 64px;
  padding: 10px 8px;
  background: color-mix(in srgb, var(--text-primary) 3%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
  box-shadow: none;
}

.date-badge::before,
.date-badge::after {
  display: none;
}

.date-day {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-body);
  text-shadow: none;
}

.date-month,
.date-time {
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-body);
  letter-spacing: 0;
}

.note-title::after {
  opacity: 0;
}

.note-title::after,
.note-capsule:hover .note-title::after {
  display: none;
  opacity: 0;
}

.note-preview {
  font-size: 12.5px;
  color: var(--color-text-muted);
  letter-spacing: 0;
  margin-bottom: 8px;
}

.tags-preview {
  gap: 8px;
}

.tag-mini,
.tag-more {
  background: color-mix(in srgb, var(--text-primary) 4%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
  color: var(--color-text-muted);
}

.note-capsule.grid-mode {
  padding: 20px;
  min-height: 0;
}

.note-capsule.grid-mode .note-header {
  align-items: flex-start;
}

.note-capsule.grid-mode .note-title {
  font-size: 16px;
}

.note-capsule.grid-mode .note-preview {
  line-height: 1.5;
}

/* Meta Info */
.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  font-size: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.25s ease;
}

.meta-item:hover {
  color: var(--color-text-body);
}

.meta-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.7;
}

/* ============================================
   Grid Mode Styles - Compact Card Design
   ============================================ */

 /* Grid mode base card - compact */
.note-capsule.grid-mode {
  height: 158px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
}

/* Grid mode hover effects */
.note-capsule.grid-mode:hover {
  transform: translateY(-3px);
}

.note-capsule.grid-mode:active {
  transform: translateY(-1px);
}

/* Type accent bar - grid mode */
.note-capsule.grid-mode .note-type-top-accent {
  border-radius: 16px 16px 0 0;
  left: -1px;
  top: -1px;
  width: calc(100% + 2px);
}

/* Header - flex layout (timeline style) */
.note-capsule.grid-mode .note-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

/* Content area - grid mode */
.note-capsule.grid-mode .note-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Title - grid mode (compact) */
.note-capsule.grid-mode .note-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

/* Preview - grid mode (compact) */
.note-capsule.grid-mode .note-preview {
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 13px;
  line-height: 1.55;
  height: 3.1em;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}

/* Tags - grid mode */
.note-capsule.grid-mode .tags-preview {
  margin-top: 8px;
  align-self: flex-start;
}

/* Actions menu - grid mode */
.note-capsule.grid-mode .actions-menu {
  opacity: 0;
  transition: opacity 0.2s ease;
  position: relative;
}

.note-capsule.grid-mode:hover .actions-menu {
  opacity: 1;
}

.note-capsule.grid-mode .actions-menu .menu-items {
  position: absolute;
  left: auto;
  right: -8px;
  top: 100%;
  margin-top: 6px;
  z-index: 100;
}

/* Actions menu - timeline mode */
.note-capsule:not(.grid-mode) .actions-menu {
  position: relative;
}

.note-capsule:not(.grid-mode) .actions-menu .menu-items {
  left: auto;
  right: 0;
  top: 100%;
  margin-top: 8px;
  transform: none;
}

/* Tag mini - grid mode (compact) */
.note-capsule.grid-mode .tag-mini {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .note-capsule.grid-mode {
    height: 160px;
    padding: 16px;
  }

  .note-capsule.grid-mode .note-header {
    gap: 12px;
  }

  .note-capsule.grid-mode .note-title {
    font-size: 15px;
  }

  .note-capsule.grid-mode .note-preview {
    font-size: 12px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .note-capsule.grid-mode .tag-mini {
    font-size: 9px;
    padding: 2px 6px;
  }
}

/* ==================== Card View Rebuild (Grid Mode) ==================== */
.note-capsule.grid-mode {
  height: auto;
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-capsule.grid-mode .note-header {
  align-items: center;
  gap: 14px;
}

.note-capsule.grid-mode .date-badge {
  width: 58px;
  padding: 10px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--text-primary) 2%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
  box-shadow: none;
}

.note-capsule.grid-mode .date-day {
  font-size: 24px;
  font-weight: 700;
}

.note-capsule.grid-mode .date-month,
.note-capsule.grid-mode .date-time {
  font-size: 9px;
  letter-spacing: 0.05em;
}

.note-capsule.grid-mode .note-content {
  gap: 6px;
}

.note-capsule.grid-mode .note-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 0;
}

.note-capsule.grid-mode .note-preview {
  font-size: 12.5px;
  line-height: 1.5;
  height: 3em;
  margin-bottom: 0;
}

.note-capsule.grid-mode .tags-preview {
  margin-top: 6px;
  gap: 6px;
}

.note-capsule.grid-mode .tag-mini,
.note-capsule.grid-mode .tag-more {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
}

.note-capsule.grid-mode .actions-menu {
  opacity: 1;
}

@media (max-width: 640px) {
  .note-capsule.grid-mode {
    padding: 16px;
  }

  .note-capsule.grid-mode .date-badge {
    width: 54px;
  }
}
</style>
