<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../../stores/ui';
import IconButton from '../ui/IconButton.vue';
import Dropdown, { type DropdownItem } from '../ui/Dropdown.vue';

const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();

withDefaults(defineProps<{ scrolled?: boolean }>(), { scrolled: false });

const newItems: DropdownItem[] = [
  { key: 'quick', label: t('editor.newQuick'), icon: 'M13 2 4.5 20h5L18 2h-5ZM22 22H2', kbd: 'N' },
  { key: 'article', label: t('editor.newArticle'), icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6', kbd: '⇧N' },
];

function onNewSelect(key: string) {
  router.push(key === 'article' ? '/notes/new/article' : '/notes/new');
}
</script>

<template>
  <header class="app-header" :class="{ scrolled }">
    <div class="header-left">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3.5h9.5L20 8v11.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 19.5v-14A1.5 1.5 0 0 1 6.5 4h1.8" />
            <path d="M14 3.5V8h4.5" />
            <path d="M9 12.5h6M9 16h4" />
          </svg>
        </span>
        <span class="brand-name">{{ t('common.appName') }}</span>
        <span class="brand-tagline">{{ t('common.tagline') }}</span>
      </div>
    </div>

    <div class="header-center">
      <button class="search-trigger" type="button" @click="ui.showSearchPalette = true">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <span class="search-text">{{ t('search.placeholder') }}</span>
        <kbd class="search-kbd">⌘K</kbd>
      </button>
    </div>

    <div class="header-right">
      <Dropdown :items="newItems" @select="onNewSelect">
        <template #default="{ toggle }">
          <button class="new-btn" type="button" @click="toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{{ t('common.new') }}</span>
          </button>
        </template>
      </Dropdown>

      <IconButton :label="t('settings.title')" @click="ui.showSettings = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </IconButton>
      <IconButton :label="t('shortcuts.showHelp')" @click="ui.showShortcuts = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.2 9a2.8 2.8 0 0 1 5.5.8c0 1.9-2.7 2.4-2.7 4.2" />
          <path d="M12 17.5h.01" stroke-width="2.6" />
        </svg>
      </IconButton>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  flex: none;
  display: flex;
  align-items: center;
  gap: 20px;
  height: var(--header-height);
  padding: 0 16px 0 20px;
  background: color-mix(in srgb, var(--paper-0) calc(var(--glass-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--line);
  position: relative;
  z-index: 30;
  transition: box-shadow var(--dur-med) var(--ease-out);
}
/* 滚动感知：内容滚动后顶栏浮起 */
.app-header.scrolled {
  box-shadow: var(--shadow-2);
}

.header-left {
  flex: none;
  min-width: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}
.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-strong);
  animation: brand-in 0.55s var(--ease-spring) 0.1s both;
}
@keyframes brand-in {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-12deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
.brand-mark svg {
  width: 17px;
  height: 17px;
}
.brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--ink-900);
}
.brand-tagline {
  font-size: 11.5px;
  color: var(--ink-500);
  letter-spacing: 0.08em;
  display: none;
}
@media (min-width: 640px) {
  .brand-tagline {
    display: inline;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}
.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(360px, 100%);
  height: 32px;
  padding: 0 10px 0 12px;
  border-radius: var(--radius-full);
  background: var(--paper-1);
  border: 1px solid var(--line);
  color: var(--ink-500);
  font-size: 13px;
  transition: border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.search-trigger:hover {
  background: var(--paper-2);
  border-color: var(--line-strong);
}
.search-trigger:focus-visible,
.search-trigger:active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.search-trigger:focus-within {
  transform: scale(1.03);
}
.search-icon {
  flex: none;
  width: 14px;
  height: 14px;
}
.search-text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-kbd {
  flex: none;
  font-family: var(--font-sans);
  font-size: 10.5px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--paper-0);
  border: 1px solid var(--line);
  color: var(--ink-500);
}

.header-right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-1);
  transition: background-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.new-btn:hover {
  background: var(--accent-strong);
  box-shadow: var(--shadow-2);
}
.new-btn svg {
  width: 14px;
  height: 14px;
}
</style>
