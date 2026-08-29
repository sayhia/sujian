<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { renderMarkdown, withHeadingIds, extractToc } from '../../composables/useMarkdown';

const props = defineProps<{ content: string; showToc: boolean }>();

const rendered = computed(() => withHeadingIds(renderMarkdown(props.content)));
const toc = computed(() => extractToc(props.content));
const activeId = ref<string | null>(null);
const viewerRef = ref<HTMLElement | null>(null);

const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;

// 渲染完成后为代码块注入复制按钮
watch(rendered, async () => {
  await nextTick();
  attachCopyButtons();
});

function attachCopyButtons() {
  const container = viewerRef.value;
  if (!container) return;
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.code-copy')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.innerHTML = copyIcon;
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = '✓';
        setTimeout(() => {
          btn.innerHTML = copyIcon;
        }, 1500);
      } catch {
        /* clipboard unavailable */
      }
    });
    pre.appendChild(btn);
  });
}

function onScroll() {
  const container = viewerRef.value;
  if (!container || toc.value.length === 0) return;
  const headings = container.querySelectorAll<HTMLElement>('h1[id^="toc-"], h2[id^="toc-"], h3[id^="toc-"]');
  let current: string | null = null;
  for (const h of headings) {
    if (h.getBoundingClientRect().top <= 96) current = h.id;
  }
  activeId.value = current;
}

function jumpTo(id: string) {
  const el = viewerRef.value?.querySelector<HTMLElement>(`#${id}`);
  if (el) {
    const top = el.getBoundingClientRect().top + (viewerRef.value?.scrollTop ?? 0) - 64;
    viewerRef.value?.scrollTo({ top, behavior: 'smooth' });
    activeId.value = id;
  }
}
</script>

<template>
  <div class="markdown-viewer" ref="viewerRef" @scroll.passive="onScroll">
    <aside v-if="showToc && toc.length" class="viewer-toc">
      <p class="toc-label">TOC</p>
      <button
        v-for="item in toc"
        :key="item.id"
        type="button"
        class="toc-item"
        :class="[`lv-${item.level}`, { active: activeId === item.id }]"
        @click="jumpTo(item.id)"
      >
        {{ item.text }}
      </button>
    </aside>
    <div class="markdown-body viewer-body" v-html="rendered" />
  </div>
</template>

<style scoped>
.markdown-viewer {
  position: relative;
  display: flex;
  gap: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 260px);
  padding: 4px 2px 40px;
}
.viewer-toc {
  flex: none;
  width: 168px;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  border-right: 1px solid var(--line);
  padding-right: 14px;
}
.toc-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ink-500);
  margin-bottom: 8px;
}
.toc-item {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-500);
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.toc-item:hover {
  background: var(--paper-1);
  color: var(--ink-900);
}
.toc-item.active {
  color: var(--accent-strong);
  background: var(--accent-soft);
  font-weight: 600;
}
.toc-item.lv-2 {
  padding-left: 14px;
}
.toc-item.lv-3 {
  padding-left: 22px;
}
.viewer-body {
  flex: 1;
  min-width: 0;
}

/* 代码块复制按钮 */
:deep(.markdown-body pre) {
  position: relative;
}
:deep(.code-copy) {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--paper-2);
  color: var(--ink-500);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
  font-size: 12px;
  font-weight: 700;
}
.markdown-viewer:hover :deep(.code-copy) {
  opacity: 1;
}
:deep(.code-copy:hover) {
  color: var(--accent-strong);
  background: var(--accent-soft);
  transform: scale(1.05);
}
:deep(.code-copy svg) {
  width: 13px;
  height: 13px;
}
</style>
