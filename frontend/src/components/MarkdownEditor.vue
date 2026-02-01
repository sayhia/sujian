<template>
  <div class="markdown-editor">
    <div class="markdown-editor-toolbar">
      <button type="button" @click="insertMarkdown('**', '**')" title="粗体 (Ctrl+B)">
        <Bold />
      </button>
      <button type="button" @click="insertMarkdown('*', '*')" title="斜体 (Ctrl+I)">
        <Italic />
      </button>
      <button type="button" @click="insertMarkdown('~~', '~~')" title="删除线">
        <Strikethrough />
      </button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="insertMarkdown('# ', '')" title="标题">
        <Heading1 />
      </button>
      <button type="button" @click="insertMarkdown('## ', '')" title="副标题">
        <Heading2 />
      </button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="insertMarkdown('- ', '')" title="列表">
        <List />
      </button>
      <button type="button" @click="insertMarkdown('1. ', '')" title="有序列表">
        <ListOrdered />
      </button>
      <button type="button" @click="insertMarkdown('`', '`')" title="行内代码">
        <Code />
      </button>
      <button type="button" @click="insertCodeBlock()" title="代码块">
        <FileCode />
      </button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="insertMarkdown('> ', '')" title="引用">
        <Quote />
      </button>
      <button type="button" @click="insertMarkdown('---', '')" title="分割线">
        <Minus />
      </button>
      <button type="button" @click="insertMarkdown('[', '](url)')" title="链接">
        <Link />
      </button>
      <button type="button" @click="insertImage()" title="图片">
        <ImageIcon />
      </button>
      <button type="button" @click="insertTable()" title="表格">
        <Table />
      </button>
      
      <div class="toolbar-spacer"></div>
      
      <div class="toolbar-group view-group">
        <button type="button" @click="viewMode = 'edit'" title="仅编辑" :class="{ active: viewMode === 'edit' }">
          <Edit3 />
        </button>
        <button type="button" @click="viewMode = 'preview'" title="仅预览" :class="{ active: viewMode === 'preview' }">
          <Eye />
        </button>
        <button type="button" @click="viewMode = 'split'" title="分屏" :class="{ active: viewMode === 'split' }">
          <EyeOff />
        </button>
      </div>
      
      <div class="toolbar-spacer"></div>
      
      <button type="button" @click="showHelp = !showHelp" title="快捷键帮助" :class="{ active: showHelp }">
        <Keyboard />
      </button>
    </div>
   
    <div class="markdown-editor-container" :class="`view-${viewMode}`">
      <textarea
        v-show="viewMode === 'edit' || viewMode === 'split'"
        ref="editorRef"
        v-model="content"
        class="markdown-editor-textarea"
        :placeholder="placeholder"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
        spellcheck="false"
      ></textarea>
  
      <div
        v-show="viewMode === 'preview' || viewMode === 'split'"
        ref="previewRef"
        class="markdown-editor-preview"
        v-html="renderedContent"
      ></div>
    </div>
    
    <div class="markdown-editor-stats">
      <div class="stats-item">
        <FileText class="stats-icon" />
        <span class="stats-label">字数:</span>
        <span class="stats-value">{{ wordCount }}</span>
      </div>
      <div class="stats-item">
        <Type class="stats-icon" />
        <span class="stats-label">字符:</span>
        <span class="stats-value">{{ charCount }}</span>
      </div>
      <div class="stats-item">
        <Clock class="stats-icon" />
        <span class="stats-label">阅读:</span>
        <span class="stats-value">{{ readingTime }}</span>
      </div>
    </div>
    
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      style="display: none" 
      @change="handleFileSelect"
    />
    
    <Teleport to="body">
      <Transition name="panel-fade">
        <div v-if="showHelp" class="shortcuts-panel-backdrop" @click="showHelp = false">
          <div class="shortcuts-panel" @click.stop>
            <div class="shortcuts-panel-header">
              <div class="shortcuts-panel-title">
                <Keyboard class="title-icon" />
                <h3>键盘快捷键</h3>
              </div>
              <button type="button" class="close-panel" @click="showHelp = false">
                <X />
              </button>
            </div>
            <div class="shortcuts-panel-body">
              <div class="shortcut-group">
                <h4>格式化</h4>
                <div class="shortcut-list">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">B</kbd>
                    <span class="shortcut-desc">粗体</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">I</kbd>
                    <span class="shortcut-desc">斜体</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">S</kbd>
                    <span class="shortcut-desc">保存</span>
                  </div>
                </div>
              </div>
              <div class="shortcut-group">
                <h4>编辑</h4>
                <div class="shortcut-list">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Tab</kbd>
                    <span class="shortcut-desc">缩进</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Shift</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">Tab</kbd>
                    <span class="shortcut-desc">取消缩进</span>
                  </div>
                </div>
              </div>
              <div class="shortcut-group">
                <h4>导航</h4>
                <div class="shortcut-list">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Esc</kbd>
                    <span class="shortcut-desc">退出编辑</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
 import { ref, computed, watch, onUnmounted, onMounted } from 'vue';
 import { marked } from 'marked';
 import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Code, FileCode, Link, FileText, Type, Clock, Image as ImageIcon, Table, Minus, Eye, EyeOff, Edit3, Keyboard, X } from 'lucide-vue-next';

 marked.setOptions({
   breaks: true,
   gfm: true
 });

 const props = withDefaults(defineProps<{
   modelValue: string;
   placeholder?: string;
 }>(), {
   placeholder: '开始写作... 支持 Markdown 语法'
 });

 const emit = defineEmits<{
   'update:modelValue': [value: string];
   'focus': [];
   'blur': [];
 }>();

 const editorRef = ref<HTMLTextAreaElement | null>(null);
 const previewRef = ref<HTMLDivElement | null>(null);
 const fileInput = ref<HTMLInputElement | null>(null);
 const content = ref(props.modelValue);
 const viewMode = ref<'edit' | 'preview' | 'split'>('split');
 const showHelp = ref(false);

 const wordCount = computed(() => {
   if (!content.value.trim()) return 0;
   const text = content.value.replace(/[#*`~\[\]()]/g, '').trim();
   const words = text.split(/\s+/).filter(word => word.length > 0);
   return words.length;
 });

 const charCount = computed(() => {
   return content.value.length;
 });

 const readingTime = computed(() => {
   const minutes = Math.ceil(wordCount.value / 200);
   if (minutes < 1) return '< 1 分钟';
   if (minutes < 60) return `${minutes} 分钟`;
   const hours = Math.floor(minutes / 60);
   const remainingMinutes = minutes % 60;
   return remainingMinutes > 0 ? `${hours}小时 ${remainingMinutes}分钟` : `${hours}小时`;
 });

 const renderedContent = computed(() => {
   if (!content.value) return '';
   return marked.parse(content.value) as string;
 });

 function handleInput() {
   emit('update:modelValue', content.value);
 }

 function handleFocus() {
   emit('focus');
 }

 function handleBlur() {
   emit('blur');
 }

 function insertMarkdown(before: string, after: string) {
   const textarea = editorRef.value;
   if (!textarea) return;

   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const selectedText = content.value.substring(start, end);

   const newText = content.value.substring(0, start) + before + selectedText + after + content.value.substring(end);
   content.value = newText;

   const newCursorPos = start + before.length + selectedText.length;
   textarea.setSelectionRange(newCursorPos, newCursorPos);
   textarea.focus();

   emit('update:modelValue', content.value);
 }

 function insertCodeBlock() {
   const textarea = editorRef.value;
   if (!textarea) return;

   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const selectedText = content.value.substring(start, end);

   const codeBlock = '```javascript\n' + selectedText + '\n```';
   const newText = content.value.substring(0, start) + codeBlock + content.value.substring(end);
   content.value = newText;

   const newCursorPos = start + 14;
   textarea.setSelectionRange(newCursorPos, newCursorPos);
   textarea.focus();

   emit('update:modelValue', content.value);
 }

 function handleKeydown(event: KeyboardEvent) {
   if (event.key === 'Tab') {
     event.preventDefault();
     insertMarkdown('  ', '');
   }
   
   if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
     event.preventDefault();
     insertMarkdown('**', '**');
   }
   
   if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
     event.preventDefault();
     insertMarkdown('*', '*');
   }
 }

 function insertImage() {
   fileInput.value?.click();
 }

 function handleFileSelect(event: Event) {
   const target = event.target as HTMLInputElement;
   const file = target.files?.[0];
   if (!file) return;
   
   if (!file.type.startsWith('image/')) {
     alert('请选择图片文件');
     return;
   }
   
   const reader = new FileReader();
   reader.onload = (e) => {
     const dataUrl = e.target?.result as string;
     insertText(`![${file.name}](${dataUrl})`);
   };
   reader.readAsDataURL(file);
   
   target.value = '';
 }

 function insertText(text: string) {
   const textarea = editorRef.value;
   if (!textarea) return;
   
   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const newText = content.value.substring(0, start) + text + content.value.substring(end);
   
   content.value = newText;
   textarea.setSelectionRange(start + text.length, start + text.length);
   textarea.focus();
   
   emit('update:modelValue', content.value);
 }

 function insertTable() {
   const textarea = editorRef.value;
   if (!textarea) return;

   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;

   const tableMarkdown = '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n|     |     |     |\n|     |     |     |\n';
   const newText = content.value.substring(0, start) + tableMarkdown + content.value.substring(end);
   content.value = newText;

   const newCursorPos = start + tableMarkdown.length;
   textarea.setSelectionRange(newCursorPos, newCursorPos);
   textarea.focus();

   emit('update:modelValue', content.value);
 }

 function handleEditorScroll() {
   if (viewMode.value !== 'split' || !editorRef.value || !previewRef.value) return;
   
   const editor = editorRef.value;
   const preview = previewRef.value;
   
   const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
   preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
 }

 watch(() => props.modelValue, (newValue) => {
   if (newValue !== content.value) {
     content.value = newValue;
   }
 });

 function handleGlobalKeydown(event: KeyboardEvent) {
   if (event.key === 'Escape' && showHelp.value) {
     event.preventDefault();
     showHelp.value = false;
   }
 }

 onMounted(() => {
   window.addEventListener('keydown', handleGlobalKeydown);
 });

 onUnmounted(() => {
   window.removeEventListener('keydown', handleGlobalKeydown);
 });
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  /* Glassmorphism */
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.markdown-editor:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  box-shadow: 
    var(--glass-shadow),
    0 4px 20px -4px color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.markdown-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--glass-bg) 50%, transparent);
  border-bottom: 1px solid var(--glass-border);
  flex-wrap: wrap;
}

.markdown-editor-toolbar button {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1.5px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-secondary);
  user-select: none;
  padding: 0;
}

.markdown-editor-toolbar button:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent-strong);
  transform: translateY(-1px);
}

.markdown-editor-toolbar button:active {
  transform: translateY(0);
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.markdown-editor-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.markdown-editor-toolbar button svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.markdown-editor-toolbar button.active {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  color: var(--color-accent-strong);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--glass-border);
  margin: 0 4px;
}

.toolbar-spacer {
  flex: 1;
  min-width: 20px;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.markdown-editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 500px;
  max-height: 600px;
  overflow: hidden;
}

.markdown-editor-container.view-edit {
  grid-template-columns: 1fr;
}

.markdown-editor-container.view-preview {
  grid-template-columns: 1fr;
}

.markdown-editor-container.view-split {
  grid-template-columns: 1fr 1fr;
}

.markdown-editor-textarea {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: none;
  border-right: 1px solid var(--glass-border);
  background: transparent;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-primary);
  resize: none;
  outline: none;
  overflow-y: auto;
}

.view-edit .markdown-editor-textarea,
.view-preview .markdown-editor-textarea {
  border-right: none;
}

.markdown-editor-textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.markdown-editor-preview {
  padding: 20px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.01);
}

.markdown-editor-preview :deep(h1),
.markdown-editor-preview :deep(h2),
.markdown-editor-preview :deep(h3),
.markdown-editor-preview :deep(h4),
.markdown-editor-preview :deep(h5),
.markdown-editor-preview :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.markdown-editor-preview :deep(h1) {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid var(--glass-border);
}

.markdown-editor-preview :deep(h2) {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--glass-border);
}

.markdown-editor-preview :deep(h3) {
  font-size: 1.25em;
}

.markdown-editor-preview :deep(p) {
  margin: 1em 0;
  line-height: 1.75;
}

.markdown-editor-preview :deep(ul),
.markdown-editor-preview :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-editor-preview :deep(li) {
  margin: 0.5em 0;
  line-height: 1.6;
}

.markdown-editor-preview :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-text-secondary);
  font-style: italic;
  border-radius: 0 8px 8px 0;
}

.markdown-editor-preview :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.markdown-editor-preview :deep(pre) {
  margin: 1em 0;
  padding: 1em;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  border: 1px solid var(--glass-border);
}

.markdown-editor-preview :deep(pre code) {
  padding: 0;
  margin: 0;
  background: none;
  font-size: 0.9em;
  line-height: 1.6;
}

.markdown-editor-preview :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px dashed var(--color-primary);
  transition: all 0.2s ease;
}

.markdown-editor-preview :deep(a:hover) {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-bottom-style: solid;
}

.markdown-editor-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
  box-shadow: var(--shadow-sm);
}

.markdown-editor-preview :deep(table) {
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
}

.markdown-editor-preview :deep(th),
.markdown-editor-preview :deep(td) {
  padding: 0.5em 1em;
  border: 1px solid var(--glass-border);
  text-align: left;
}

.markdown-editor-preview :deep(th) {
  background: rgba(0, 0, 0, 0.02);
  font-weight: 600;
}

.markdown-editor-preview :deep(hr) {
  margin: 2em 0;
  border: none;
  border-top: 2px solid var(--glass-border);
}

.markdown-editor-stats {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  padding: 12px 20px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-palette-5) 50%, transparent) 0%,
    color-mix(in srgb, var(--color-palette-4) 30%, transparent) 50%,
    color-mix(in srgb, var(--color-palette-5) 50%, transparent) 100%
  );
  border-top: 1px solid color-mix(in srgb, var(--color-palette-3) 30%, transparent);
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-palette-2);
}

.stats-icon {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}

.stats-label {
  font-weight: 500;
}

.stats-value {
  font-weight: 600;
  color: var(--color-palette-1);
}

@media (max-width: 768px) {
  .markdown-editor-container.view-split {
    grid-template-columns: 1fr;
  }

  .markdown-editor-textarea {
    border-right: none;
  }
  
  .markdown-editor-container.view-split .markdown-editor-textarea {
    border-bottom: 1px solid var(--glass-border);
  }

  .markdown-editor-toolbar {
    padding: 8px 12px;
  }

  .markdown-editor-toolbar button {
    width: 28px;
    height: 28px;
  }
  
  .markdown-editor-toolbar .toolbar-spacer {
    display: none;
  }
}

/* ==================== 快捷键面板 ==================== */
.shortcuts-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.shortcuts-panel {
  /* Glassmorphism */
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-xl);
  
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
}

.shortcuts-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--glass-border);
}

.shortcuts-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.shortcuts-panel-title h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.shortcuts-panel-title .title-icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

.close-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
}

.close-panel:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--color-text-primary);
  transform: rotate(90deg);
}

.shortcuts-panel-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.shortcut-group {
  margin-bottom: 24px;
}

.shortcut-group:last-child {
  margin-bottom: 0;
}

.shortcut-group h4 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 6px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  color: #333;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .shortcut-key {
  background: #333;
  border-color: #444;
  color: #eee;
}

.shortcut-plus {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.shortcut-desc {
  margin-left: 8px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
</style>
