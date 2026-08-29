<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotesStore } from '../../stores/notes';
import TagChip from '../ui/TagChip.vue';

const props = defineProps<{ modelValue: string[]; max?: number }>();
const emit = defineEmits<{ 'update:modelValue': [v: string[]] }>();

const { t } = useI18n();
const notes = useNotesStore();
const input = ref('');
const max = props.max ?? 20;

const suggestions = computed(() => {
  const q = input.value.trim().toLowerCase();
  if (!q) return [];
  return notes.tagsWithCount
    .map((x) => x.name)
    .filter((name) => name.toLowerCase().includes(q) && !props.modelValue.includes(name))
    .slice(0, 6);
});

function addTag(tag: string) {
  const clean = tag.trim();
  if (!clean) return;
  if (props.modelValue.length >= max) return;
  if (props.modelValue.includes(clean)) {
    input.value = '';
    return;
  }
  emit('update:modelValue', [...props.modelValue, clean]);
  input.value = '';
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    if (input.value.trim()) {
      addTag(input.value);
    }
  } else if (e.key === 'Backspace' && !input.value && props.modelValue.length) {
    removeTag(props.modelValue[props.modelValue.length - 1]);
  }
}

function removeTag(tag: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((x) => x !== tag),
  );
}

function pickSuggestion(tag: string) {
  addTag(tag);
}
</script>

<template>
  <div class="tag-editor">
    <div class="tag-row">
      <span v-for="tag in modelValue" :key="tag" class="tag-slot">
        <TagChip :tag="tag" removable @remove="removeTag" />
      </span>
      <input
        v-model="input"
        class="tag-input"
        type="text"
        :placeholder="modelValue.length ? '' : t('editor.tagsPlaceholder')"
        :aria-label="t('editor.tagsPlaceholder')"
        @keydown="onKeydown"
        @blur="input.trim() && addTag(input)"
      />
    </div>
    <div v-if="suggestions.length" class="tag-suggest">
      <button
        v-for="s in suggestions"
        :key="s"
        type="button"
        class="suggest-item"
        @mousedown.prevent="pickSuggestion(s)"
      >
        {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tag-editor {
  position: relative;
}
.tag-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  background: var(--paper-1);
  border: 1px solid var(--line);
  cursor: text;
}
.tag-row:focus-within {
  border-color: var(--accent-ring);
}
.tag-slot {
  display: inline-flex;
}
.tag-input {
  flex: 1;
  min-width: 120px;
  height: 24px;
  font-size: 13px;
  color: var(--ink-900);
}
.tag-input::placeholder {
  color: var(--ink-500);
}
.tag-suggest {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px;
  border-radius: var(--radius-md);
  background: var(--paper-0);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-2);
}
.suggest-item {
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  background: var(--paper-1);
  font-size: 12px;
  color: var(--ink-700);
}
.suggest-item:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
</style>
