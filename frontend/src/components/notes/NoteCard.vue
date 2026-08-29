<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { Note } from '../../types';
import TagChip from '../ui/TagChip.vue';
import { useTagColors } from '../../composables/useTagColors';
import { useRelativeDate } from '../../composables/useDateFormat';
import { countWords } from '../../composables/useMarkdown';
import { useUIStore } from '../../stores/ui';

const props = defineProps<{ note: Note; grid?: boolean }>();
const emit = defineEmits<{ archive: [note: Note]; delete: [note: Note] }>();

const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();
const { getTagColor } = useTagColors();
const relDate = useRelativeDate(computed(() => props.note.created_at));

const excerpt = computed(() => {
  const text = props.note.content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 140 ? text.slice(0, 140) + '…' : text;
});

const words = computed(() => countWords(props.note.content));

const visibleTags = computed(() => props.note.tags.slice(0, 3));
const extraTags = computed(() => props.note.tags.length - visibleTags.value.length);

function open() {
  router.push(`/notes/${props.note.id}/edit`);
}

/** 标签即点即筛：归档视图下先回到时间流 */
function filterByTag(tag: string) {
  if (ui.showArchived) ui.showArchived = false;
  if (!ui.selectedTags.includes(tag)) ui.toggleTag(tag);
}
</script>

<template>
  <article class="note-card" :class="{ grid }" @click="open">
    <header class="card-head">
      <span class="card-type" :class="note.type" :title="note.type === 'article' ? t('editor.article') : t('editor.quickNote')">
        <svg v-if="note.type === 'article'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M13 2 4.5 20h5L18 2h-5ZM22 22H2" />
        </svg>
      </span>
      <time class="card-time">{{ relDate }}</time>
      <span v-if="words > 0 && !grid" class="card-words">{{ words }}</span>
      <div class="card-actions" @click.stop>
        <button
          type="button"
          class="card-action"
          v-tip:bottom="note.is_archived ? t('noteCard.unarchive') : t('noteCard.archive')"
          :aria-label="note.is_archived ? t('noteCard.unarchive') : t('noteCard.archive')"
          @click="emit('archive', note)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="4" rx="1.5" />
            <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
            <path v-if="note.is_archived" d="M10 12h4" />
          </svg>
        </button>
        <button
          type="button"
          class="card-action danger"
          v-tip:bottom="t('noteCard.delete')"
          :aria-label="t('noteCard.delete')"
          @click="emit('delete', note)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </header>

    <h3 class="card-title">{{ note.title || t('noteCard.emptyTitle') }}</h3>
    <p v-if="excerpt" class="card-excerpt">{{ excerpt }}</p>

    <footer v-if="note.tags.length" class="card-foot" @click.stop>
      <TagChip
        v-for="tag in visibleTags"
        :key="tag"
        :tag="tag"
        clickable
        @select="filterByTag"
      />
      <span v-if="extraTags > 0" class="card-more" :style="{ color: getTagColor(note.tags[3]) }">
        {{ t('noteCard.moreTags', { count: extraTags }) }}
      </span>
    </footer>
  </article>
</template>

<style scoped>
.note-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: var(--paper-1);
  border: 1px solid var(--line);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--dur-med) var(--ease-out),
    box-shadow var(--dur-med) var(--ease-out), border-color var(--dur-med) var(--ease-out),
    background-color var(--dur-med) var(--ease-out);
}
/* 时间胶囊封口竖条：hover / 聚焦时点亮 */
.note-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
  background: var(--accent);
  opacity: 0;
  transform: scaleY(0.4);
  transition: opacity var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out);
}
.note-card:hover,
.note-card:focus-within {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 22%, var(--line-strong));
  box-shadow: var(--shadow-hover);
  background: color-mix(in srgb, var(--paper-0) 55%, var(--paper-1));
}
.note-card:hover::before,
.note-card:focus-within::before {
  opacity: 1;
  transform: scaleY(1);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-type {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  background: var(--paper-2);
  color: var(--ink-500);
}
.card-type.article {
  color: var(--accent);
  background: var(--accent-soft);
}
.card-type svg {
  width: 12px;
  height: 12px;
}
.card-time {
  flex: 1;
  font-size: 11.5px;
  color: var(--ink-500);
  font-variant-numeric: tabular-nums;
}
.card-words {
  flex: none;
  font-size: 11px;
  color: var(--ink-500);
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.note-card:hover .card-words {
  opacity: 1;
  transform: translateX(0);
}
.card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.note-card:hover .card-actions,
.note-card:focus-within .card-actions {
  opacity: 1;
}
.card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  color: var(--ink-500);
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.card-action:hover {
  background: var(--paper-2);
  color: var(--ink-900);
}
.card-action:active {
  transform: scale(0.88);
}
.card-action.danger:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
.card-action svg {
  width: 14px;
  height: 14px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--ink-900);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-excerpt {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-700);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.card-more {
  font-size: 12px;
}

/* 网格模式微调 */
.note-card.grid {
  gap: 7px;
  padding: 14px 16px;
}
.note-card.grid .card-title {
  font-size: 14px;
}
</style>
