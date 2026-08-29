<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseButton from '../ui/BaseButton.vue';
import IconButton from '../ui/IconButton.vue';
import Segmented from '../ui/Segmented.vue';
import type { NoteType } from '../../types';

defineProps<{
  mode: 'create' | 'edit';
  noteType: NoteType;
  canCreateType?: boolean;
  saving: boolean;
  autosaving: boolean;
  hasUnsaved: boolean;
  lastSaved: string | null;
}>();

const emit = defineEmits<{
  back: [];
  typeChange: [t: NoteType];
  save: [];
  cancel: [];
}>();

const { t } = useI18n();

const typeOptions = [
  { value: 'quick' as NoteType, label: t('editor.quickNote'), icon: 'M13 2 4.5 20h5L18 2h-5ZM22 22H2' },
  { value: 'article' as NoteType, label: t('editor.article'), icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6' },
];
</script>

<template>
  <header class="editor-header">
    <div class="eh-left">
      <IconButton :label="t('editor.back')" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </IconButton>
      <div class="eh-title">
        <span class="eh-eyebrow">{{ mode === 'create' ? t('common.new') : t('editor.editNote') }}</span>
      </div>
      <Segmented
        v-if="canCreateType"
        class="eh-type"
        :model-value="noteType"
        :options="typeOptions"
        @update:model-value="(v) => emit('typeChange', v as NoteType)"
      />
    </div>

    <div class="eh-right">
      <Transition name="save-fade" mode="out-in">
        <span v-if="autosaving" key="saving" class="eh-status">
          <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          </svg>
          {{ t('editor.autoSaving') }}
        </span>
        <span v-else-if="hasUnsaved" key="dirty" class="eh-status dirty">
          <span class="dirty-dot" />
          {{ t('editor.unsaved') }}
        </span>
        <span v-else-if="lastSaved" key="saved" class="eh-status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {{ t('editor.saved') }}
        </span>
      </Transition>

      <BaseButton variant="ghost" @click="emit('cancel')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton variant="primary" :loading="saving" @click="emit('save')">
        <template v-if="!saving">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          {{ t('editor.save') }}
        </template>
      </BaseButton>
    </div>
  </header>
</template>

<style scoped>
.editor-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: var(--header-height);
  padding: 0 14px;
  background: color-mix(in srgb, var(--paper-0) calc(var(--glass-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 30;
}
.eh-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.eh-eyebrow {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-900);
}
.eh-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.eh-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-500);
  white-space: nowrap;
}
.eh-status svg {
  width: 13px;
  height: 13px;
}
.eh-status.dirty {
  color: var(--warning);
}
.dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning);
}
.spin {
  animation: eh-spin 0.9s linear infinite;
}
@keyframes eh-spin {
  to {
    transform: rotate(360deg);
  }
}
.save-fade-enter-active,
.save-fade-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out);
}
.save-fade-enter-from,
.save-fade-leave-to {
  opacity: 0;
}
</style>
