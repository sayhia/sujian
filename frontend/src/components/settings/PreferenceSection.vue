<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../../stores/settings';
import Segmented from '../ui/Segmented.vue';
import type { EditorWidth, Language, TimeFormat } from '../../types';

const { t } = useI18n();
const settings = useSettingsStore();

const timeOptions = [
  { value: '24h' as TimeFormat, label: t('settings.time24h') },
  { value: '12h' as TimeFormat, label: t('settings.time12h') },
];

const langOptions = [
  { value: 'zh' as Language, label: t('settings.langZh') },
  { value: 'en' as Language, label: t('settings.langEn') },
  { value: 'ja' as Language, label: t('settings.langJa') },
  { value: 'ko' as Language, label: t('settings.langKo') },
];

const widthOptions = [
  { value: 'narrow' as EditorWidth, label: t('settings.widthNarrow') },
  { value: 'medium' as EditorWidth, label: t('settings.widthMedium') },
  { value: 'wide' as EditorWidth, label: t('settings.widthWide') },
];
</script>

<template>
  <section class="section">
    <h4 class="section-title">{{ t('settings.preferences') }}</h4>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.widthLabel') }}</p>
        <p class="setting-desc">{{ t('settings.widthDesc') }}</p>
      </div>
      <Segmented
        :model-value="settings.settings.editorWidth"
        :options="widthOptions"
        @update:model-value="(v) => settings.setEditorWidth(v as EditorWidth)"
      />
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.timeFormatLabel') }}</p>
      </div>
      <Segmented
        :model-value="settings.settings.timeFormat"
        :options="timeOptions"
        @update:model-value="(v) => settings.setTimeFormat(v as TimeFormat)"
      />
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.languageLabel') }}</p>
      </div>
      <Segmented
        :model-value="settings.settings.language"
        :options="langOptions"
        @update:model-value="(v) => settings.setLanguage(v as Language)"
      />
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
</style>
