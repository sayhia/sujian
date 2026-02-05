<template>
  <div
    class="markdown-editor markdown-editor-content"
    :class="[
      `toolbar-style-${toolbarStyle}`,
      `toolbar-pos-${toolbarPosition}`,
      `toolbar-layout-${settingsStore.settings.toolbarLayout}`,
      { 'toolbar-autohide': toolbarAutohide, 'editor-focused': isEditorFocused }
    ]"
    :style="toolbarAppearanceVars"
  >
    <div ref="toolbarRef" class="markdown-editor-toolbar" :style="toolbarFloatingStyle">
      <div
        v-for="group in toolbarGroups"
        :key="group.id"
        class="toolbar-group"
        :class="{ 'toolbar-group--drag': isDropTarget(group.id) }"
        @dragover.prevent="handleGroupDragOver(group.id)"
        @drop.prevent="handleGroupDrop(group.id)"
      >
        <button
          type="button"
          class="toolbar-button toolbar-group-toggle"
          :aria-label="`折叠/展开：${group.label}`"
          :data-tooltip="`折叠/展开：${group.label}`"
          data-tooltip-position="bottom"
          @click="toggleGroupCollapse(group.id)"
        >
          <component :is="isGroupCollapsed(group.id) ? ChevronRight : ChevronDown" />
        </button>
        <template v-for="item in group.items.filter((entry) => !entry.inMore)" :key="item.id">
          <span v-if="!isGroupCollapsed(group.id) && isDropTargetItem(group.id, item.id)" class="toolbar-drop-slot" />
          <span
            v-if="item.kind === 'divider'"
            class="toolbar-divider-item"
            v-show="!isGroupCollapsed(group.id)"
          ></span>
          <button
            v-else
            type="button"
            class="toolbar-button"
            :class="{
              active: isItemActive(item),
              dragging: dragState?.itemId === item.id,
              'drop-target': isDropTargetItem(group.id, item.id)
            }"
            :aria-label="item.title ?? item.label"
            :data-tooltip="item.title ?? item.label"
            data-tooltip-position="bottom"
            :draggable="true"
            @click="handleToolbarAction(item)"
            @dragstart="handleDragStart(group.id, item.id)"
            @dragend="handleDragEnd"
            @dragover.prevent="handleDragOver(group.id, item.id)"
            @drop.prevent="handleDrop(group.id, item.id)"
            v-show="!isGroupCollapsed(group.id) && isItemVisible(item.id)"
          >
            <component :is="item.icon" />
          </button>
        </template>
        <span v-if="!isGroupCollapsed(group.id) && isDropTarget(group.id) && !dragOverTarget?.itemId" class="toolbar-drop-slot" />
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group toolbar-group--more">
        <button
          type="button"
          class="toolbar-button"
          :class="{ active: showMoreMenu }"
          @click="toggleMoreMenu"
          aria-label="更多"
          data-tooltip="更多"
          data-tooltip-position="bottom"
        >
          <MoreHorizontal />
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group view-group">
        <button
          type="button"
          class="toolbar-button"
          @click="showToc = !showToc"
          :class="{ active: showToc }"
          aria-label="目录 (Ctrl+Shift+O)"
          data-tooltip="目录 (Ctrl+Shift+O)"
          data-tooltip-position="bottom"
        >
          <ListTree />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="wrapAlign('left')"
          aria-label="左对齐"
          data-tooltip="左对齐"
          data-tooltip-position="bottom"
        >
          <AlignLeft />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="wrapAlign('center')"
          aria-label="居中"
          data-tooltip="居中"
          data-tooltip-position="bottom"
        >
          <AlignCenter />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="wrapAlign('right')"
          aria-label="右对齐"
          data-tooltip="右对齐"
          data-tooltip-position="bottom"
        >
          <AlignRight />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="wrapAlign('justify')"
          aria-label="两端对齐"
          data-tooltip="两端对齐"
          data-tooltip-position="bottom"
        >
          <AlignJustify />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="viewMode = 'edit'"
          :class="{ active: viewMode === 'edit' }"
          aria-label="仅编辑"
          data-tooltip="仅编辑"
          data-tooltip-position="bottom"
        >
          <Edit3 />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="viewMode = 'preview'"
          :class="{ active: viewMode === 'preview' }"
          aria-label="仅预览"
          data-tooltip="仅预览"
          data-tooltip-position="bottom"
        >
          <Eye />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="viewMode = 'split'"
          :class="{ active: viewMode === 'split' }"
          aria-label="分屏"
          data-tooltip="分屏"
          data-tooltip-position="bottom"
        >
          <EyeOff />
        </button>
        <button
          type="button"
          class="toolbar-button"
          @click="showHelp = !showHelp"
          :class="{ active: showHelp }"
          aria-label="快捷键帮助"
          data-tooltip="快捷键帮助"
          data-tooltip-position="bottom"
        >
          <Keyboard />
        </button>
      </div>
    </div>

    <div v-if="showMoreMenu" class="toolbar-popover" @click="closeMoreMenu">
      <div
        ref="morePanelRef"
        class="toolbar-popover-panel toolbar-more-panel"
        role="menu"
        tabindex="0"
        :aria-activedescendant="activeMenuItemId ? `menu-item-${activeMenuItemId}` : undefined"
        @click.stop
        @keydown="handleMoreMenuKeydown"
      >
        <span class="sr-only" aria-live="polite">{{ menuAnnounce }}</span>
        <div v-for="section in moreSections" :key="section.id" class="toolbar-more-section">
          <div class="toolbar-more-title">{{ section.label }}</div>
          <div class="toolbar-more-list">
            <div
              v-for="item in section.items"
              :key="item.id"
              class="toolbar-more-item"
              :class="{ 'toolbar-more-item--submenu': hasChildren(item), open: activeSubmenu === item.id }"
              :data-item-id="item.id"
              @mouseenter="scheduleSubmenuOpen(item)"
              @mouseleave="scheduleSubmenuClose(item.id)"
            >
              <button
                v-if="!hasChildren(item)"
                type="button"
                class="toolbar-more-button"
                :data-item-id="item.id"
                :data-has-children="hasChildren(item) ? 'true' : 'false'"
                :id="`menu-item-${item.id}`"
                role="menuitem"
                tabindex="-1"
                :class="{ 'is-active': activeMenuItemId === item.id }"
                @mouseenter="setActiveMenuItem(item.id)"
                @click="handleToolbarAction(item)"
              >
                <component :is="item.icon" />
                <span>{{ item.label }}</span>
              </button>
              <button
                v-else
                type="button"
                class="toolbar-more-button toolbar-more-parent"
                :data-item-id="item.id"
                :data-has-children="hasChildren(item) ? 'true' : 'false'"
                aria-haspopup="menu"
                :aria-expanded="activeSubmenu === item.id"
                :aria-controls="`submenu-${item.id}`"
                :id="`menu-item-${item.id}`"
                role="menuitem"
                tabindex="-1"
                :class="{ 'is-active': activeMenuItemId === item.id }"
                @mouseenter="setActiveMenuItem(item.id)"
                @click.prevent="toggleSubmenu(item)"
              >
                <component :is="item.icon" />
                <span>{{ item.label }}</span>
                <ChevronRight class="toolbar-submenu-icon" />
              </button>
              <div
                v-if="hasChildren(item)"
                :id="`submenu-${item.id}`"
                class="toolbar-submenu-panel"
                :class="{ 'submenu-left': submenuPlacement[item.id] === 'left' }"
                :style="{ top: submenuOffsetTop[item.id] ? `${submenuOffsetTop[item.id]}px` : undefined }"
                role="menu"
                aria-orientation="vertical"
                :aria-labelledby="`menu-item-${item.id}`"
                @mouseenter="cancelSubmenuClose"
                @mouseleave="scheduleSubmenuClose(item.id)"
              >
                <button
                  v-for="child in item.children"
                  :key="child.id"
                  type="button"
                  class="toolbar-more-button"
                  :data-item-id="child.id"
                  :data-parent-id="item.id"
                  data-submenu-child="true"
                  :id="`menu-item-${child.id}`"
                  role="menuitem"
                  tabindex="-1"
                  :class="{ 'is-active': activeMenuItemId === child.id }"
                  @mouseenter="setActiveMenuItem(child.id)"
                  @click="handleToolbarAction(child)"
                >
                  <component :is="child.icon" />
                  <span>{{ child.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="toolbar-more-section">
          <div class="toolbar-more-title">自定义</div>
          <div class="toolbar-more-list">
            <div class="toolbar-more-subtitle">分组折叠</div>
            <div class="toolbar-more-tags">
              <button
                v-for="group in toolbarGroups"
                :key="group.id"
                type="button"
                class="toolbar-chip"
                @click="toggleGroupCollapse(group.id)"
              >
                {{ group.label }}
              </button>
            </div>
            <div class="toolbar-more-subtitle">按钮显示</div>
            <div class="toolbar-more-tags">
              <button
                v-for="item in visibleToggleItems"
                :key="item.id"
                type="button"
                class="toolbar-chip"
                :class="{ active: isItemVisible(item.id) }"
                @click="toggleItemVisibility(item.id)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
        <div class="toolbar-more-section">
          <div class="toolbar-more-title">外观</div>
          <div class="toolbar-more-list">
            <div class="toolbar-more-subtitle">样式</div>
            <div class="toolbar-more-tags">
              <button type="button" class="toolbar-chip" :class="{ active: toolbarStyle === 'default' }" @click="setToolbarStyle('default')">
                默认
              </button>
              <button type="button" class="toolbar-chip" :class="{ active: toolbarStyle === 'glass' }" @click="setToolbarStyle('glass')">
                玻璃
              </button>
              <button type="button" class="toolbar-chip" :class="{ active: toolbarStyle === 'tiny' }" @click="setToolbarStyle('tiny')">
                紧凑
              </button>
            </div>
            <div class="toolbar-more-subtitle">位置</div>
            <div class="toolbar-more-tags">
              <button type="button" class="toolbar-chip" :class="{ active: toolbarPosition === 'top' }" @click="setToolbarPosition('top')">
                顶部
              </button>
              <button type="button" class="toolbar-chip" :class="{ active: toolbarPosition === 'following' }" @click="setToolbarPosition('following')">
                跟随
              </button>
              <button type="button" class="toolbar-chip" :class="{ active: toolbarPosition === 'fixed' }" @click="setToolbarPosition('fixed')">
                固定
              </button>
            </div>
            <div class="toolbar-more-subtitle">显示</div>
            <div class="toolbar-more-tags">
              <button type="button" class="toolbar-chip" :class="{ active: !toolbarAutohide }" @click="setToolbarAutohide(false)">
                常驻
              </button>
              <button type="button" class="toolbar-chip" :class="{ active: toolbarAutohide }" @click="setToolbarAutohide(true)">
                自动隐藏
              </button>
            </div>
          </div>
        </div>
        <div class="toolbar-more-section">
          <div class="toolbar-more-title">快捷键</div>
          <div class="toolbar-more-list">
            <div v-for="shortcut in shortcutConfig" :key="shortcut.action" class="toolbar-shortcut-row">
              <span class="toolbar-shortcut-label">{{ shortcut.label }}</span>
              <input
                class="toolbar-shortcut-input"
                type="text"
                :value="shortcutBindings[shortcut.action]"
                @input="updateShortcut(shortcut.action, ($event.target as HTMLInputElement).value)"
                placeholder="Ctrl+Shift+X"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showHeadingMenu" class="toolbar-popover" @click="showHeadingMenu = false">
      <div class="toolbar-popover-panel" @click.stop>
        <button type="button" @click="insertHeading(1)">标题 1</button>
        <button type="button" @click="insertHeading(2)">标题 2</button>
        <button type="button" @click="insertHeading(3)">标题 3</button>
        <button type="button" @click="insertHeading(4)">标题 4</button>
        <button type="button" @click="insertHeading(5)">标题 5</button>
        <button type="button" @click="insertHeading(6)">标题 6</button>
      </div>
    </div>

    <div v-if="showColorMenu" class="toolbar-popover" @click="closeColorMenu">
      <div class="toolbar-popover-panel toolbar-color-panel" @click.stop>
        <div class="toolbar-color-title">{{ colorMenuType === 'text' ? '文字颜色' : '背景颜色' }}</div>
        <div class="toolbar-color-grid">
          <button
            v-for="color in colorPalette"
            :key="color"
            type="button"
            class="toolbar-color-swatch"
            :style="{ background: color }"
            @click="applyColor(color)"
          ></button>
        </div>
        <div class="toolbar-color-footer">
          <input
            class="toolbar-color-input"
            type="color"
            :value="customColor"
            @input="updateCustomColor(($event.target as HTMLInputElement).value)"
          />
          <button type="button" class="toolbar-color-apply" @click="applyColor(customColor)">应用</button>
          <button type="button" class="toolbar-color-clear" @click="applyColor('transparent')">清除</button>
        </div>
      </div>
    </div>
   
    <div class="markdown-editor-container" :class="`view-${viewMode}`">
      <textarea
        v-show="viewMode === 'edit' || viewMode === 'split'"
        ref="editorRef"
        v-model="content"
        class="markdown-editor-textarea"
        id="content-input"
        :placeholder="placeholder"
        @input="handleInput"
        @scroll="handleEditorScroll"
        @keydown="handleKeydown"
        @keyup="updateActiveFormats"
        @mouseup="handleSelectionEnd"
        @mousedown="handleSelectionStart"
        @contextmenu="cancelFormatPainter"
        @auxclick="cancelFormatPainter"
        @click="updateActiveFormats"
        @focus="handleFocus"
        @blur="handleBlur"
        spellcheck="false"
      ></textarea>
  
    <div
        v-show="viewMode === 'preview' || viewMode === 'split'"
        ref="previewRef"
        class="markdown-editor-preview"
      >
        <div v-if="showToc && tocItems.length" class="markdown-toc">
          <div class="markdown-toc-title">目录</div>
          <ul class="markdown-toc-list">
            <li v-for="item in tocItems" :key="item.id" :class="`toc-level-${item.level}`">
              <a :href="`#${item.id}`">{{ item.text }}</a>
            </li>
          </ul>
        </div>
        <div class="markdown-preview-content" v-html="renderedContent"></div>
      </div>
    </div>

    <div v-if="selectionToolbarVisible" ref="selectionToolbarRef" class="selection-toolbar" :style="selectionToolbarStyle">
      <button
        type="button"
        @click="insertMarkdown('**', '**')"
        aria-label="粗体"
        data-tooltip="粗体"
        data-tooltip-position="top"
      >
        <Bold />
      </button>
      <button
        type="button"
        @click="insertMarkdown('*', '*')"
        aria-label="斜体"
        data-tooltip="斜体"
        data-tooltip-position="top"
      >
        <Italic />
      </button>
      <button
        type="button"
        @click="insertMarkdown('<u>', '</u>')"
        aria-label="下划线"
        data-tooltip="下划线"
        data-tooltip-position="top"
      >
        <Underline />
      </button>
      <button
        type="button"
        @click="insertMarkdown('[', '](url)')"
        aria-label="链接"
        data-tooltip="链接"
        data-tooltip-position="top"
      >
        <Link />
      </button>
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
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">Shift</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">L</kbd>
                    <span class="shortcut-desc">无序列表</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">Shift</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">T</kbd>
                    <span class="shortcut-desc">任务清单</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">Shift</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">M</kbd>
                    <span class="shortcut-desc">插入表格</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">Shift</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">F</kbd>
                    <span class="shortcut-desc">格式刷</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">]</kbd>
                    <span class="shortcut-desc">缩进</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">[</kbd>
                    <span class="shortcut-desc">取消缩进</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">Shift</kbd> <span class="shortcut-plus">+</span> <kbd class="shortcut-key">O</kbd>
                    <span class="shortcut-desc">显示目录</span>
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
 import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue';
 import { useSettingsStore } from '../stores/settingsStore';
 import { marked } from 'marked';
 import hljs from 'highlight.js/lib/common';
 import { Bold, Italic, Strikethrough, Heading, Underline, Highlighter, IndentIncrease, IndentDecrease, AlignLeft, AlignCenter, AlignRight, AlignJustify, Paintbrush, MessageSquare, PlusSquare, Columns3, List, ListChecks, ListOrdered, ListTree, Quote, Code, FileCode, Link, FileText, Type, Clock, Image as ImageIcon, Table, Minus, Eye, EyeOff, Edit3, Keyboard, X, MoreHorizontal, ChevronDown, ChevronRight, Palette, PaintBucket } from 'lucide-vue-next';

 marked.setOptions({
   breaks: true,
   gfm: true
 });

 // Simple slug function to replace Slugger
 function slug(text: string): string {
   return text
     .toString()
     .toLowerCase()
     .replace(/\s+/g, '-') // Replace spaces with -
     .replace(/[^\w\-]+/g, '') // Remove all non-word chars
     .replace(/\-\-+/g, '-') // Replace multiple - with single -
     .replace(/^-+/, '') // Trim - from start of text
     .replace(/-+$/, ''); // Trim - from end of text
 }

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
   'ready': [];
 }>();

 const editorRef = ref<HTMLTextAreaElement | null>(null);
 const previewRef = ref<HTMLDivElement | null>(null);
 const selectionToolbarRef = ref<HTMLDivElement | null>(null);
 const toolbarRef = ref<HTMLDivElement | null>(null);
 const morePanelRef = ref<HTMLDivElement | null>(null);
 const fileInput = ref<HTMLInputElement | null>(null);
 const settingsStore = useSettingsStore();
 const content = ref(props.modelValue);
 const viewMode = ref<'edit' | 'preview' | 'split'>('split');
 const showHelp = ref(false);
 const showToc = ref(true);
 const showHeadingMenu = ref(false);
 const showMoreMenu = ref(false);
 const showColorMenu = ref(false);
 const colorMenuType = ref<'text' | 'background'>('text');
 const customColor = ref('#4b5563');
 const formatPainterActive = ref(false);
 const lastFormat = ref<{ before: string; after: string } | null>(null);
 const activeFormats = ref(new Set<string>());
 const dragState = ref<{ groupId: string; itemId: string } | null>(null);
 const dragOverTarget = ref<{ groupId: string; itemId: string | null } | null>(null);
 const isSelecting = ref(false);
 const activeSubmenu = ref<string | null>(null);
 const submenuPlacement = ref<Record<string, 'left' | 'right'>>({});
 const submenuOffsetTop = ref<Record<string, number>>({});
 const activeMenuItemId = ref<string | null>(null);
 const submenuOpenTimer = ref<number | null>(null);
 const submenuCloseTimer = ref<number | null>(null);
 const menuAnnounce = ref('');

 const colorPalette = [
   '#111827',
   '#4b5563',
   '#9ca3af',
   '#ef4444',
   '#f97316',
   '#f59e0b',
   '#10b981',
   '#0ea5e9',
   '#6366f1',
   '#a855f7',
   '#ec4899',
   '#14b8a6'
 ];
 const shortcutBindings = ref<Record<string, string>>({});
 const hiddenItems = ref(new Set<string>());
 const collapsedGroups = ref(new Set<string>());
 shortcutBindings.value = {
   list: 'Ctrl+Shift+L',
   task: 'Ctrl+Shift+T',
   table: 'Ctrl+Shift+M',
   toc: 'Ctrl+Shift+O',
   formatPainter: 'Ctrl+Shift+F',
   indent: 'Ctrl+]',
   outdent: 'Ctrl+[',
   details: 'Ctrl+Shift+D'
 };
const toolbarStyle = computed(() => settingsStore.settings.toolbarStyle);
const toolbarPosition = computed(() => settingsStore.settings.toolbarPosition);
const toolbarAutohide = computed(() => settingsStore.settings.toolbarAutohide);
const toolbarConfigScope = computed(() =>
 settingsStore.settings.toolbarMultipleConfig ? settingsStore.settings.toolbarPosition : 'all',
);
const toolbarFloatingStyle = ref<Record<string, string>>({});
const isEditorFocused = ref(false);

const toolbarAppearance = computed(() => {
  const style = toolbarPosition.value;
  const appearance = settingsStore.settings.toolbarAppearanceByStyle?.[style] ?? {};
  const backgroundColor =
    appearance.backgroundColor !== undefined
      ? appearance.backgroundColor
      : settingsStore.settings.toolbarBackgroundColor;
  const iconColor =
    appearance.iconColor !== undefined
      ? appearance.iconColor
      : settingsStore.settings.toolbarIconColor;
  const iconSize =
    typeof appearance.iconSize === 'number'
      ? appearance.iconSize
      : settingsStore.settings.toolbarIconSize;
  return {
    backgroundColor,
    iconColor,
    iconSize,
  };
});

 function getToolbarStorageKey(base: string, scope = toolbarConfigScope.value) {
  return scope === 'all' ? base : `${base}-${scope}`;
 }

 function readToolbarStorage(base: string) {
  const scope = toolbarConfigScope.value;
  const scopedKey = getToolbarStorageKey(base, scope);
  const scoped = localStorage.getItem(scopedKey);
  if (scoped || scope === 'all') {
    return scoped;
  }
  const fallback = localStorage.getItem(base);
  if (fallback && settingsStore.settings.toolbarMultipleConfig) {
    localStorage.setItem(scopedKey, fallback);
  }
  return scoped ?? fallback;
 }

const toolbarAppearanceVars = computed<Record<string, string>>(() => {
  const vars: Record<string, string> = {
    '--toolbar-icon-size': `${toolbarAppearance.value.iconSize}px`,
    '--toolbar-fixed-offset-x': `${settingsStore.settings.toolbarFixedOffsetX || 0}px`,
    '--toolbar-fixed-offset-y': `${settingsStore.settings.toolbarFixedOffsetY || 0}px`,
  };
  if (toolbarAppearance.value.backgroundColor) {
    vars['--editing-toolbar-background-color'] = toolbarAppearance.value.backgroundColor;
  }
  if (toolbarAppearance.value.iconColor) {
    vars['--editing-toolbar-icon-color'] = toolbarAppearance.value.iconColor;
  }
  return vars;
});

 type ToolbarItem = {
  id: string;
  label: string;
  title?: string;
  icon?: any;
  action?: string;
  active?: string;
  inMore?: boolean;
  kind?: 'divider';
  children?: ToolbarItem[];
 };

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

 type TocItem = { id: string; text: string; level: number };

 const renderState = computed(() => {
   if (!content.value) {
     return { html: '', toc: [] as TocItem[] };
   }

   try {
     const tokens = marked.lexer(content.value);
      const tocSlugger = { slug };
     const toc = tokens
       .filter((token) => token.type === 'heading')
       .map((token) => {
         const heading = token as { text: string; depth: number };
         return {
           text: heading.text,
           level: heading.depth,
           id: tocSlugger.slug(heading.text)
         };
       });

      const renderSlugger = { slug };
     const renderer = new marked.Renderer();
     renderer.heading = (text: unknown, level?: number) => {
       if (text && typeof text === 'object') {
         const token = text as { text?: string; depth?: number };
         const headingText = token.text ?? '';
         const depth = token.depth ?? 1;
         const id = renderSlugger.slug(headingText);
         return `<h${depth} id="${id}">${headingText}</h${depth}>`;
       }
       const headingText = String(text ?? '');
       const depth = level ?? 1;
       const id = renderSlugger.slug(headingText);
       return `<h${depth} id="${id}">${headingText}</h${depth}>`;
     };
     renderer.code = (code: unknown, infostring?: string) => {
       let raw = '';
       let language = '';
       if (code && typeof code === 'object') {
         const token = code as { text?: string; lang?: string; language?: string };
         raw = token.text ?? '';
         language = (token.lang ?? token.language ?? '').trim().split(/\s+/)[0];
       } else {
         raw = String(code ?? '');
         language = (infostring ?? '').trim().split(/\s+/)[0];
       }
       if (language && hljs.getLanguage(language)) {
         const highlighted = hljs.highlight(raw, { language }).value;
         return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
       }
       const highlighted = hljs.highlightAuto(raw).value;
       return `<pre><code class="hljs">${highlighted}</code></pre>`;
     };

     const html = marked.parse(content.value, { renderer }) as string;
     return { html, toc };
   } catch (error) {
     console.error('[MarkdownEditor] Render error', error);
     const safeHtml = marked.parse(content.value) as string;
     return { html: safeHtml, toc: [] as TocItem[] };
   }
 });

 const renderedContent = computed(() => renderState.value.html);
 const tocItems = computed(() => renderState.value.toc);
const selectionToolbarVisible = computed(() => {
  const textarea = editorRef.value;
  if (!textarea) return false;
  return viewMode.value !== 'preview' && textarea.selectionStart !== textarea.selectionEnd;
});
const selectionToolbarStyle = ref<Record<string, string>>({});

const isGroupCollapsed = (groupId: string) => collapsedGroups.value.has(groupId);

function toggleGroupCollapse(groupId: string) {
  const next = new Set(collapsedGroups.value);
  if (next.has(groupId)) {
    next.delete(groupId);
  } else {
    next.add(groupId);
  }
  collapsedGroups.value = next;
  localStorage.setItem(getToolbarStorageKey('markdown-toolbar-collapsed'), JSON.stringify([...next]));
  nextTick(() => updateToolbarSizing());
}

const isItemVisible = (itemId: string) => !hiddenItems.value.has(itemId);

function toggleItemVisibility(itemId: string) {
  const next = new Set(hiddenItems.value);
  if (next.has(itemId)) {
    next.delete(itemId);
  } else {
    next.add(itemId);
  }
  hiddenItems.value = next;
  localStorage.setItem(getToolbarStorageKey('markdown-toolbar-hidden'), JSON.stringify([...next]));
  nextTick(() => updateToolbarSizing());
}

function setToolbarStyle(style: 'default' | 'glass' | 'tiny') {
  settingsStore.setToolbarStyle(style);
}

function setToolbarPosition(position: 'top' | 'following' | 'fixed') {
  settingsStore.setToolbarPosition(position);
  updateToolbarPosition();
}

function setToolbarAutohide(value: boolean) {
  settingsStore.setToolbarAutohide(value);
}

  const toolbarGroups = ref<{ id: string; label: string; items: ToolbarItem[] }[]>([
   {
     id: 'format',
     label: '格式',
     items: [
       { id: 'bold', label: '粗体', title: '粗体 (Ctrl+B)', icon: Bold, action: 'bold', active: 'bold' },
       { id: 'italic', label: '斜体', title: '斜体 (Ctrl+I)', icon: Italic, action: 'italic', active: 'italic' },
       { id: 'strike', label: '删除线', title: '删除线', icon: Strikethrough, action: 'strike', active: 'strike' },
       { id: 'underline', label: '下划线', title: '下划线', icon: Underline, action: 'underline', active: 'underline' },
       { id: 'highlight', label: '高亮', title: '高亮', icon: Highlighter, action: 'highlight', active: 'highlight' },
       { id: 'text-color', label: '文字颜色', title: '文字颜色', icon: Palette, action: 'textColor' },
       { id: 'bg-color', label: '背景颜色', title: '背景颜色', icon: PaintBucket, action: 'bgColor' },
       { id: 'paint', label: '格式刷', title: '格式刷 (Ctrl+Shift+F)', icon: Paintbrush, action: 'formatPainter', active: 'formatPainter' }
     ]
   },
   {
     id: 'structure',
     label: '结构',
     items: [
       { id: 'heading', label: '标题', title: '标题', icon: Heading, action: 'heading', active: 'heading' },
       { id: 'quote', label: '引用', title: '引用', icon: Quote, action: 'quote', active: 'quote' },
       { id: 'inline-code', label: '行内代码', title: '行内代码', icon: Code, action: 'inlineCode', active: 'inlineCode' },
       { id: 'code-block', label: '代码块', title: '代码块', icon: FileCode, action: 'codeBlock', active: 'codeBlock' }
     ]
   },
   {
     id: 'lists',
     label: '列表',
     items: [
       { id: 'list', label: '无序列表', title: '列表 (Ctrl+Shift+L)', icon: List, action: 'list', active: 'list' },
       { id: 'ordered', label: '有序列表', title: '有序列表', icon: ListOrdered, action: 'ordered', active: 'ordered' },
       { id: 'task', label: '任务清单', title: '任务清单 (Ctrl+Shift+T)', icon: ListChecks, action: 'task', active: 'task' },
       { id: 'table', label: '表格', title: '表格 (Ctrl+Shift+M)', icon: Table, action: 'table', active: 'table' },
       { id: 'divider-lists', label: '分割线', title: '分割线', kind: 'divider' },
       {
         id: 'table-tools',
         label: '表格操作',
         title: '表格操作',
         icon: Table,
         inMore: true,
         children: [
           { id: 'row', label: '添加行', title: '表格添加行', icon: PlusSquare, action: 'tableRow' },
           { id: 'col', label: '添加列', title: '表格添加列', icon: Columns3, action: 'tableCol' },
         ]
       },
       { id: 'indent', label: '缩进', title: '缩进 (Ctrl+])', icon: IndentIncrease, action: 'indent' },
       { id: 'outdent', label: '取消缩进', title: '取消缩进 (Ctrl+[)', icon: IndentDecrease, action: 'outdent' }
     ]
   },
   {
     id: 'insert',
     label: '插入',
     items: [
       { id: 'link', label: '链接', title: '链接', icon: Link, action: 'link', active: 'link' },
       { id: 'image', label: '图片', title: '图片', icon: ImageIcon, action: 'image' },
       { id: 'comment', label: '注释', title: '注释', icon: MessageSquare, action: 'comment', inMore: true },
       { id: 'details', label: '折叠块', title: '折叠块', icon: PlusSquare, action: 'details', inMore: true },
       { id: 'rule', label: '分割线', title: '分割线', icon: Minus, action: 'rule' }
   ]
  }
 ]);

 const defaultToolbarOrder = toolbarGroups.value.map((group) => ({
  id: group.id,
  items: group.items.map((item) => item.id),
 }));

 const visibleToggleItems = computed(() =>
   toolbarGroups.value
     .flatMap((group) => group.items.filter((item) => !item.inMore))
     .filter((item) => item.kind !== 'divider')
 );

 const moreSections = computed(() =>
   toolbarGroups.value
     .map((group) => ({
       id: group.id,
       label: group.label ?? group.id,
       items: group.items.filter((item) => item.inMore || (item.children && item.children.length))
     }))
     .filter((section) => section.items.length > 0)
 );

 const toolbarItemMap = computed(() => {
   const map = new Map<string, ToolbarItem>();
   toolbarGroups.value.forEach((group) => {
     group.items.forEach((item) => {
       map.set(item.id, item);
       item.children?.forEach((child) => map.set(child.id, child));
     });
   });
   return map;
 });

 const shortcutConfig = [
   { action: 'list', label: '无序列表' },
   { action: 'task', label: '任务清单' },
   { action: 'table', label: '插入表格' },
   { action: 'toc', label: '显示目录' },
   { action: 'formatPainter', label: '格式刷' },
   { action: 'indent', label: '缩进' },
   { action: 'outdent', label: '取消缩进' },
   { action: 'details', label: '折叠块' }
 ];

function handleInput() {
  emit('update:modelValue', content.value);
  updateActiveFormats();
  updateToolbarPosition();
  updateToolbarSizing();
}

function handleFocus() {
  isEditorFocused.value = true;
  emit('focus');
  updateActiveFormats();
  updateToolbarPosition();
  updateToolbarSizing();
}

function handleBlur() {
  isEditorFocused.value = false;
  emit('blur');
}

 function handleSelectionStart() {
   isSelecting.value = true;
 }

function handleSelectionEnd() {
  isSelecting.value = false;
  updateActiveFormats();
  updateToolbarPosition();
  updateToolbarSizing();
}

function handleSelectionMove() {
  if (!isSelecting.value) return;
  updateActiveFormats();
  updateToolbarPosition();
}

 function updateActiveFormats() {
   const textarea = editorRef.value;
   if (!textarea) return;
   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const text = content.value;
   const selection = text.slice(start, end);
   const lineStart = text.lastIndexOf('\n', start - 1) + 1;
   const lineEndIndex = text.indexOf('\n', start);
   const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
   const line = text.slice(lineStart, lineEnd);
   const before = text.slice(0, start);
   const codeFenceCount = (before.match(/```/g) || []).length;
   const inCodeBlock = codeFenceCount % 2 === 1;

   const formats = new Set<string>();
   const hasWrapper = (marker: string) => {
     if (selection && selection.startsWith(marker) && selection.endsWith(marker)) return true;
     const before = text.slice(0, start);
     const after = text.slice(end);
     return before.includes(marker) && after.includes(marker);
   };

   if (hasWrapper('**')) formats.add('bold');
   if (hasWrapper('*')) formats.add('italic');
   if (hasWrapper('~~')) formats.add('strike');
   if (hasWrapper('<u>')) formats.add('underline');
   if (hasWrapper('==')) formats.add('highlight');
   if (hasWrapper('`')) formats.add('inlineCode');
   if (line.trim().startsWith('>')) formats.add('quote');
   if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(selection) || selection.startsWith('- [ ]')) formats.add('task');
   if (line.trim().startsWith('- ')) formats.add('list');
   if (/^\s*\d+\.\s+/.test(line.trim())) formats.add('ordered');
   if (line.includes('|') && text.includes('|') && text.includes('---')) formats.add('table');
   if (/^\s{0,3}#{1,6}\s+/.test(line)) formats.add('heading');
   if (inCodeBlock) formats.add('codeBlock');

  activeFormats.value = formats;
  updateSelectionToolbarPosition();
}

function getCaretCoordinates(textarea: HTMLTextAreaElement, position: number) {
  const style = window.getComputedStyle(textarea);
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.overflow = 'hidden';
  div.style.left = '-9999px';
  div.style.top = '0';
  div.style.width = `${textarea.clientWidth}px`;
  const properties = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'textTransform',
    'textAlign',
    'lineHeight',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing'
  ] as const;
  properties.forEach((prop) => {
    div.style[prop] = style[prop];
  });
  const text = textarea.value.substring(0, position);
  div.textContent = text;
  const span = document.createElement('span');
  span.textContent = textarea.value.substring(position) || '.';
  div.appendChild(span);
  document.body.appendChild(div);
  const spanRect = span.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();
  document.body.removeChild(div);
  return {
    top: spanRect.top - divRect.top - textarea.scrollTop,
    left: spanRect.left - divRect.left - textarea.scrollLeft
  };
}

function updateSelectionToolbarPosition() {
  const textarea = editorRef.value;
  if (!textarea || textarea.selectionStart === textarea.selectionEnd) return;
  const container = textarea.closest('.markdown-editor') as HTMLElement | null;
  const containerRect = container?.getBoundingClientRect() ?? textarea.getBoundingClientRect();
  const editorRect = textarea.getBoundingClientRect();
  const caret = getCaretCoordinates(textarea, textarea.selectionEnd);
  const toolbarWidth = selectionToolbarRef.value?.offsetWidth ?? 160;
  const toolbarHeight = selectionToolbarRef.value?.offsetHeight ?? 36;

  let left = editorRect.left + caret.left - containerRect.left;
  let top = editorRect.top + caret.top - containerRect.top - toolbarHeight - 10;

  left = Math.max(12, Math.min(left, containerRect.width - toolbarWidth - 12));
  top = Math.max(8, top);

  selectionToolbarStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  };
}

function updateToolbarPosition() {
  if (toolbarPosition.value !== 'following') {
    toolbarFloatingStyle.value = {};
    return;
  }
  const toolbar = toolbarRef.value;
  const textarea = editorRef.value;
  if (!toolbar || !textarea) return;
  const container = textarea.closest('.markdown-editor') as HTMLElement | null;
  const containerRect = container?.getBoundingClientRect() ?? textarea.getBoundingClientRect();
  const editorRect = textarea.getBoundingClientRect();
  const caret = getCaretCoordinates(textarea, textarea.selectionEnd);
  const toolbarWidth = toolbar.offsetWidth || 240;
  const toolbarHeight = toolbar.offsetHeight || 34;

  let left = editorRect.left + caret.left - containerRect.left - toolbarWidth / 2;
  let top = editorRect.top + caret.top - containerRect.top - toolbarHeight - 14;

  left = Math.max(12, Math.min(left, containerRect.width - toolbarWidth - 12));
  if (top < 8) {
    top = editorRect.top + caret.top - containerRect.top + 18;
  }
  if (top + toolbarHeight > containerRect.height - 8) {
    top = containerRect.height - toolbarHeight - 8;
  }
  if (containerRect.width < 480) {
    left = Math.max(8, Math.min(left, containerRect.width - toolbarWidth - 8));
  }

  toolbarFloatingStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  };
}

function updateToolbarSizing() {
  const toolbar = toolbarRef.value;
  if (!toolbar) return;
  const baseSize = toolbarAppearance.value.iconSize || 18;
  const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button'))
    .filter((button) => button.offsetParent !== null);
  const visibleCount = buttons.length;
  const toolbarWidth = toolbar.clientWidth || 1;
  const perButton = baseSize + 12;
  const maxCount = Math.max(1, Math.floor(toolbarWidth / perButton));
  let size = baseSize;
  if (visibleCount > maxCount) {
    const ratio = Math.max(0.7, maxCount / visibleCount);
    size = Math.max(12, Math.round(baseSize * ratio));
  }
  toolbar.style.setProperty('--toolbar-icon-size', `${size}px`);
}

function toggleHeadingMenu() {
  showHeadingMenu.value = !showHeadingMenu.value;
}

function openColorMenu(type: 'text' | 'background') {
  colorMenuType.value = type;
  showColorMenu.value = true;
}

function closeColorMenu() {
  showColorMenu.value = false;
}

function updateCustomColor(color: string) {
  customColor.value = color;
}

function applyColor(color: string) {
  const textarea = editorRef.value;
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);
  const safeColor = color === 'transparent' ? 'transparent' : color;
  const style = colorMenuType.value === 'text'
    ? `color: ${safeColor};`
    : `background-color: ${safeColor};`;

  const before = `<span style="${style}">`;
  const after = `</span>`;

  if (!selectedText) {
    const newText = content.value.substring(0, start) + before + after + content.value.substring(end);
    content.value = newText;
    const cursorPos = start + before.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  } else {
    content.value = content.value.substring(0, start) + before + selectedText + after + content.value.substring(end);
    textarea.setSelectionRange(start + before.length, end + before.length);
  }
  textarea.focus();
  emit('update:modelValue', content.value);
  showColorMenu.value = false;
}

const hasChildren = (item: ToolbarItem) => !!item.children?.length;

function openSubmenu(item: ToolbarItem) {
  if (!hasChildren(item)) return;
  activeSubmenu.value = item.id;
  updateSubmenuPlacement(item.id);
}

function closeSubmenu(item: ToolbarItem) {
  if (activeSubmenu.value === item.id) {
    activeSubmenu.value = null;
  }
}

function toggleSubmenu(item: ToolbarItem) {
  if (!hasChildren(item)) return;
  activeSubmenu.value = activeSubmenu.value === item.id ? null : item.id;
  if (activeSubmenu.value) {
    updateSubmenuPlacement(item.id);
  }
}

function scheduleSubmenuOpen(item: ToolbarItem) {
  if (!hasChildren(item)) return;
  cancelSubmenuClose();
  if (submenuOpenTimer.value) {
    window.clearTimeout(submenuOpenTimer.value);
  }
  submenuOpenTimer.value = window.setTimeout(() => {
    openSubmenu(item);
  }, 120);
}

function scheduleSubmenuClose(itemId?: string) {
  if (submenuOpenTimer.value) {
    window.clearTimeout(submenuOpenTimer.value);
    submenuOpenTimer.value = null;
  }
  if (submenuCloseTimer.value) {
    window.clearTimeout(submenuCloseTimer.value);
  }
  submenuCloseTimer.value = window.setTimeout(() => {
    if (!itemId || activeSubmenu.value === itemId) {
      activeSubmenu.value = null;
    }
  }, 180);
}

function cancelSubmenuClose() {
  if (submenuCloseTimer.value) {
    window.clearTimeout(submenuCloseTimer.value);
    submenuCloseTimer.value = null;
  }
}

function closeMoreMenu() {
  showMoreMenu.value = false;
  activeSubmenu.value = null;
  activeMenuItemId.value = null;
}

 function toggleMoreMenu() {
   showMoreMenu.value = !showMoreMenu.value;
   if (!showMoreMenu.value) {
     activeSubmenu.value = null;
     activeMenuItemId.value = null;
   }
 }

function handleToolbarAction(item: ToolbarItem) {
  if (!item.action) return;
  showMoreMenu.value = false;
  activeSubmenu.value = null;
  activeMenuItemId.value = null;
  switch (item.action) {
     case 'bold':
       insertMarkdown('**', '**');
       return;
     case 'italic':
       insertMarkdown('*', '*');
       return;
     case 'strike':
       insertMarkdown('~~', '~~');
       return;
     case 'underline':
       insertMarkdown('<u>', '</u>');
       return;
     case 'highlight':
       insertMarkdown('==', '==');
       return;
     case 'formatPainter':
       toggleFormatPainter();
       return;
     case 'textColor':
       openColorMenu('text');
       return;
     case 'bgColor':
       openColorMenu('background');
       return;
     case 'heading':
       toggleHeadingMenu();
       return;
     case 'quote':
       insertMarkdown('> ', '');
       return;
     case 'inlineCode':
       insertMarkdown('`', '`');
       return;
     case 'codeBlock':
       insertCodeBlock();
       return;
     case 'list':
       insertMarkdown('- ', '');
       return;
     case 'ordered':
       insertMarkdown('1. ', '');
       return;
     case 'task':
       insertTaskList();
       return;
     case 'table':
       insertTable();
       return;
     case 'tableRow':
       addTableRow();
       return;
     case 'tableCol':
       addTableColumn();
       return;
     case 'indent':
       indentSelection();
       return;
     case 'outdent':
       outdentSelection();
       return;
     case 'link':
       insertMarkdown('[', '](url)');
       return;
     case 'image':
       insertImage();
       return;
     case 'comment':
       insertComment();
       return;
     case 'details':
       insertDetails();
       return;
     case 'rule':
       insertMarkdown('---', '');
       return;
     default:
       return;
   }
 }

 function isItemActive(item: ToolbarItem) {
   if (!item.active) return false;
   if (item.active === 'formatPainter') return formatPainterActive.value;
   return activeFormats.value.has(item.active);
 }

function updateSubmenuPlacement(itemId: string) {
  nextTick(() => {
    const panel = morePanelRef.value;
    if (!panel) return;
    const submenu = panel.querySelector<HTMLElement>(`.toolbar-more-item--submenu[data-item-id="${itemId}"] .toolbar-submenu-panel`);
    const targetButton = panel.querySelector<HTMLElement>(`.toolbar-more-button[data-item-id="${itemId}"]`);
    if (!submenu || !targetButton) return;
    submenuPlacement.value = { ...submenuPlacement.value, [itemId]: 'right' };
    const submenuRect = submenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetRect = targetButton.getBoundingClientRect();
    const leftOverflow = targetButton.getBoundingClientRect().left - submenuRect.width - 16 < 0;
    const rightOverflow = submenuRect.right > viewportWidth - 8;
    if (rightOverflow && !leftOverflow) {
      submenuPlacement.value = { ...submenuPlacement.value, [itemId]: 'left' };
    } else {
      submenuPlacement.value = { ...submenuPlacement.value, [itemId]: 'right' };
    }
    let offsetTop = targetRect.top - submenuRect.top;
    if (submenuRect.bottom + offsetTop > viewportHeight - 8) {
      offsetTop -= submenuRect.bottom + offsetTop - viewportHeight + 8;
    }
    if (submenuRect.top + offsetTop < 8) {
      offsetTop += 8 - (submenuRect.top + offsetTop);
    }
    submenuOffsetTop.value = { ...submenuOffsetTop.value, [itemId]: offsetTop };
  });
}

function focusFirstMoreButton() {
  nextTick(() => {
    const panel = morePanelRef.value;
    if (!panel) return;
    const first = panel.querySelector<HTMLButtonElement>('.toolbar-more-button');
    if (first?.dataset.itemId) {
      activeMenuItemId.value = first.dataset.itemId;
    }
    panel.focus();
  });
}

function setActiveMenuItem(itemId: string) {
  activeMenuItemId.value = itemId;
}

function getButtonsForSubmenu(parentId: string) {
  const panel = morePanelRef.value;
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLButtonElement>(`.toolbar-more-button[data-parent-id="${parentId}"]`))
    .filter((button) => button.offsetParent !== null);
}

function cycleButtons(buttons: HTMLButtonElement[], direction: 1 | -1) {
  if (!buttons.length) return;
  const currentIndex = activeMenuItemId.value
    ? buttons.findIndex((button) => button.dataset.itemId === activeMenuItemId.value)
    : -1;
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + direction + buttons.length) % buttons.length;
  const nextButton = buttons[nextIndex];
  if (nextButton?.dataset.itemId) {
    activeMenuItemId.value = nextButton.dataset.itemId;
  }
}

function getVisibleMoreButtons() {
  const panel = morePanelRef.value;
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLButtonElement>('.toolbar-more-button')).filter(
    (button) => button.offsetParent !== null,
  );
}

function focusSiblingButton(direction: 1 | -1) {
  const buttons = getVisibleMoreButtons();
  if (!buttons.length) return;
  const currentIndex = activeMenuItemId.value
    ? buttons.findIndex((button) => button.dataset.itemId === activeMenuItemId.value)
    : -1;
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + direction + buttons.length) % buttons.length;
  const nextButton = buttons[nextIndex];
  if (nextButton?.dataset.itemId) {
    activeMenuItemId.value = nextButton.dataset.itemId;
  }
}

function focusFirstChildButton(parentId: string) {
  const panel = morePanelRef.value;
  if (!panel) return;
  const child = panel.querySelector<HTMLButtonElement>(`.toolbar-more-button[data-parent-id="${parentId}"]`);
  if (child?.dataset.itemId) {
    activeMenuItemId.value = child.dataset.itemId;
  }
}

function focusParentButton(childButton: HTMLButtonElement) {
  const parentId = childButton.dataset.parentId;
  if (!parentId) return;
  const panel = morePanelRef.value;
  const parentButton = panel?.querySelector<HTMLButtonElement>(`.toolbar-more-button[data-item-id="${parentId}"]`);
  if (parentButton?.dataset.itemId) {
    activeMenuItemId.value = parentButton.dataset.itemId;
  }
}

function handleMoreMenuKeydown(event: KeyboardEvent) {
  if (!showMoreMenu.value) return;
  const activeId = activeMenuItemId.value;
  const panel = morePanelRef.value;
  const active = activeId
    ? panel?.querySelector<HTMLButtonElement>(`.toolbar-more-button[data-item-id="${activeId}"]`) ?? null
    : null;
  const isSubmenuChild = active?.dataset.submenuChild === 'true';
  const currentParent = active?.dataset.parentId ?? null;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMoreMenu();
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (activeSubmenu.value && isSubmenuChild && currentParent === activeSubmenu.value) {
      cycleButtons(getButtonsForSubmenu(activeSubmenu.value), 1);
    } else {
      focusSiblingButton(1);
    }
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (activeSubmenu.value && isSubmenuChild && currentParent === activeSubmenu.value) {
      cycleButtons(getButtonsForSubmenu(activeSubmenu.value), -1);
    } else {
      focusSiblingButton(-1);
    }
    return;
  }
  if (event.key === 'Home') {
    event.preventDefault();
    if (activeSubmenu.value && isSubmenuChild && currentParent === activeSubmenu.value) {
      const buttons = getButtonsForSubmenu(activeSubmenu.value);
      if (buttons[0]?.dataset.itemId) {
        activeMenuItemId.value = buttons[0].dataset.itemId;
      }
    } else {
      const buttons = getVisibleMoreButtons();
      if (buttons[0]?.dataset.itemId) {
        activeMenuItemId.value = buttons[0].dataset.itemId;
      }
    }
    return;
  }
  if (event.key === 'End') {
    event.preventDefault();
    if (activeSubmenu.value && isSubmenuChild && currentParent === activeSubmenu.value) {
      const buttons = getButtonsForSubmenu(activeSubmenu.value);
      const last = buttons[buttons.length - 1];
      if (last?.dataset.itemId) {
        activeMenuItemId.value = last.dataset.itemId;
      }
    } else {
      const buttons = getVisibleMoreButtons();
      const last = buttons[buttons.length - 1];
      if (last?.dataset.itemId) {
        activeMenuItemId.value = last.dataset.itemId;
      }
    }
    return;
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    const direction: 1 | -1 = event.shiftKey ? -1 : 1;
    if (activeSubmenu.value && isSubmenuChild && currentParent === activeSubmenu.value) {
      cycleButtons(getButtonsForSubmenu(activeSubmenu.value), direction);
    } else {
      cycleButtons(getVisibleMoreButtons(), direction);
    }
    return;
  }
  if (event.key === 'ArrowRight' && active?.dataset.hasChildren === 'true') {
    event.preventDefault();
    const item = toolbarItemMap.value.get(active.dataset.itemId || '');
    if (item) {
      openSubmenu(item);
      focusFirstChildButton(item.id);
    }
    return;
  }
  if (event.key === 'ArrowLeft') {
    if (active?.dataset.submenuChild === 'true') {
      event.preventDefault();
      focusParentButton(active);
      if (active.dataset.parentId && activeSubmenu.value === active.dataset.parentId) {
        activeSubmenu.value = null;
      }
      return;
    }
    if (active?.dataset.hasChildren === 'true' && activeSubmenu.value === active.dataset.itemId) {
      event.preventDefault();
      activeSubmenu.value = null;
      return;
    }
  }
  if ((event.key === 'Enter' || event.key === ' ') && active) {
    event.preventDefault();
    const itemId = active.dataset.itemId;
    if (!itemId) return;
    const item = toolbarItemMap.value.get(itemId);
    if (!item) return;
    if (hasChildren(item)) {
      toggleSubmenu(item);
      if (activeSubmenu.value) {
        focusFirstChildButton(item.id);
      }
    } else {
      handleToolbarAction(item);
    }
  }
}

function handleDragStart(groupId: string, itemId: string) {
  dragState.value = { groupId, itemId };
}

function handleDragEnd() {
  dragState.value = null;
  dragOverTarget.value = null;
}

function handleDragOver(groupId: string, itemId: string) {
  if (!dragState.value) return;
  dragOverTarget.value = { groupId, itemId };
}

function handleGroupDragOver(groupId: string) {
  if (!dragState.value) return;
  dragOverTarget.value = { groupId, itemId: null };
}

function handleDrop(groupId: string, itemId: string | null) {
  if (!dragState.value) return;
  const sourceGroup = toolbarGroups.value.find((entry) => entry.id === dragState.value?.groupId);
  const targetGroup = toolbarGroups.value.find((entry) => entry.id === groupId);
  if (!sourceGroup || !targetGroup) return;

  const fromIndex = sourceGroup.items.findIndex((entry) => entry.id === dragState.value?.itemId);
  if (fromIndex === -1) return;
  const [moved] = sourceGroup.items.splice(fromIndex, 1);

  if (itemId) {
    const toIndex = targetGroup.items.findIndex((entry) => entry.id === itemId);
    targetGroup.items.splice(toIndex === -1 ? targetGroup.items.length : toIndex, 0, moved);
  } else {
    targetGroup.items.push(moved);
  }

  dragState.value = null;
  dragOverTarget.value = null;
  saveToolbarOrder();
}

function handleGroupDrop(groupId: string) {
  handleDrop(groupId, null);
}

function isDropTarget(groupId: string) {
  return dragOverTarget.value?.groupId === groupId;
}

function isDropTargetItem(groupId: string, itemId: string) {
  return dragOverTarget.value?.groupId === groupId && dragOverTarget.value?.itemId === itemId;
}

function saveToolbarOrder() {
  const order = toolbarGroups.value.map((group) => ({
    id: group.id,
    items: group.items.map((item) => item.id)
  }));
  localStorage.setItem(getToolbarStorageKey('markdown-toolbar-order'), JSON.stringify(order));
}

function loadToolbarOrder() {
  const raw = readToolbarStorage('markdown-toolbar-order');
  if (!raw) {
    resetToolbarOrderToDefault();
    return;
  }
  try {
    const parsed = JSON.parse(raw) as { id: string; items: string[] }[];
    parsed.forEach((savedGroup) => {
      const group = toolbarGroups.value.find((entry) => entry.id === savedGroup.id);
      if (!group) return;
      const newItems = savedGroup.items
        .map((id) => group.items.find((item) => item.id === id))
        .filter(Boolean) as typeof group.items;
      const remaining = group.items.filter((item) => !savedGroup.items.includes(item.id));
      group.items = [...newItems, ...remaining];
    });
  } catch (error) {
    console.warn('[MarkdownEditor] Failed to load toolbar order', error);
    resetToolbarOrderToDefault();
  }
}

function loadShortcutBindings() {
  const raw = localStorage.getItem('markdown-shortcuts');
  if (raw) {
    try {
      shortcutBindings.value = JSON.parse(raw);
    } catch (error) {
      console.warn('[MarkdownEditor] Failed to load shortcuts', error);
      shortcutBindings.value = {};
    }
  }
}

function updateShortcut(action: string, keyBinding: string) {
  shortcutBindings.value[action] = keyBinding;
  localStorage.setItem('markdown-shortcuts', JSON.stringify(shortcutBindings.value));
}

function getShortcutAction(event: KeyboardEvent) {
  const keyCombo = [
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Meta' : '',
    event.key
  ].filter(Boolean).join('+');

  for (const [action, binding] of Object.entries(shortcutBindings.value)) {
    if (binding === keyCombo) {
      return action;
    }
  }
  return null;
}

function runShortcutAction(action: string) {
  // Find item in toolbar groups by action
  for (const group of toolbarGroups.value) {
    const item = group.items.find(item => item.action === action);
    if (item) {
      handleToolbarAction(item);
      return;
    }
  }
}

function loadToolbarPreferences() {
  const hiddenRaw = readToolbarStorage('markdown-toolbar-hidden');
  const collapsedRaw = readToolbarStorage('markdown-toolbar-collapsed');
  if (hiddenRaw) {
    try {
      hiddenItems.value = new Set(JSON.parse(hiddenRaw));
    } catch (error) {
      console.warn('[MarkdownEditor] Failed to load hidden items', error);
      hiddenItems.value = new Set();
    }
  } else {
    hiddenItems.value = new Set();
  }
  if (collapsedRaw) {
    try {
      collapsedGroups.value = new Set(JSON.parse(collapsedRaw));
    } catch (error) {
      console.warn('[MarkdownEditor] Failed to load collapsed groups', error);
      collapsedGroups.value = new Set();
    }
  } else {
    collapsedGroups.value = new Set();
  }
  updateToolbarPosition();
}

function resetToolbarOrderToDefault() {
  defaultToolbarOrder.forEach((savedGroup) => {
    const group = toolbarGroups.value.find((entry) => entry.id === savedGroup.id);
    if (!group) return;
    const newItems = savedGroup.items
      .map((id) => group.items.find((item) => item.id === id))
      .filter(Boolean) as typeof group.items;
    const remaining = group.items.filter((item) => !savedGroup.items.includes(item.id));
    group.items = [...newItems, ...remaining];
  });
}

function handleToolbarConfigUpdated() {
  loadToolbarOrder();
  loadToolbarPreferences();
  updateToolbarSizing();
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
   lastFormat.value = { before, after };
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
   lastFormat.value = { before: '```', after: '```' };
 }

 function insertHeading(level: number) {
   const prefix = '#'.repeat(Math.min(Math.max(level, 1), 6)) + ' ';
   insertMarkdown(prefix, '');
   showHeadingMenu.value = false;
 }

 function toggleFormatPainter() {
   if (formatPainterActive.value && lastFormat.value) {
     applyFormatPainter();
     return;
   }
   formatPainterActive.value = !formatPainterActive.value;
 }

function applyFormatPainter() {
  if (!formatPainterActive.value || !lastFormat.value) return;
  formatPainterActive.value = false;
  insertMarkdown(lastFormat.value.before, lastFormat.value.after);
}

function cancelFormatPainter() {
  if (formatPainterActive.value) {
    formatPainterActive.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
    const action = getShortcutAction(event);
    if (action) {
      event.preventDefault();
      runShortcutAction(action);
      return;
    }

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

   if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
     event.preventDefault();
     insertMarkdown('- ', '');
   }

   if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 't') {
     event.preventDefault();
     insertTaskList();
   }

   if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
     event.preventDefault();
     insertTable();
   }

   if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
     event.preventDefault();
     showToc.value = !showToc.value;
   }

   if ((event.ctrlKey || event.metaKey) && event.key === ']') {
     event.preventDefault();
     indentSelection();
   }

    if ((event.ctrlKey || event.metaKey) && event.key === '[') {
      event.preventDefault();
      outdentSelection();
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      applyFormatPainter();
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      insertDetails();
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

function wrapAlign(align: 'left' | 'center' | 'right' | 'justify') {
  const before = `<div align="${align}">`;
  const after = `</div>`;
  insertMarkdown(before, after);
}

 function insertComment() {
   insertMarkdown('<!-- ', ' -->');
 }

 function insertDetails() {
   const block = '\n<details>\n<summary>折叠标题</summary>\n\n内容...\n\n</details>\n';
   insertText(block);
 }

 function indentSelection() {
   const textarea = editorRef.value;
   if (!textarea) return;

   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const before = content.value.substring(0, start);
   const selection = content.value.substring(start, end);
   const after = content.value.substring(end);

   if (!selection) {
     insertText('  ');
     return;
   }

   const indented = selection
     .split('\n')
     .map((line) => (line.length ? `  ${line}` : line))
     .join('\n');

   content.value = before + indented + after;
   textarea.setSelectionRange(start, start + indented.length);
   textarea.focus();
   emit('update:modelValue', content.value);
 }

 function outdentSelection() {
   const textarea = editorRef.value;
   if (!textarea) return;

   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const before = content.value.substring(0, start);
   const selection = content.value.substring(start, end);
   const after = content.value.substring(end);

   if (!selection) {
     if (content.value.substring(start - 2, start) === '  ') {
       content.value = content.value.substring(0, start - 2) + content.value.substring(start);
       textarea.setSelectionRange(start - 2, start - 2);
       textarea.focus();
       emit('update:modelValue', content.value);
     }
     return;
   }

   const outdented = selection
     .split('\n')
     .map((line) => line.replace(/^ {1,2}/, ''))
     .join('\n');

   content.value = before + outdented + after;
   textarea.setSelectionRange(start, start + outdented.length);
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

 function addTableRow() {
   const textarea = editorRef.value;
   if (!textarea) return;
   const lines = content.value.split('\n');
   const cursorLine = content.value.substring(0, textarea.selectionStart).split('\n').length - 1;
   const separatorIndex = lines.findIndex((line, idx) => idx <= cursorLine && /\|.*-+.*\|/.test(line));
   if (separatorIndex === -1) {
     insertTable();
     return;
   }
   const colCount = lines[separatorIndex].split('|').length - 2;
   const row = `| ${Array(colCount).fill(' ').join(' | ')} |`;
   lines.splice(separatorIndex + 1, 0, row);
   content.value = lines.join('\n');
   emit('update:modelValue', content.value);
 }

 function addTableColumn() {
   const textarea = editorRef.value;
   if (!textarea) return;
   const lines = content.value.split('\n');
   const cursorLine = content.value.substring(0, textarea.selectionStart).split('\n').length - 1;
   const tableStart = lines.findIndex((line, idx) => idx <= cursorLine && line.includes('|'));
   if (tableStart === -1) {
     insertTable();
     return;
   }
   const tableLines: number[] = [];
   for (let i = tableStart; i < lines.length; i++) {
     if (!lines[i].includes('|')) break;
     tableLines.push(i);
   }
   tableLines.forEach((idx) => {
     if (lines[idx].includes('---')) {
       lines[idx] = `${lines[idx].trim()} --- |`;
     } else {
       lines[idx] = `${lines[idx].trim()}  |`;
     }
   });
   content.value = lines.join('\n');
   emit('update:modelValue', content.value);
 }

 function insertTaskList() {
   const textarea = editorRef.value;
   if (!textarea) return;

   const start = textarea.selectionStart;
   const end = textarea.selectionEnd;
   const selectedText = content.value.substring(start, end);

   if (!selectedText.trim()) {
     insertText('- [ ] ');
     return;
   }

   const lines = selectedText.split('\n');
   const withTasks = lines.map((line) => {
     if (!line.trim()) return line;
     if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) return line;
     return `- [ ] ${line.replace(/^\s*[-*]\s+/, '')}`;
   });
   const newText = content.value.substring(0, start) + withTasks.join('\n') + content.value.substring(end);
   content.value = newText;
   textarea.setSelectionRange(start, start + withTasks.join('\n').length);
   textarea.focus();

   emit('update:modelValue', content.value);
 }

function handleEditorScroll() {
  updateToolbarPosition();
  updateToolbarSizing();
  if (viewMode.value !== 'split' || !editorRef.value || !previewRef.value) return;
   
   const editor = editorRef.value;
   const preview = previewRef.value;
   
  const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
  preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
  if (editor.selectionStart !== editor.selectionEnd) {
    updateSelectionToolbarPosition();
  }
}

function refreshOpenSubmenuPlacement() {
  if (!activeSubmenu.value) return;
  updateSubmenuPlacement(activeSubmenu.value);
}

function handleWindowResize() {
  updateToolbarPosition();
  updateToolbarSizing();
  refreshOpenSubmenuPlacement();
}

 watch(() => props.modelValue, (newValue) => {
   if (newValue !== content.value) {
     content.value = newValue;
   }
 });

 watch(() => settingsStore.settings.toolbarPosition, () => {
   updateToolbarPosition();
   handleToolbarConfigUpdated();
 });

 watch(
  () => settingsStore.settings.toolbarMultipleConfig,
  (enabled, previous) => {
    if (!enabled && previous) {
      const scope = settingsStore.settings.toolbarPosition;
      ['markdown-toolbar-order', 'markdown-toolbar-hidden', 'markdown-toolbar-collapsed'].forEach((base) => {
        const scoped = localStorage.getItem(`${base}-${scope}`);
        if (scoped) {
          localStorage.setItem(base, scoped);
        }
      });
    }
    handleToolbarConfigUpdated();
  },
 );

 watch(
  () => [toolbarAppearance.value.iconSize, settingsStore.settings.toolbarLayout, settingsStore.settings.toolbarStyle],
  () => {
    nextTick(() => updateToolbarSizing());
  },
 );

 watch(() => showMoreMenu.value, (open) => {
   if (open) {
     focusFirstMoreButton();
     refreshOpenSubmenuPlacement();
   }
 });

 watch(() => activeMenuItemId.value, (id) => {
   if (!id) {
     menuAnnounce.value = '';
     return;
   }
   const item = toolbarItemMap.value.get(id);
   if (!item) return;
   menuAnnounce.value = item.title ?? item.label;
 });

 function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showHelp.value) {
    event.preventDefault();
    showHelp.value = false;
  }
  if (event.key === 'Escape' && showHeadingMenu.value) {
    event.preventDefault();
    showHeadingMenu.value = false;
  }
  if (event.key === 'Escape' && showMoreMenu.value) {
    event.preventDefault();
    closeMoreMenu();
  }
 }

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('mousemove', handleSelectionMove);
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('markdown-toolbar-config-updated', handleToolbarConfigUpdated);
  loadToolbarPreferences();
  loadShortcutBindings();
  loadToolbarOrder();
  updateActiveFormats();
  updateToolbarPosition();
  updateToolbarSizing();
  emit('ready');
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('mousemove', handleSelectionMove);
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('markdown-toolbar-config-updated', handleToolbarConfigUpdated);
  if (submenuOpenTimer.value) {
    window.clearTimeout(submenuOpenTimer.value);
  }
  if (submenuCloseTimer.value) {
    window.clearTimeout(submenuCloseTimer.value);
  }
});
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.markdown-editor:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  box-shadow: var(--shadow-md), var(--shadow-inset-soft);
}

.markdown-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(
    --editing-toolbar-background-color,
    color-mix(in srgb, var(--color-surface) 88%, transparent)
  );
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-subtle) 85%, transparent);
  flex-wrap: wrap;
  width: 100%;
}

.toolbar-pos-top .markdown-editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 3;
}

.toolbar-layout-center .markdown-editor-toolbar {
  width: fit-content;
  margin: 0 auto;
}

.toolbar-pos-fixed .markdown-editor-toolbar {
  position: absolute;
  right: calc(12px + var(--toolbar-fixed-offset-x, 0px));
  bottom: calc(12px + var(--toolbar-fixed-offset-y, 0px));
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.toolbar-pos-following .markdown-editor-toolbar {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.toolbar-style-glass .markdown-editor-toolbar {
  background: var(
    --editing-toolbar-background-color,
    color-mix(in srgb, var(--color-surface) 70%, transparent)
  );
  backdrop-filter: blur(10px);
  border-color: color-mix(in srgb, var(--color-border-subtle) 60%, transparent);
}

.toolbar-style-tiny .markdown-editor-toolbar {
  gap: 4px;
  padding: 4px 6px;
}

.toolbar-style-tiny .markdown-editor-toolbar button {
  width: calc(var(--toolbar-icon-size, 18px) + 6px);
  height: calc(var(--toolbar-icon-size, 18px) + 6px);
  border-radius: 6px;
}

.toolbar-style-tiny .markdown-editor-toolbar button svg {
  width: calc(var(--toolbar-icon-size, 18px) - 5px);
  height: calc(var(--toolbar-icon-size, 18px) - 5px);
}

.toolbar-autohide .markdown-editor-toolbar {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toolbar-autohide.editor-focused .markdown-editor-toolbar,
.toolbar-autohide:hover .markdown-editor-toolbar {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.markdown-editor-toolbar button {
  width: calc(var(--toolbar-icon-size, 18px) + 10px);
  height: calc(var(--toolbar-icon-size, 18px) + 10px);
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--editing-toolbar-icon-color, var(--color-text-muted));
  user-select: none;
  padding: 0;
  position: relative;
}

.markdown-editor-toolbar button[data-tooltip]::after,
.selection-toolbar button[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%) translateY(4px);
  background: color-mix(in srgb, var(--color-surface) 92%, #000 8%);
  color: var(--color-text-body);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 10px 30px color-mix(in srgb, #000 20%, transparent);
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 0.12s ease, transform 0.12s ease;
  transition-delay: 0.18s;
  z-index: 30;
}

.markdown-editor-toolbar button[data-tooltip]::before,
.selection-toolbar button[data-tooltip]::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: calc(100% + 2px);
  transform: translateX(-50%) translateY(4px);
  border: 6px solid transparent;
  border-top-color: color-mix(in srgb, var(--color-surface) 92%, #000 8%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease;
  transition-delay: 0.18s;
  z-index: 30;
}

@media (prefers-reduced-motion: reduce) {
  .markdown-editor-toolbar button[data-tooltip]::after,
  .selection-toolbar button[data-tooltip]::after,
  .markdown-editor-toolbar button[data-tooltip]::before,
  .selection-toolbar button[data-tooltip]::before {
    transition: none;
    transition-delay: 0s;
  }
}

.markdown-editor-toolbar button[data-tooltip-position="bottom"]::after,
.selection-toolbar button[data-tooltip-position="bottom"]::after {
  bottom: auto;
  top: calc(100% + 8px);
  transform: translateX(-50%) translateY(-4px);
}

.markdown-editor-toolbar button[data-tooltip-position="bottom"]::before,
.selection-toolbar button[data-tooltip-position="bottom"]::before {
  bottom: auto;
  top: calc(100% + 2px);
  transform: translateX(-50%) translateY(-4px);
  border-top-color: transparent;
  border-bottom-color: color-mix(in srgb, var(--color-surface) 92%, #000 8%);
}

.markdown-editor-toolbar button[data-tooltip]:hover::after,
.markdown-editor-toolbar button[data-tooltip]:focus-visible::after,
.selection-toolbar button[data-tooltip]:hover::after,
.selection-toolbar button[data-tooltip]:focus-visible::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition-delay: 0s;
}

.markdown-editor-toolbar button[data-tooltip]:hover::before,
.markdown-editor-toolbar button[data-tooltip]:focus-visible::before,
.selection-toolbar button[data-tooltip]:hover::before,
.selection-toolbar button[data-tooltip]:focus-visible::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition-delay: 0s;
}

.markdown-editor-toolbar button:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent-strong);
}

.markdown-editor-toolbar button:active {
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.markdown-editor-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.markdown-editor-toolbar button svg {
  width: var(--toolbar-icon-size, 18px);
  height: var(--toolbar-icon-size, 18px);
  stroke-width: 1.8;
}

.markdown-editor-toolbar button.active {
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
  color: var(--color-accent-strong);
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border-subtle);
}

.toolbar-divider-item {
  width: 1px;
  height: 18px;
  align-self: center;
  background: color-mix(in srgb, var(--color-border-subtle) 85%, transparent);
  margin: 0 2px;
}

.toolbar-divider-item {
  width: 1px;
  height: 20px;
  align-self: center;
  background: color-mix(in srgb, var(--color-border-subtle) 85%, transparent);
  margin: 0 2px;
}

.toolbar-spacer {
  flex: 1;
  min-width: 12px;
}

.toolbar-group {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
}

.toolbar-group-toggle {
  width: calc(var(--toolbar-icon-size, 18px) + 6px);
  height: calc(var(--toolbar-icon-size, 18px) + 6px);
  border-radius: 6px;
  border: 1px solid transparent;
  color: var(--editing-toolbar-icon-color, var(--color-text-muted));
}

.toolbar-group-toggle:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent-strong);
}

.toolbar-button.dragging {
  opacity: 0.6;
}

.toolbar-button.drop-target {
  position: relative;
}

.toolbar-button.drop-target::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--color-accent) 55%, transparent);
}

.toolbar-drop-slot {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1.5px dashed color-mix(in srgb, var(--color-accent) 45%, transparent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}

.toolbar-group--drag {
  outline: 1px dashed color-mix(in srgb, var(--color-accent) 40%, transparent);
}

.toolbar-group--more {
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  border-color: color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
}

.toolbar-more-panel .toolbar-more-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid transparent;
}

.toolbar-more-panel .toolbar-more-button:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 24%, transparent);
}

.toolbar-more-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
}

.toolbar-more-section:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.toolbar-more-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.toolbar-more-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toolbar-more-item {
  position: relative;
}

.toolbar-more-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-body);
  transition: all 0.2s ease;
  text-align: left;
}

.toolbar-more-button:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 24%, transparent);
}

.toolbar-more-button svg {
  width: 16px;
  height: 16px;
}

.toolbar-more-button.is-active {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 26%, transparent);
  color: var(--color-accent-strong);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.toolbar-more-item--submenu .toolbar-more-button {
  justify-content: space-between;
}

.toolbar-more-item--submenu .toolbar-more-button span {
  flex: 1;
}

.toolbar-submenu-icon {
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
}

.toolbar-submenu-panel {
  position: absolute;
  top: 0;
  left: calc(100% + 10px);
  min-width: 180px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  box-shadow: 0 16px 30px color-mix(in srgb, #000 20%, transparent);
  padding: 8px;
  display: none;
  flex-direction: column;
  gap: 8px;
  z-index: 20;
  opacity: 0;
  transform: translateX(6px) scale(0.98);
  transition: opacity 0.16s cubic-bezier(0.2, 0.6, 0.2, 1),
    transform 0.2s cubic-bezier(0.2, 0.6, 0.2, 1);
}

.toolbar-submenu-panel.submenu-left {
  left: auto;
  right: calc(100% + 10px);
  transform: translateX(-6px) scale(0.98);
}

.toolbar-more-item--submenu:hover .toolbar-submenu-panel,
.toolbar-more-item--submenu.open .toolbar-submenu-panel {
  display: flex;
  opacity: 1;
  transform: translateX(0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .toolbar-submenu-panel {
    transition: none;
    transform: translateX(0) scale(1);
  }
}

.toolbar-more-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.toolbar-more-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.toolbar-chip {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  font-size: 11px;
  color: var(--color-text-muted);
}

.toolbar-chip.active {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 26%, transparent);
  color: var(--color-accent-strong);
}

.toolbar-shortcut-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 8px;
}

.toolbar-shortcut-label {
  font-size: 12px;
  color: var(--color-text-body);
}

.toolbar-shortcut-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  padding: 6px 8px;
  font-size: 12px;
  color: var(--color-text-body);
}

.selection-toolbar {
  position: absolute;
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(
    --editing-toolbar-background-color,
    color-mix(in srgb, var(--color-surface) 92%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 80%, transparent);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(6px);
  z-index: 4;
}

.selection-toolbar button {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--editing-toolbar-icon-color, var(--color-text-muted));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.selection-toolbar button:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent-strong);
}

.view-group {
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.toolbar-popover {
  position: absolute;
  inset: 0;
  background: transparent;
  z-index: 5;
}

.toolbar-popover-panel {
  margin: 8px 12px;
  max-width: 240px;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 80%, transparent);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toolbar-color-panel {
  max-width: 260px;
}

.toolbar-color-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.toolbar-color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.toolbar-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
  cursor: pointer;
}

.toolbar-color-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.toolbar-color-apply,
.toolbar-color-clear {
  border-radius: 10px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 70%, transparent);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  font-size: 12px;
}

.toolbar-popover-panel > button {
  width: 100%;
  justify-content: flex-start;
  height: auto;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--color-text-body);
  background: transparent;
  border: 1px solid transparent;
}

.toolbar-popover-panel > button:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
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
  border-right: 1px solid var(--color-border-subtle);
  background: transparent;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-body);
  resize: none;
  outline: none;
  overflow-y: auto;
}

.view-edit .markdown-editor-textarea,
.view-preview .markdown-editor-textarea {
  border-right: none;
}

.markdown-editor-textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}

.markdown-editor-preview {
  padding: 20px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.01);
}

.markdown-preview-content {
  display: flex;
  flex-direction: column;
}

.markdown-toc {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.markdown-toc-title {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.markdown-toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.markdown-toc-list li {
  line-height: 1.4;
}

.markdown-toc-list a {
  color: var(--color-text-body);
  text-decoration: none;
  border-bottom: 1px dotted color-mix(in srgb, var(--color-accent) 30%, transparent);
  padding-bottom: 2px;
}

.markdown-toc-list a:hover {
  color: var(--color-accent-strong);
  border-bottom-style: solid;
}

.toc-level-2 { padding-left: 12px; }
.toc-level-3 { padding-left: 24px; }
.toc-level-4 { padding-left: 36px; }
.toc-level-5 { padding-left: 48px; }
.toc-level-6 { padding-left: 60px; }

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
  color: var(--color-text-body);
  scroll-margin-top: 80px;
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
  color: var(--color-text-muted);
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
  background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface));
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
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
  border-radius: 10px;
  overflow: hidden;
  display: block;
  max-width: 100%;
}

.markdown-editor-preview :deep(th),
.markdown-editor-preview :deep(td) {
  padding: 0.5em 1em;
  border: 1px solid var(--glass-border);
  text-align: left;
}

.markdown-editor-preview :deep(th) {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  font-weight: 600;
}

.markdown-editor-preview :deep(tr:nth-child(even) td) {
  background: color-mix(in srgb, var(--color-accent) 4%, transparent);
}

.markdown-editor-preview :deep(.task-list-item) {
  list-style: none;
  margin-left: -1.2em;
}

.markdown-editor-preview :deep(.task-list-item input[type="checkbox"]) {
  margin-right: 8px;
  transform: translateY(1px);
  accent-color: var(--color-accent-strong);
}

.markdown-editor-preview :deep(hr) {
  margin: 2em 0;
  border: none;
  border-top: 2px solid var(--glass-border);
}

.markdown-editor-preview :deep(.hljs) {
  display: block;
  overflow-x: auto;
  padding: 0;
  color: var(--color-text-body);
}

.markdown-editor-preview :deep(.hljs-keyword),
.markdown-editor-preview :deep(.hljs-selector-tag),
.markdown-editor-preview :deep(.hljs-literal) {
  color: var(--color-accent-strong);
}

.markdown-editor-preview :deep(.hljs-string),
.markdown-editor-preview :deep(.hljs-attr) {
  color: color-mix(in srgb, var(--color-accent-strong) 65%, #1f7a5c);
}

.markdown-editor-preview :deep(.hljs-title),
.markdown-editor-preview :deep(.hljs-section),
.markdown-editor-preview :deep(.hljs-name) {
  color: color-mix(in srgb, var(--color-accent-strong) 70%, #6b4bb6);
}

.markdown-editor-preview :deep(.hljs-comment) {
  color: color-mix(in srgb, var(--color-text-muted) 75%, transparent);
  font-style: italic;
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
  color: var(--color-text-body);
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
  color: var(--color-text-muted);
}

.close-panel:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--color-text-body);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  font-size: 12px;
}

.shortcut-desc {
  margin-left: 8px;
  font-size: 13px;
  color: var(--color-text-body);
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

/* Business-calm motion clamp (final) */
.markdown-editor,
.markdown-editor-toolbar button,
.close-panel {
  transition: none;
}

.markdown-editor-toolbar button:hover,
.markdown-editor-toolbar button:active,
.close-panel:hover {
  transform: none;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: none;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 1;
}
</style>
