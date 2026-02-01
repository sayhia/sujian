<template>
  <Teleport to="body">
    <TransitionRoot :show="visible">
      <Dialog @close="handleClose" class="article-dialog">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="article-backdrop" />
        </TransitionChild>

        <div class="article-wrapper">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="article-panel">
              <!-- Header -->
              <div class="article-header">
                <div class="article-header-left">
                  <FileText class="article-header-icon" />
                  <DialogTitle as="h2" class="article-title">
                    {{ isEditing ? '编辑文章' : '新建文章' }}
                  </DialogTitle>
                </div>
                  <button
                    @click="handleClose"
                    class="article-close"
                    aria-label="关闭文章编辑器"
                    type="button"
                  >
                  <X class="article-close-icon" aria-hidden="true" />
                </button>
              </div>

              <!-- Editor -->
              <div class="article-editor">
                <form @submit.prevent="handleSubmit" class="article-form">
                  <!-- Title -->
                  <div class="article-form-group">
                    <label for="article-title" class="sr-only">文章标题</label>
                    <input
                      id="article-title"
                      ref="titleInput"
                      v-model="articleData.title"
                      type="text"
                      class="article-title-input"
                      placeholder="文章标题..."
                      required
                      aria-label="文章标题"
                      aria-describedby="article-title-desc"
                    />
                    <span id="article-title-desc" class="sr-only">输入文章的标题</span>
                  </div>

                  <!-- Content -->
                  <div class="article-form-group">
                    <label for="article-content" class="sr-only">文章内容</label>
                    <MarkdownEditor
                      v-model="articleData.content"
                      placeholder="开始写作... 支持 Markdown 语法"
                      aria-label="文章内容"
                    />
                    <span id="article-content-desc" class="sr-only">输入文章的详细内容，支持 Markdown 格式</span>
                  </div>

                  <!-- Tags -->
                  <div class="article-form-group">
                    <div class="article-tags-section">
                      <label for="article-tags" class="article-tags-label">标签</label>
                      <input
                        id="article-tags"
                        v-model="articleTags"
                        type="text"
                        class="article-tags-input"
                        placeholder="用逗号分隔多个标签，如：工作, 重要, TODO"
                        aria-label="文章标签"
                        aria-describedby="article-tags-desc"
                      />
                      <span id="article-tags-desc" class="sr-only">用逗号分隔多个标签</span>
                      <div v-if="parsedTags.length > 0" class="article-tags-preview">
                        <span
                          v-for="tag in parsedTags"
                          :key="tag"
                          class="article-tag-preview"
                        >
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="article-actions">
                    <button
                      type="button"
                      @click="handleClose"
                      class="article-btn-cancel"
                      aria-label="取消编辑文章"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      :disabled="loading"
                      class="article-btn-submit"
                      :aria-label="isEditing ? '保存文章' : '发布文章'"
                      :aria-busy="loading"
                    >
                      <Loader2 v-if="loading" class="article-btn-loading" />
                      <Check v-else class="article-btn-check" />
                      <span>{{ isEditing ? '保存修改' : '发布文章' }}</span>
                    </button>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { FileText, X, Check, Loader2 } from 'lucide-vue-next';
import { useNoteStore } from '../stores/noteStore';
import type { Note, CreateNoteRequest } from '../types';
import { inject } from 'vue';
import MarkdownEditor from './MarkdownEditor.vue';

interface Props {
  visible: boolean;
  note?: Note | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  note: null,
});

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const noteStore = useNoteStore();
const showToast = inject<(message: string, type?: 'success' | 'error' | 'warning' | 'info') => void>('showToast');
const titleInput = ref<HTMLInputElement | null>(null);

const loading = ref(false);
const articleData = ref({ title: '', content: '' });
const articleTags = ref('');

const isEditing = computed(() => !!props.note);

const parsedTags = computed(() => {
  if (!articleTags.value.trim()) return [];
  return articleTags.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.note) {
      articleData.value = {
        title: props.note.title,
        content: props.note.content,
      };
      articleTags.value = props.note.tags ? props.note.tags.join(', ') : '';
    } else {
      articleData.value = { title: '', content: '' };
      articleTags.value = '';
    }
    nextTick(() => {
      titleInput.value?.focus();
    });
  } else {
    // Reset form when closing
    articleData.value = { title: '', content: '' };
    articleTags.value = '';
  }
});

function handleClose() {
  emit('close');
  // 模态框关闭后，焦点返回到搜索框或按钮
  nextTick(() => {
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });
}

async function handleSubmit() {
  loading.value = true;
  try {
    const tags = parsedTags.value;
    
    if (isEditing.value && props.note) {
      await noteStore.updateNote(props.note.id, {
        title: articleData.value.title,
        content: articleData.value.content,
        tags,
        // Note: type cannot be changed after creation
      });
      if (showToast) showToast('文章已更新', 'success');
    } else {
      await noteStore.createNote({
        title: articleData.value.title,
        content: articleData.value.content,
        tags,
        type: 'article', // Set type to article
      });
      if (showToast) showToast('文章已发布', 'success');
    }
    
    await Promise.all([
      noteStore.loadStats(),
      noteStore.loadTagsWithCount()
    ]);
    
    emit('saved');
    handleClose();
  } catch (e) {
    console.error('操作失败:', e);
    if (showToast) showToast('操作失败，请重试', 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.article-dialog {
  position: fixed;
  inset: 0;
  z-index: 10001;
}

.article-backdrop {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--text-primary) 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.article-wrapper {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  padding: 40px 20px;
}

.article-panel {
  background: color-mix(in srgb, var(--color-surface) 99%, transparent);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-2xl, 0 16px 48px color-mix(in srgb, var(--text-primary) 20%, transparent)),
              var(--shadow-lg, 0 8px 24px color-mix(in srgb, var(--text-primary) 12%, transparent));
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 80px);
  border: 1.5px solid var(--color-border-subtle);
  position: relative;
  overflow: hidden;
}

.article-panel::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    color-mix(in srgb, var(--color-palette-3) 12%, transparent) 0%,
    transparent 40%
  ),
  radial-gradient(
    circle at 70% 70%,
    color-mix(in srgb, var(--color-palette-2) 8%, transparent) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.article-panel:hover::before {
  opacity: 1;
}

.article-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.article-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.article-header-icon {
  width: 26px;
  height: 26px;
  color: var(--color-palette-2);
}

.article-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-palette-1);
  margin: 0;
}

.article-close {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1.5px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--color-text-muted);
  user-select: none;
  will-change: transform, background-color, border-color;
  position: relative;
  overflow: hidden;
}

.article-close::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-palette-3) 25%, transparent);
  transform: translate(-50%, -50%);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 0;
}

.article-close:hover {
  background: color-mix(in srgb, var(--color-palette-4) 40%, transparent);
  border-color: color-mix(in srgb, var(--color-palette-3) 50%, transparent);
  color: var(--color-palette-1);
  transform: scale(1.12) rotate(90deg);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-palette-2) 30%, transparent);
}

.article-close:hover::before {
  width: 300%;
  height: 300%;
}

.article-close-icon {
  position: relative;
  z-index: 1;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.article-close:hover .article-close-icon {
  transform: scale(1.1);
}

.article-close:active {
  transform: scale(0.95) rotate(90deg);
  background: color-mix(in srgb, var(--color-accent) 25%, transparent);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.article-close-icon {
  width: 20px;
  height: 20px;
}

.article-editor {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.article-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.article-form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-title-input {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 36px;
  font-weight: 800;
  color: var(--color-palette-1);
  outline: none;
  line-height: 1.3;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  font-family: inherit;
  letter-spacing: -0.02em;
  position: relative;
}

.article-title-input::placeholder {
  color: var(--color-palette-2);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.article-title-input:hover:not(:focus) {
  opacity: 0.8;
}

.article-title-input:hover:not(:focus)::placeholder {
  opacity: 0.4;
}

.article-title-input:focus {
  transform: translateY(-2px);
  opacity: 1;
}

.article-title-input:focus::placeholder {
  opacity: 0.3;
}

.article-title-input::placeholder {
  color: var(--color-text-muted);
}

.article-content-input {
  width: 100%;
  min-height: 500px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.article-content-input:hover {
  box-shadow: 0 4px 16px color-mix(in srgb, var(--text-primary) 5%, transparent);
}

.article-tags-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-tags-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-palette-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.article-tags-input {
  width: 100%;
  padding: 13px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-palette-5) 80%, var(--color-palette-4));
  border: 2px solid transparent;
  font-size: 14px;
  color: var(--color-palette-1);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, border-color, box-shadow;
  font-family: inherit;
}

.article-tags-input:hover:not(:focus) {
  border-color: color-mix(in srgb, var(--color-palette-3) 50%, transparent);
  background: color-mix(in srgb, var(--color-palette-5) 90%, var(--color-palette-4));
  box-shadow: 0 2px 6px color-mix(
      in srgb,
      var(--color-palette-3) 15%,
      transparent
    );
}

.article-tags-input:focus {
  background: var(--color-palette-5);
  border-color: var(--color-palette-3);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-palette-3) 20%, transparent),
    0 2px 8px color-mix(in srgb, var(--color-palette-3) 15%, transparent);
  outline: none;
  transform: translateY(-2px);
}

.article-tags-input::placeholder {
  color: var(--color-palette-2);
}

.article-tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-tag-preview {
  padding: 6px 14px;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-palette-3) 20%, var(--color-palette-4)),
    color-mix(in srgb, var(--color-palette-4) 30%, var(--color-palette-5))
  );
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 35%, transparent);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-palette-1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
}

.article-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-subtle);
}

.article-btn-cancel {
  padding: 12px 24px;
  border-radius: 12px;
  border: 2px solid color-mix(in srgb, var(--color-palette-3) 40%, transparent);
  background: color-mix(in srgb, var(--color-palette-5) 90%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-palette-2);
  user-select: none;
  will-change: transform, box-shadow, border-color;
}

.article-btn-cancel:hover {
  background: var(--color-palette-5);
  border-color: color-mix(in srgb, var(--color-palette-3) 60%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 5px 14px color-mix(in srgb, var(--color-palette-3) 20%, transparent);
}

.article-btn-cancel:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.article-btn-cancel:focus-visible {
  outline: 2px solid var(--color-palette-3);
  outline-offset: 2px;
}

.article-btn-submit {
  padding: 13px 32px;
  border-radius: var(--radius-md);
  border: none;
  background: linear-gradient(
    135deg,
    var(--color-palette-2),
    var(--color-palette-3)
  );
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-palette-5);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 6px 18px color-mix(
      in srgb,
      var(--color-palette-2) 35%,
      transparent
    ),
    0 2px 6px color-mix(
      in srgb,
      var(--color-palette-3) 20%,
      transparent
    );
  user-select: none;
  will-change: transform, box-shadow, filter;
  position: relative;
  overflow: hidden;
}

.article-btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-palette-5) 30%, transparent), transparent);
  transition: left 0.5s ease;
}

.article-btn-submit:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px color-mix(
      in srgb,
      var(--color-palette-2) 45%,
      transparent
    ),
    0 4px 12px color-mix(
      in srgb,
      var(--color-palette-3) 30%,
      transparent
    );
  filter: brightness(1.12) saturate(1.05);
}

.article-btn-submit:hover:not(:disabled)::before {
  left: 100%;
}

.article-btn-submit:active:not(:disabled) {
  transform: translateY(-2px) scale(0.98);
  box-shadow: 0 6px 18px color-mix(
      in srgb,
      var(--color-palette-2) 45%,
      transparent
    );
  filter: brightness(1.08);
  transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
}

.article-btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.article-btn-submit:focus-visible:not(:disabled) {
  outline: 2px solid var(--color-palette-3);
  outline-offset: 2px;
}

.article-btn-loading,
.article-btn-check {
  width: 18px;
  height: 18px;
}

.article-btn-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .article-panel {
    max-height: calc(100vh - 40px);
    border-radius: 20px;
  }
  
  .article-header {
    padding: 20px 24px;
  }
  
  .article-title {
    font-size: 20px;
  }
  
  .article-editor {
    padding: 24px;
  }
  
  .article-title-input {
    font-size: 24px;
  }
  
  .article-content-input {
    min-height: 400px;
  }
  
  .article-actions {
    padding: 16px 24px;
    flex-wrap: wrap;
  }
  
  .article-btn-cancel,
  .article-btn-submit {
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .article-wrapper {
    padding: 20px 12px;
  }
  
  .article-panel {
    max-height: calc(100vh - 24px);
    border-radius: 16px;
  }
  
  .article-header {
    padding: 16px 20px;
  }
  
  .article-title {
    font-size: 18px;
  }
  
  .article-close {
    width: 36px;
    height: 36px;
  }
  
  .article-editor {
    padding: 20px;
  }
  
  .article-title-input {
    font-size: 20px;
  }
  
  .article-content-input {
    min-height: 350px;
  }
  
  .article-tags-label {
    font-size: 12px;
  }
  
  .article-actions {
    padding: 12px 20px;
    gap: 8px;
  }
  
  .article-btn-cancel,
  .article-btn-submit {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
