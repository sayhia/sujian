<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { updaterApi } from '../../services/updater';
import UpdateDialog from './UpdateDialog.vue';

const { t } = useI18n();
const currentVersion = ref('dev');
const showUpdate = ref(false);

onMounted(async () => {
  currentVersion.value = await updaterApi.currentVersion();
});

const shortcuts = [
  { label: t('shortcuts.search'), keys: '⌘K' },
  { label: t('shortcuts.newQuick'), keys: 'N' },
  { label: t('shortcuts.newArticle'), keys: '⇧N' },
  { label: t('shortcuts.toggleView'), keys: 'G' },
  { label: t('shortcuts.toggleSidebar'), keys: 'F' },
  { label: t('shortcuts.openSettings'), keys: '⌘,' },
  { label: t('shortcuts.close'), keys: 'Esc' },
];
</script>

<template>
  <section class="about">
    <div class="about-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 3.5h9.5L20 8v11.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 19.5v-14A1.5 1.5 0 0 1 6.5 4h1.8" />
        <path d="M14 3.5V8h4.5" />
        <path d="M9 12.5h6M9 16h4" />
      </svg>
    </div>
    <h4 class="about-name">
      {{ t('common.appName') }}
      <span class="about-version">{{ currentVersion === 'dev' ? t('settings.updater.dev') : 'v' + currentVersion }}</span>
    </h4>
    <p class="about-desc">{{ t('settings.aboutDesc') }}</p>
    <button class="about-check-btn" @click="showUpdate = true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
      <span>{{ t('settings.updater.checkButton') }}</span>
    </button>
    <UpdateDialog v-model="showUpdate" />

    <div class="about-shortcuts">
      <p class="about-label">{{ t('settings.shortcutsTitle') }}</p>
      <div class="sc-list">
        <div v-for="s in shortcuts" :key="s.label" class="sc-row">
          <span class="sc-name">{{ s.label }}</span>
          <kbd>{{ s.keys }}</kbd>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 0;
}
.about-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent-strong);
  margin-bottom: 14px;
}
.about-logo svg {
  width: 32px;
  height: 32px;
}
.about-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-900);
}
.about-version {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-500);
  margin-left: 4px;
}
.about-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-700);
  max-width: 380px;
  margin-top: 8px;
}
.about-check-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--paper-1);
  color: var(--ink-800);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s var(--ease-spring, ease);
}
.about-check-btn:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
  border-color: var(--accent-strong);
}
.about-check-btn svg {
  width: 15px;
  height: 15px;
}
.about-shortcuts {
  width: 100%;
  max-width: 380px;
  margin-top: 24px;
  text-align: left;
}
.about-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-500);
  margin-bottom: 8px;
}
.sc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sc-name {
  font-size: 13px;
  color: var(--ink-900);
}
.sc-row kbd {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--paper-1);
  border: 1px solid var(--line);
  color: var(--ink-700);
  box-shadow: 0 1px 0 var(--line);
}
</style>
