<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { notesApi } from '../../services/notes';
import { useNotesStore } from '../../stores/notes';
import { useToast, useConfirmDialog } from '../../composables/useFeedback';
import BaseButton from '../ui/BaseButton.vue';
import type { Note } from '../../types';

const { t } = useI18n();
const notes = useNotesStore();
const toast = useToast();
const { showConfirm } = useConfirmDialog();

const exporting = ref(false);
const importing = ref(false);
const clearing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

/** 分页拉取全部笔记（含归档） */
async function fetchAllNotes(): Promise<Note[]> {
  const all: Note[] = [];
  const page = 200;
  let offset = 0;
  for (;;) {
    const batch = await notesApi.getAll(page, offset, [], false);
    all.push(...batch);
    if (batch.length < page) break;
    offset += batch.length;
  }
  return all;
}

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleExport() {
  exporting.value = true;
  try {
    const all = await fetchAllNotes();
    const data = {
      app: 'sujian',
      version: 1,
      exported_at: new Date().toISOString(),
      notes: all,
    };
    const stamp = new Date().toISOString().slice(0, 10);
    download(`sujian-export-${stamp}.json`, data);
    toast(t('toast.exportSuccess'), 'success');
  } catch (e) {
    console.error('导出失败:', e);
    toast(t('toast.exportFailed'), 'error');
  } finally {
    exporting.value = false;
  }
}

function handleImportClick() {
  fileInput.value?.click();
}

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  importing.value = true;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed?.notes;
    if (!Array.isArray(list)) throw new Error('bad format');
    const clean = list.filter((n) => n && typeof n.title === 'string');
    const ok = await showConfirm({
      title: t('settings.importConfirmTitle'),
      message: t('settings.importConfirmMessage', { count: clean.length }),
      confirmText: t('settings.importButton'),
    });
    if (!ok) return;
    for (const item of clean) {
      await notesApi.create({
        title: item.title,
        content: typeof item.content === 'string' ? item.content : '',
        tags: Array.isArray(item.tags) ? item.tags.filter((x: unknown) => typeof x === 'string') : [],
        type: item.type === 'article' ? 'article' : 'quick',
      });
    }
    notes.refreshMeta();
    await notes.loadList();
    toast(t('toast.importSuccess'), 'success');
  } catch (e) {
    console.error('导入失败:', e);
    toast(t('toast.importFormatError'), 'error');
  } finally {
    importing.value = false;
  }
}

async function handleClearAll() {
  const ok = await showConfirm({
    title: t('settings.clearAllConfirmTitle'),
    message: t('settings.clearAllConfirmMessage'),
    type: 'danger',
    confirmText: t('settings.clearAllButton'),
  });
  if (!ok) return;
  clearing.value = true;
  try {
    await notesApi.resetAllData();
    notes.refreshMeta();
    await notes.loadList();
    toast(t('toast.clearAllSuccess'), 'success');
  } catch (e) {
    console.error('清空失败:', e);
    toast(t('toast.actionFailed'), 'error');
  } finally {
    clearing.value = false;
  }
}
</script>

<template>
  <section class="section">
    <h4 class="section-title">{{ t('settings.data') }}</h4>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.exportLabel') }}</p>
        <p class="setting-desc">{{ t('settings.exportDesc') }}</p>
      </div>
      <BaseButton variant="secondary" size="sm" :loading="exporting" @click="handleExport">
        {{ t('settings.exportButton') }}
      </BaseButton>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.importLabel') }}</p>
        <p class="setting-desc">{{ t('settings.importDesc') }}</p>
      </div>
      <BaseButton variant="secondary" size="sm" :loading="importing" @click="handleImportClick">
        {{ t('settings.importButton') }}
      </BaseButton>
      <input ref="fileInput" type="file" accept=".json,application/json" class="sr-only" @change="onFilePicked" />
    </div>

    <div class="setting-row danger-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.clearAllLabel') }}</p>
        <p class="setting-desc">{{ t('settings.clearAllDesc') }}</p>
      </div>
      <BaseButton variant="danger" size="sm" :loading="clearing" @click="handleClearAll">
        {{ t('settings.clearAllButton') }}
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
}
.section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ink-500);
  margin-bottom: 8px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 2px;
  border-bottom: 1px solid var(--line);
}
.setting-row:last-child {
  border-bottom: none;
}
.setting-info {
  min-width: 0;
  flex: 1;
}
.setting-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-900);
}
.setting-desc {
  font-size: 12px;
  color: var(--ink-500);
  margin-top: 2px;
}
.danger-row .setting-name {
  color: var(--danger);
}
</style>
