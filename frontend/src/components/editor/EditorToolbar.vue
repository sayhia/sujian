<script setup lang="ts">
import { useI18n } from 'vue-i18n';

export type ToolbarAction =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'code'
  | 'codeblock'
  | 'link'
  | 'image'
  | 'table'
  | 'hr';

defineProps<{
  mode: 'write' | 'preview' | 'split';
  showToc: boolean;
}>();
const emit = defineEmits<{
  action: [a: ToolbarAction];
  'update:mode': [m: 'write' | 'preview' | 'split'];
  'update:showToc': [v: boolean];
}>();

const { t } = useI18n();

const groups: { id: string; items: { action: ToolbarAction; title: string; icon: string }[] }[] = [
  {
    id: 'history',
    items: [
      { action: 'undo', title: 'Undo', icon: 'M3 7v6h6M3.5 13a9 9 0 1 0 2.1-9.4L3 7' },
      { action: 'redo', title: 'Redo', icon: 'M21 7v6h-6M20.5 13a9 9 0 1 1-2.1-9.4L21 7' },
    ],
  },
  {
    id: 'style',
    items: [
      { action: 'bold', title: 'Bold', icon: 'M7 5h6.5a3.5 3.5 0 0 1 0 7H7z M7 12h7.5a3.5 3.5 0 0 1 0 7H7z' },
      { action: 'italic', title: 'Italic', icon: 'M19 4h-9M14 20H5M15 4 9 20' },
      { action: 'strike', title: 'Strike', icon: 'M16 4H9a3 3 0 0 0-2.8 4M16 12H5M14.5 16.5a2.5 2.5 0 0 1-2 3.5H9a3 3 0 0 1-2.8-4 M12 12h7M12 12v8' },
    ],
  },
  {
    id: 'head',
    items: [
      { action: 'h1', title: 'H1', icon: 'M4 5v14M11 5v14M4 12h7M16 5l4 14M17.5 9.5h3' },
      { action: 'h2', title: 'H2', icon: 'M4 5v14M11 5v14M4 12h7M20 5v14M17 5h6M17 20h6M20 8.5c.8-.8 1.7-1 2.5-.5.8.5.8 1.5.5 2L20 13h3' },
      { action: 'h3', title: 'H3', icon: 'M4 5v14M11 5v14M4 12h7M20 7c-.6-.7-1.5-1-2.4-.8-1.3.3-2.1 1.5-1.8 2.8.2.8.9 1.3 1.7 1.4M16.8 13.2c.7-.4 1.6-.5 2.3-.2 1.3.4 1.9 1.7 1.3 2.9-.5 1-1.6 1.3-2.6 1-1-.3-1.7-1.2-1.8-2.2' },
    ],
  },
  {
    id: 'list',
    items: [
      { action: 'ul', title: 'List', icon: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01' },
      { action: 'ol', title: 'Numbered list', icon: 'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18c-1 0-2-.5-2-1.5S5 15 6 15s2 .5 2 1.5S7 18 6 18' },
      { action: 'quote', title: 'Quote', icon: 'M17 6H7a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3v-6H7v-1a1 1 0 0 1 1-1h4V6a0 0 0 0 1 0 0M20 6h-3v6h3a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3' },
      { action: 'hr', title: 'Divider', icon: 'M3 12h18' },
    ],
  },
  {
    id: 'insert',
    items: [
      { action: 'code', title: 'Inline code', icon: 'm16 18 6-6-6-6M8 6l-6 6 6 6' },
      { action: 'codeblock', title: 'Code block', icon: 'M9 17l-5-5 5-5M15 7l5 5-5 5' },
      { action: 'link', title: 'Link', icon: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7' },
      { action: 'image', title: 'Image', icon: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6' },
      { action: 'table', title: 'Table', icon: 'M4 6h16v12H4z M4 10h16M10 10v8M16 10v8' },
    ],
  },
];

const modeOptions = [
  { value: 'write' as const, label: t('editor.write'), icon: 'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' },
  { value: 'preview' as const, label: t('editor.preview'), icon: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
  { value: 'split' as const, label: t('editor.split'), icon: 'M12 3v18M4 5h16v14H4z' },
];
</script>

<template>
  <div class="editor-toolbar">
    <div class="tb-groups">
      <div v-for="group in groups" :key="group.id" class="tb-group">
        <button
          v-for="item in group.items"
          :key="item.action"
          type="button"
          class="tb-btn"
          v-tip:bottom="item.title"
          :aria-label="item.title"
          @click="emit('action', item.action)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path :d="item.icon" />
          </svg>
        </button>
      </div>
    </div>
    <div class="tb-side">
      <button
        type="button"
        class="tb-btn"
        :class="{ active: showToc }"
        v-tip:bottom="t('editor.toc')"
        :aria-label="t('editor.toc')"
        @click="emit('update:showToc', !showToc)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
        </svg>
      </button>
      <div class="tb-mode" role="radiogroup" :aria-label="t('editor.typeLabel')">
        <button
          v-for="opt in modeOptions"
          :key="opt.value"
          type="button"
          class="tb-mode-btn"
          :class="{ active: mode === opt.value }"
          role="radio"
          :aria-checked="mode === opt.value"
          v-tip:bottom="opt.label"
          @click="emit('update:mode', opt.value)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path :d="opt.icon" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-1) calc(var(--glass-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--line);
  position: sticky;
  top: calc(var(--header-height) + 10px);
  z-index: 20;
  flex-wrap: wrap;
  box-shadow: var(--shadow-1);
}
.tb-groups {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.tb-group {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px 5px 2px 2px;
  border-right: 1px solid var(--line);
  border-radius: var(--radius-sm);
  transition: background-color var(--dur-fast) var(--ease-out);
}
.tb-group:hover {
  background: color-mix(in srgb, var(--paper-0) 55%, transparent);
}
.tb-group:last-child {
  border-right: none;
}
.tb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  color: var(--ink-700);
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.tb-btn:hover {
  background: var(--paper-2);
  color: var(--ink-900);
  transform: translateY(-1px);
}
.tb-btn:active {
  transform: scale(0.9);
}
.tb-btn.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.tb-btn svg {
  width: 16px;
  height: 16px;
}
.tb-side {
  display: flex;
  align-items: center;
  gap: 2px;
}
.tb-mode {
  display: flex;
  padding: 2px;
  gap: 1px;
  border-radius: var(--radius-sm);
  background: var(--paper-2);
}
.tb-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--ink-500);
}
.tb-mode-btn.active {
  background: var(--paper-0);
  color: var(--accent-strong);
  box-shadow: var(--shadow-1);
}
.tb-mode-btn svg {
  width: 14px;
  height: 14px;
}
</style>
