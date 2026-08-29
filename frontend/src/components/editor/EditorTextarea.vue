<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ modelValue: string; placeholder: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

const { t } = useI18n();
const ta = ref<HTMLTextAreaElement | null>(null);

function autoGrow() {
  const el = ta.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
  autoGrow();
}

/** 在光标处插入/包裹文本，返回是否成功 */
function applyTransform(fn: (start: string, end: string) => { text: string; pos: number }): boolean {
  const el = ta.value;
  if (!el) return false;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const value = props.modelValue;
  const selected = value.slice(start, end);
  const { text, pos } = fn(selected, value);
  const next = value.slice(0, start) + text + value.slice(end);
  emit('update:modelValue', next);
  el.focus();
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = start + pos;
    autoGrow();
  });
  return true;
}

function handleKeydown(e: KeyboardEvent) {
  const el = ta.value;
  if (!el) return;
  // Tab 缩进
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = props.modelValue;
    emit('update:modelValue', value.slice(0, start) + '  ' + value.slice(end));
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  }
  // ⌘S 保存（由父级监听）
}

defineExpose({ applyTransform, focus: () => ta.value?.focus() });

onMounted(autoGrow);
watch(() => props.modelValue, autoGrow);
</script>

<template>
  <textarea
    ref="ta"
    class="editor-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    spellcheck="true"
    @input="onInput"
    @keydown="handleKeydown"
  ></textarea>
</template>

<style scoped>
.editor-textarea {
  width: 100%;
  min-height: 320px;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15.5px;
  line-height: 1.85;
  color: var(--ink-900);
  caret-color: var(--accent);
  overflow: hidden;
  font-family: var(--font-sans);
  letter-spacing: 0.012em;
}
.editor-textarea::placeholder {
  color: var(--ink-500);
}
</style>
