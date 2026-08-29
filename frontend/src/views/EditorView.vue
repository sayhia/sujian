<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, inject, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { notesApi } from '../services/notes';
import { useNotesStore } from '../stores/notes';
import { useConfirmDialog, useToast } from '../composables/useFeedback';
import { countWords, estimateReadMinutes } from '../composables/useMarkdown';
import { useDateFormat } from '../composables/useDateFormat';
import EditorHeader from '../components/editor/EditorHeader.vue';
import EditorToolbar, { type ToolbarAction } from '../components/editor/EditorToolbar.vue';
import EditorTextarea from '../components/editor/EditorTextarea.vue';
import MarkdownViewer from '../components/editor/MarkdownViewer.vue';
import TagEditor from '../components/editor/TagEditor.vue';
import type { Note, NoteType } from '../types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const notes = useNotesStore();
const { showConfirm } = useConfirmDialog();
const toast = useToast();

const mode = ref<'create' | 'edit'>('create');
const noteType = ref<NoteType>('quick');
const noteId = ref<number | null>(null);
const currentNote = ref<Note | null>(null);

const title = ref('');
const content = ref('');
const tags = ref<string[]>([]);

const editorMode = ref<'write' | 'preview' | 'split'>('write');
const showToc = ref(false);
const titleInput = ref<HTMLTextAreaElement | null>(null);
const textareaRef = ref<InstanceType<typeof EditorTextarea> | null>(null);

// 保存状态
const saving = ref(false);
const autosaving = ref(false);
const hasUnsaved = ref(false);
const lastSaved = ref<string | null>(null);
const dirty = ref(false);
const initialized = ref(false);

const stats = computed(() => ({
  words: countWords(content.value),
  minutes: estimateReadMinutes(content.value),
}));
const updatedAt = computed(() => currentNote.value?.updated_at);
const updatedText = useDateFormat(updatedAt, { includeTime: true });

/* ---------- 表单校验 ---------- */
const titleError = computed(() => {
  if (title.value && title.value.trim().length < 2) return t('editor.titleTooShort');
  if (title.value.length > 200) return t('editor.titleTooLong');
  return '';
});
const canSave = computed(() => !titleError.value && (title.value.trim() || content.value.trim()));

/* ---------- 保存 ---------- */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let draftTimer: ReturnType<typeof setTimeout> | null = null;

async function persist(autosave: boolean): Promise<boolean> {
  if (!canSave.value) return false;
  saving.value = !autosave;
  autosaving.value = autosave;
  try {
    if (mode.value === 'edit' && noteId.value) {
      const updated = await notes.updateNote(noteId.value, { title: title.value, content: content.value, tags: tags.value });
      if (updated) {
        currentNote.value = updated;
        noteId.value = updated.id;
      }
      lastSaved.value = new Date().toISOString();
      dirty.value = false;
      return true;
    }
    // create 模式：保存后跳回首页并清草稿
    const note = await notes.createNote({ title: title.value, content: content.value, tags: tags.value, type: noteType.value });
    if (note) {
      await notesApi.deleteDraft(null).catch(() => undefined);
      toast(t('toast.noteCreated'), 'success');
      router.push('/');
      return true;
    }
    return false;
  } catch (e) {
    console.error('保存失败:', e);
    toast(t('editor.saveFailed'), 'error');
    return false;
  } finally {
    saving.value = false;
    autosaving.value = false;
  }
}

function handleSave() {
  persist(false);
}

function scheduleAutosave() {
  if (mode.value !== 'edit') return;
  dirty.value = true;
  hasUnsaved.value = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await persist(true);
  }, 1500);
}

function scheduleDraft() {
  if (mode.value !== 'create') return;
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    notesApi
      .saveDraft(null, JSON.stringify({ title: title.value, content: content.value, tags: tags.value, type: noteType.value }))
      .catch(() => undefined);
  }, 1200);
}

/* ---------- 草稿恢复（创建模式） ---------- */
async function restoreDraft() {
  if (mode.value !== 'create') return;
  try {
    const payload = await notesApi.getDraft(null);
    if (payload) {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.title === 'string') title.value = parsed.title;
        if (typeof parsed.content === 'string') content.value = parsed.content;
        if (Array.isArray(parsed.tags)) tags.value = parsed.tags.filter((x: unknown) => typeof x === 'string');
        if (parsed.type === 'article' || parsed.type === 'quick') noteType.value = parsed.type;
        if (parsed.title || parsed.content) {
          toast(t('editor.draftRestored'), 'info');
        }
      }
    }
  } catch {
    /* 无草稿 */
  }
}

/* ---------- 工具栏动作 ---------- */
function applyToolbarAction(action: ToolbarAction) {
  if (editorMode.value === 'preview') return;
  if (action === 'undo' || action === 'redo') {
    document.execCommand(action);
    return;
  }
  const map: Partial<Record<ToolbarAction, [string, string]>> = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    strike: ['~~', '~~'],
    h1: ['# ', ''],
    h2: ['## ', ''],
    h3: ['### ', ''],
    quote: ['> ', ''],
    ul: ['- ', ''],
    ol: ['1. ', ''],
    code: ['`', '`'],
    codeblock: ['```\n', '\n```'],
    link: ['[', '](https://)'],
    image: ['![', '](https://)'],
    table: ['\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n', ''],
    hr: ['\n---\n', ''],
  };
  const pair = map[action];
  if (!pair) return;
  textareaRef.value?.applyTransform((selected) => {
    const [prefix, suffix] = pair!;
    const text = prefix + selected + suffix;
    const pos = prefix.length + selected.length;
    return { text, pos };
  });
}

/* ---------- 离开确认 ---------- */
async function handleBack() {
  if (dirty.value) {
    const ok = await showConfirm({
      title: t('editor.unsavedChanges'),
      message: t('editor.unsavedChangesMessage'),
      type: 'warning',
      confirmText: t('editor.discard'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
  }
  router.push('/');
}

function handleCancel() {
  if (mode.value === 'edit') {
    router.push('/');
    return;
  }
  handleBack();
}

/* ---------- 快捷键 ---------- */
function onKeydown(e: KeyboardEvent) {
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.key.toLowerCase() === 's') {
    e.preventDefault();
    handleSave();
  } else if (e.key === 'Escape' && !e.metaKey) {
    e.preventDefault();
    handleBack();
  }
}

/* ---------- 初始化 ---------- */
onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  mode.value = (route.meta.mode as 'create' | 'edit') || 'create';
  const routeType = route.meta.type;
  noteType.value = routeType === 'article' ? 'article' : 'quick';

  if (mode.value === 'edit' && route.params.id) {
    const id = Number(route.params.id);
    const note = await notes.getNote(id);
    if (!note) {
      toast(t('toast.actionFailed'), 'error');
      router.push('/');
      return;
    }
    noteId.value = note.id;
    currentNote.value = note;
    noteType.value = note.type;
    title.value = note.title;
    content.value = note.content;
    tags.value = [...note.tags];
    lastSaved.value = note.updated_at;
  } else {
    await restoreDraft();
  }

  await nextTick();
  initialized.value = true;
  titleInput.value?.focus();
  if (title.value) textareaRef.value?.focus();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (saveTimer) clearTimeout(saveTimer);
  if (draftTimer) clearTimeout(draftTimer);
});

watch([title, content, tags, noteType], () => {
  if (!initialized.value) return;
  scheduleAutosave();
  scheduleDraft();
});

function autoGrowTitle() {
  const el = titleInput.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
</script>

<template>
  <div class="editor-view">
    <EditorHeader
      :mode="mode"
      :note-type="noteType"
      :can-create-type="mode === 'create'"
      :saving="saving"
      :autosaving="autosaving"
      :has-unsaved="hasUnsaved"
      :last-saved="lastSaved"
      @back="handleBack"
      @cancel="handleCancel"
      @save="handleSave"
      @type-change="(v) => (noteType = v)"
    />

    <main class="editor-canvas">
      <div class="editor-sheet">
        <div class="title-block">
          <textarea
            ref="titleInput"
            v-model="title"
            class="title-input"
            :placeholder="t('editor.titlePlaceholder')"
            rows="1"
            maxlength="200"
            @input="autoGrowTitle"
            @keydown.enter.prevent="textareaRef?.focus()"
          ></textarea>
          <div class="title-meta">
            <p v-if="titleError" class="field-error" role="alert">{{ titleError }}</p>
            <span v-else-if="title.length > 180" class="title-count" :class="{ near: title.length >= 195 }">
              {{ title.length }}/200
            </span>
          </div>
        </div>

        <TagEditor v-model="tags" />

        <div class="edit-area">
          <EditorToolbar v-model:mode="editorMode" v-model:show-toc="showToc" @action="applyToolbarAction" />

          <div v-if="editorMode === 'write'" class="write-pane">
            <EditorTextarea
              ref="textareaRef"
              v-model="content"
              :placeholder="t('editor.contentPlaceholder')"
            />
          </div>

          <div v-else-if="editorMode === 'preview'" class="preview-pane">
            <MarkdownViewer :content="content" :show-toc="showToc" />
            <p v-if="!content.trim()" class="preview-empty">{{ t('editor.contentPlaceholder') }}</p>
          </div>

          <div v-else class="split-pane">
            <div class="split-left">
              <EditorTextarea
                ref="textareaRef"
                v-model="content"
                :placeholder="t('editor.contentPlaceholder')"
              />
            </div>
            <div class="split-right">
              <MarkdownViewer :content="content" :show-toc="showToc" />
            </div>
          </div>
        </div>

        <footer class="status-bar">
          <span class="sb-item">{{ stats.words }} {{ t('editor.wordCount') }}</span>
          <span class="sb-sep" aria-hidden="true" />
          <span class="sb-item">
            {{ stats.minutes <= 1 ? t('editor.readTimeQuick') : t('editor.readTimeMinutes', { count: stats.minutes }) }}
          </span>
          <span v-if="mode === 'edit' && currentNote" class="sb-spacer" />
          <span v-if="mode === 'edit' && currentNote" class="sb-meta">
            {{ t('editor.updated') }}：{{ updatedText }}
          </span>
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped>
.editor-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--paper-0);
}
.editor-canvas {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 28px 24px 48px;
}
.editor-sheet {
  width: min(var(--content-width), 100%);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.title-input {
  width: 100%;
  resize: none;
  overflow: hidden;
  border: none;
  outline: none;
  background: transparent;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink-900);
  letter-spacing: 0.01em;
  transition: box-shadow var(--dur-med) var(--ease-out);
}
.title-input::placeholder {
  color: var(--ink-500);
}
/* 标题聚焦：底部浮现 accent 细线 */
.title-input {
  background-image: linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0 2px;
  transition: background-size var(--dur-slow) var(--ease-out);
}
.title-input:focus {
  background-size: 100% 2px;
}
.field-error {
  font-size: 12px;
  color: var(--danger);
}
.title-meta {
  min-height: 16px;
}
.title-count {
  font-size: 11px;
  color: var(--ink-500);
  font-variant-numeric: tabular-nums;
}
.title-count.near {
  color: var(--warning);
  font-weight: 600;
}

.edit-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: var(--radius-lg);
  padding: 4px;
  margin: -4px;
  transition: background-color var(--dur-med) var(--ease-out),
    box-shadow var(--dur-med) var(--ease-out);
}
/* 书写区聚焦：纸面微亮 */
.edit-area:focus-within {
  background: color-mix(in srgb, var(--accent-soft) 26%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-soft) 30%, transparent);
}
.write-pane {
  min-height: 340px;
}
.preview-pane {
  position: relative;
}
.preview-empty {
  text-align: center;
  color: var(--ink-500);
  font-size: 13px;
  padding: 60px 0;
}
.split-pane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  min-height: 340px;
}
.split-left {
  padding-right: 18px;
  border-right: 1px solid var(--line);
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-500);
  font-variant-numeric: tabular-nums;
}
.sb-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--ink-500);
  opacity: 0.5;
}
.sb-spacer {
  flex: 1;
}
.sb-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .split-pane {
    grid-template-columns: 1fr;
  }
  .split-left {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid var(--line);
    padding-bottom: 12px;
  }
}
</style>
