<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../../stores/settings';
import Segmented from '../ui/Segmented.vue';
import Switch from '../ui/Switch.vue';
import { accentThemes } from '../../types';
import type { FontSize, Theme } from '../../types';

const { t } = useI18n();
const settings = useSettingsStore();

const themeOptions = [
  { value: 'light' as Theme, label: t('settings.themeLight') },
  { value: 'dark' as Theme, label: t('settings.themeDark') },
  { value: 'system' as Theme, label: t('settings.themeSystem') },
];

const sizeOptions = [
  { value: 'small' as const, label: t('settings.fontSmall') },
  { value: 'medium' as const, label: t('settings.fontMedium') },
  { value: 'large' as const, label: t('settings.fontLarge') },
];
</script>

<template>
  <section class="section">
    <h4 class="section-title">{{ t('settings.appearance') }}</h4>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.themeLabel') }}</p>
      </div>
      <Segmented
        :model-value="settings.settings.theme"
        :options="themeOptions"
        @update:model-value="(v) => settings.setTheme(v as Theme)"
      />
    </div>

    <div class="setting-row accent-block">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.accentLabel') }}</p>
        <p class="setting-desc">{{ t('settings.accentDesc') }}</p>
      </div>
      <div class="accent-grid" role="radiogroup" :aria-label="t('settings.accentLabel')">
        <button
          v-for="th in accentThemes"
          :key="th.key"
          type="button"
          class="accent-card"
          :class="{ active: settings.settings.accent === th.key }"
          :style="{
            '--accent-color': settings.effectiveTheme === 'dark' ? th.darkColor : th.color,
          }"
          role="radio"
          :aria-checked="settings.settings.accent === th.key"
          @click="settings.setAccent(th.key)"
        >
          <span class="accent-swatch" aria-hidden="true">
            <span class="swatch-core" />
          </span>
          <span class="accent-info">
            <span class="accent-name">{{ t(th.nameKey) }}</span>
            <span class="accent-desc">{{ t(th.descKey) }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.fontSizeLabel') }}</p>
      </div>
      <Segmented
        :model-value="settings.settings.fontSize"
        :options="sizeOptions"
        @update:model-value="(v) => settings.setFontSize(v as FontSize)"
      />
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.glassLabel') }}</p>
        <p class="setting-desc">{{ t('settings.glassDesc') }}</p>
      </div>
      <input
        class="glass-slider"
        type="range"
        min="0"
        max="100"
        step="5"
        :value="settings.settings.glassIntensity"
        :aria-label="t('settings.glassLabel')"
        :style="{ '--fill': `${settings.settings.glassIntensity}%` }"
        @input="settings.setGlassIntensity(Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <p class="setting-name">{{ t('settings.animationsLabel') }}</p>
      </div>
      <Switch
        :model-value="settings.settings.animationsEnabled"
        :label="t('settings.animationsLabel')"
        @update:model-value="(v) => settings.setAnimationsEnabled(v)"
      />
    </div>
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* ---------- 主题色卡片 ---------- */
.accent-block {
  align-items: flex-start;
  flex-direction: column;
}
.accent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
}
.accent-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border-radius: var(--radius-md);
  background: var(--paper-1);
  border: 1px solid var(--line);
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.accent-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-1px);
}
.accent-card.active {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 30%, transparent);
  background: color-mix(in srgb, var(--accent-color) 6%, var(--paper-1));
}
.accent-swatch {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent-color) 14%, transparent);
}
.swatch-core {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--accent-color);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--accent-color) 45%, transparent);
}
.accent-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.accent-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink-900);
}
.accent-desc {
  font-size: 11.5px;
  color: var(--ink-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.glass-slider {
  appearance: none;
  width: 160px;
  height: 4px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    var(--accent) var(--fill, 50%),
    var(--paper-2) var(--fill, 50%)
  );
  cursor: pointer;
}
.glass-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--paper-0);
  box-shadow: var(--shadow-1);
  cursor: pointer;
}
</style>
