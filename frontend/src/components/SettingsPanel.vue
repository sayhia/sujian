<template>
  <div class="settings-panel-content">
    <!-- Header -->
    <div class="settings-header">
      <div class="settings-title-wrapper">
        <Settings class="settings-title-icon" />
        <h2 class="settings-title">
          {{ t('settings.title') }}
        </h2>
      </div>
      <button 
        @click="$emit('close')" 
        class="settings-close"
        :aria-label="t('settings.appearance.title')"
      >
        <X class="settings-close-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- Content -->
    <div class="settings-content">
      <!-- Navigation -->
      <div class="settings-nav">
        <button
          v-for="section in sections"
          :key="section.id"
          @click="activeSection = section.id"
          class="settings-nav-item"
          :class="{ active: activeSection === section.id }"
          :aria-label="section.label"
          :aria-current="activeSection === section.id ? 'page' : undefined"
          type="button"
        >
          <component :is="section.icon" class="settings-nav-icon" />
          <span>{{ section.label }}</span>
        </button>
      </div>

      <!-- Settings Sections -->
      <div class="settings-sections">
        <!-- Appearance -->
        <div v-show="activeSection === 'appearance'" class="settings-section">
          <h3 class="section-title">
            {{ t('settings.appearance.title') }}
          </h3>
          
          <!-- 全局主题：亮色 / 暗色 / 跟随系统 -->
          <div class="setting-group">
            <label class="setting-label">
              <Palette class="setting-label-icon" />
              {{ t('settings.appearance.themeLabel') }}
            </label>
            <div class="setting-controls">
              <button
                v-for="themeOption in themeOptions"
                :key="themeOption.value"
                @click="setTheme(themeOption.value)"
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.theme === themeOption.value }"
                :aria-label="themeOption.label"
              >
                <component :is="themeOption.icon" class="setting-option-icon" />
                <span>{{ themeOption.label }}</span>
              </button>
            </div>
          </div>

          <!-- 主题包：统一管理亮色和暗色风格（视觉化颜色卡片） -->
          <div class="setting-group">
            <label class="setting-label">
              <Sparkles class="setting-label-icon" />
              {{ t('settings.preferences.themePackLabel') }}
            </label>
            <p class="setting-description">
              {{ t('settings.preferences.themePackDesc') }}
            </p>
            <div class="theme-cards-grid">
              <button
                v-for="pack in themePacks"
                :key="pack.id"
                class="theme-card"
                :class="{ active: settingsStore.settings.themePack === pack.id }"
                type="button"
                @click="settingsStore.setThemePack(pack.id)"
                :aria-label="pack.label"
              >
                <div class="theme-card-preview" :style="{ background: pack.colors.bg, borderColor: pack.colors.border }">
                  <div class="theme-palette">
                    <div
                      v-for="(color, idx) in (pack.colors.palette ?? [pack.colors.primary, pack.colors.secondary, pack.colors.accent])"
                      :key="idx"
                      class="palette-cylinder"
                      :style="{ background: color }"
                      :title="`Color ${idx + 1}`"
                    />
                  </div>
                </div>
                <span class="theme-card-label">{{ pack.label }}</span>
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <Type class="setting-label-icon" />
              {{ t('settings.appearance.fontSizeLabel') }}
            </label>
            <div class="setting-controls">
              <button
                v-for="sizeOption in fontSizeOptions"
                :key="sizeOption.value"
                @click="setFontSize(sizeOption.value)"
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.fontSize === sizeOption.value }"
                :aria-label="t('settings.appearance.fontSizeAria', { size: sizeOption.label })"
                :aria-pressed="settingsStore.settings.fontSize === sizeOption.value"
                type="button"
              >
                {{ sizeOption.label }}
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <Sliders class="setting-label-icon" />
              {{ t('settings.appearance.glassLabel') }}
            </label>
            <div class="setting-controls">
              <input
                type="range"
                :value="settingsStore.settings.glassEffectIntensity"
                @input="setGlassEffectIntensity(($event.target as HTMLInputElement).valueAsNumber)"
                min="0"
                max="100"
                class="setting-range"
              />
              <span class="setting-range-value">{{ settingsStore.settings.glassEffectIntensity }}%</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <ToggleLeft class="setting-label-icon" :class="{ 'is-on': settingsStore.settings.animationsEnabled }" />
              {{ t('settings.appearance.animationsLabel') }}
            </label>
            <div class="setting-controls">
              <button
                @click="setAnimationsEnabled(!settingsStore.settings.animationsEnabled)"
                class="setting-toggle"
                :class="{ active: settingsStore.settings.animationsEnabled }"
                :aria-label="settingsStore.settings.animationsEnabled ? t('settings.appearance.animationsOffAria') : t('settings.appearance.animationsOnAria')"
                :aria-pressed="settingsStore.settings.animationsEnabled"
                type="button"
              >
                <component :is="settingsStore.settings.animationsEnabled ? ToggleRight : ToggleLeft" class="setting-toggle-icon" />
                <span class="setting-toggle-label">
                  {{ settingsStore.settings.animationsEnabled ? t('settings.appearance.animationsOn') : t('settings.appearance.animationsOff') }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div v-show="activeSection === 'preferences'" class="settings-section">
          <h3 class="section-title">
            {{ t('settings.preferences.title') }}
          </h3>

          <div class="setting-group">
            <label class="setting-label">
              <Clock class="setting-label-icon" />
              {{ t('settings.preferences.timeFormatLabel') }}
            </label>
            <p class="setting-description">
              {{ t('settings.preferences.timeFormatDesc') }}
            </p>
            <div class="setting-controls">
              <button
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.timeFormat === '24h' }"
                type="button"
                @click="settingsStore.setTimeFormat('24h')"
              >
                <span>{{ t('settings.preferences.time24h') }}</span>
              </button>
              <button
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.timeFormat === '12h' }"
                type="button"
                @click="settingsStore.setTimeFormat('12h')"
              >
                <span>{{ t('settings.preferences.time12h') }}</span>
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <Languages class="setting-label-icon" />
              {{ t('settings.preferences.languageLabel') }}
            </label>
            <p class="setting-description">
              {{ t('settings.preferences.languageDesc') }}
            </p>
            <div class="setting-controls">
              <button
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.language === 'zh' }"
                type="button"
                @click="settingsStore.setLanguage('zh')"
              >
                <span>{{ t('settings.preferences.langZh') }}</span>
              </button>
              <button
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.language === 'en' }"
                type="button"
                @click="settingsStore.setLanguage('en')"
              >
                <span>{{ t('settings.preferences.langEn') }}</span>
              </button>
              <button
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.language === 'ja' }"
                type="button"
                @click="settingsStore.setLanguage('ja')"
              >
                <span>{{ t('settings.preferences.langJa') }}</span>
              </button>
              <button
                class="setting-option-btn"
                :class="{ active: settingsStore.settings.language === 'ko' }"
                type="button"
                @click="settingsStore.setLanguage('ko')"
              >
                <span>{{ t('settings.preferences.langKo') }}</span>
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <Keyboard class="setting-label-icon" />
              {{ t('settings.preferences.shortcutsLabel') }}
            </label>
            <div class="shortcuts-list">
              <div v-for="shortcut in shortcuts" :key="shortcut.action" class="shortcut-item">
                <span class="shortcut-label">{{ shortcut.label }}</span>
                <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Data -->
        <div v-show="activeSection === 'data'" class="settings-section">
          <h3 class="section-title">
            {{ t('settings.data.title') }}
          </h3>
          
          <div class="setting-group">
            <label class="setting-label">
              <Download class="setting-label-icon" />
              {{ t('settings.data.exportLabel') }}
            </label>
            <p class="setting-description">
              {{ t('settings.data.exportDesc') }}
            </p>
            <button @click="exportData" class="setting-action-btn">
              <Download class="setting-action-icon" />
              <span>{{ t('settings.data.exportButton') }}</span>
            </button>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <Upload class="setting-label-icon" />
              {{ t('settings.data.importLabel') }}
            </label>
            <p class="setting-description">
              {{ t('settings.data.importDesc') }}
            </p>
            <button @click="importData" class="setting-action-btn">
              <Upload class="setting-action-icon" />
              <span>{{ t('settings.data.importButton') }}</span>
            </button>
            <input
              ref="importInput"
              type="file"
              accept=".json"
              @change="handleImportFile"
              class="setting-file-input"
              style="display: none"
            />
          </div>

          <div class="setting-group danger">
            <label class="setting-label">
              <Shield class="setting-label-icon danger-icon" />
              {{ t('settings.data.clearAllLabel') }}
            </label>
            <p class="setting-description">
              {{ t('settings.data.clearAllDesc') }}
            </p>
            <button @click="confirmClearData" class="setting-action-btn danger">
              <Trash2 class="setting-action-icon" />
              <span>{{ t('settings.data.clearAllButton') }}</span>
            </button>
          </div>
        </div>

        <!-- About -->
        <div v-show="activeSection === 'about'" class="settings-section">
          <h3 class="section-title">
            {{ t('settings.about.title') }}
          </h3>
          
          <div class="about-content">
            <div class="about-logo">
              <Feather class="about-logo-icon" />
            </div>
            <h4 class="about-title">Panda Time-Note</h4>
            <p class="about-version">
              {{ t('settings.about.version') }}
            </p>
            <p class="about-description">
              {{ t('settings.about.description') }}
            </p>
            
            <div class="about-links">
              <a href="#" class="about-link">
                {{ t('settings.about.links.docs') }}
              </a>
              <a href="#" class="about-link">
                {{ t('settings.about.links.feedback') }}
              </a>
              <a href="#" class="about-link">
                {{ t('settings.about.links.license') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../stores/settingsStore';
import type { Theme, FontSize, ThemePack } from '../stores/settingsStore';
import { useNoteStore } from '../stores/noteStore';
import * as NoteHandler from '../../bindings/panda-time-note/backend/handlers/notehandler';
import {
  Settings,
  X,
  Sun,
  Moon,
  Monitor,
  Keyboard,
  Database,
  Info,
  Download,
  Upload,
  Trash2,
  Feather,
  Type,
  Palette,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Clock,
  Languages,
  Sparkles,
  Shield,
} from 'lucide-vue-next';

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const settingsStore = useSettingsStore();
const noteStore = useNoteStore();
const showConfirmDialog = inject<(options: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  action: () => Promise<void>;
}) => void>('showConfirmDialog');
const showToast = inject<(message: string, type?: 'success' | 'error' | 'warning' | 'info') => void>('showToast');

const activeSection = ref('appearance');
const importInput = ref<HTMLInputElement | null>(null);

const sections = [
  { id: 'appearance', label: t('settings.sections.appearance'), icon: Settings },
  { id: 'preferences', label: t('settings.sections.preferences'), icon: Keyboard },
  { id: 'data', label: t('settings.sections.data'), icon: Database },
  { id: 'about', label: t('settings.sections.about'), icon: Info },
];

const themeOptions = [
  { value: 'light' as Theme, label: t('settings.appearance.themeLight'), icon: Sun },
  { value: 'dark' as Theme, label: t('settings.appearance.themeDark'), icon: Moon },
  { value: 'system' as Theme, label: t('settings.appearance.themeSystem'), icon: Monitor },
];

const fontSizeOptions = [
  { value: 'small' as FontSize, label: t('settings.appearance.fontSmall') },
  { value: 'medium' as FontSize, label: t('settings.appearance.fontMedium') },
  { value: 'large' as FontSize, label: t('settings.appearance.fontLarge') },
];

const shortcuts = [
  {
    action: 'new',
    label: t('settings.preferences.shortcuts.new'),
    key: 'N',
  },
  {
    action: 'search',
    label: t('settings.preferences.shortcuts.search'),
    key: '⌘K',
  },
  {
    action: 'settings',
    label: t('settings.preferences.shortcuts.settings'),
    key: '⌘,',
  },
  {
    action: 'close',
    label: t('settings.preferences.shortcuts.close'),
    key: 'Esc',
  },
];

const themePacks = [
  {
    id: 'purple' as ThemePack,
    label: t('settings.preferences.themePack.purple'),
    colors: {
      palette: ['#6C4D7E', '#8E6B8E', '#B484B0', '#EEDACA', '#F8F4F0'],
      primary: '#6C4D7E',
      secondary: '#B484B0',
      accent: '#B484B0',
      bg: '#F5F0F5',
      border: '#D4B8C8',
      text: '#6C4D7E',
    },
  },
  {
    id: 'blue' as ThemePack,
    label: t('settings.preferences.themePack.blue'),
    colors: {
      palette: ['#325969', '#4E7A8A', '#6C8FA9', '#C8ADCA', '#CDDAE7'],
      primary: '#325969',
      secondary: '#6C8FA9',
      accent: '#6C8FA9',
      bg: '#CDDAE7',
      border: '#9bb5c9',
      text: '#325969',
    },
  },
  {
    id: 'greenMorandi' as ThemePack,
    label: t('settings.preferences.themePack.greenMorandi'),
    colors: {
      palette: ['#566C44', '#688857', '#7A9B65', '#A7C190', '#FAF2CB'],
      primary: '#566C44',
      secondary: '#688857',
      accent: '#688857',
      bg: '#FAF2CB',
      border: '#c5d4a8',
      text: '#566C44',
    },
  },
  {
    id: 'greenFresh' as ThemePack,
    label: t('settings.preferences.themePack.greenFresh'),
    colors: {
      palette: ['#417A64', '#6BAB96', '#A6EDF6', '#C5E8E2', '#E9F3F8'],
      primary: '#417A64',
      secondary: '#A6EDF6',
      accent: '#417A64',
      bg: '#E9F3F8',
      border: '#9dd4e0',
      text: '#417A64',
    },
  },
  {
    id: 'brown' as ThemePack,
    label: t('settings.preferences.themePack.brown'),
    colors: {
      palette: ['#886441', '#B07850', '#D4A574', '#F5EDE4', '#FFFBF7'],
      primary: '#886441',
      secondary: '#a67c52',
      accent: '#a67c52',
      bg: '#FFFBF7',
      border: '#d4b896',
      text: '#886441',
    },
  },
  {
    id: 'red' as ThemePack,
    label: t('settings.preferences.themePack.red'),
    colors: {
      palette: ['#D24D5C', '#F4796A', '#ECAE89', '#F0D4CC', '#EFECEC'],
      primary: '#D24D5C',
      secondary: '#F4796A',
      accent: '#F4796A',
      bg: '#EFECEC',
      border: '#e0c4be',
      text: '#8b2d38',
    },
  },
];

function getThemeCardStyle(pack: typeof themePacks[0]) {
  return {
    background: `linear-gradient(135deg, ${pack.colors.primary}15, ${pack.colors.secondary}10)`,
    borderColor: `${pack.colors.accent}40`,
  };
}
// 调用后端 ResetAllData，等价于“删表重建 notes/notes_fts”
async function resetAllDataOnBackend() {
  const resetAllData = (NoteHandler as any).ResetAllData;
  if (typeof resetAllData !== 'function') {
    throw new Error('ResetAllData API 未生成，请先运行 Wails 绑定生成命令');
  }
  await resetAllData();
}

function setTheme(theme: Theme) {
  settingsStore.setTheme(theme);
  if (showToast) showToast(t('settings.appearance.themeUpdated'), 'success');
}

function setFontSize(size: FontSize) {
  settingsStore.setFontSize(size);
  if (showToast) showToast(t('settings.appearance.fontUpdated'), 'success');
}

function setAnimationsEnabled(enabled: boolean) {
  settingsStore.setAnimationsEnabled(enabled);
  if (showToast) {
    showToast(
      enabled
        ? t('settings.appearance.animationsOnToast')
        : t('settings.appearance.animationsOffToast'),
      'success',
    );
  }
}

function setGlassEffectIntensity(intensity: number) {
  settingsStore.setGlassEffectIntensity(intensity);
}

async function exportData() {
  try {
    await noteStore.loadNotes(true); // Load all notes including archived
    const notes = noteStore.notes;
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panda-time-note-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast(t('settings.data.exportSuccess'), 'success');
  } catch (e) {
    console.error('Export failed:', e);
    if (showToast) showToast(t('settings.data.exportFailed'), 'error');
  }
}

function importData() {
  importInput.value?.click();
}

async function handleImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const notes = JSON.parse(text);
    
    if (!Array.isArray(notes)) {
      throw new Error('Invalid file format');
    }

    if (showConfirmDialog) {
      showConfirmDialog({
        title: t('settings.data.importDialogTitle'),
        message: t('settings.data.importDialogMessage', { count: notes.length }),
        type: 'warning',
        confirmText: t('settings.data.importConfirm'),
        action: async () => {
          try {
            // 1. 依次创建新的笔记（追加导入，不清空现有数据）
            for (const raw of notes) {
              if (!raw || typeof raw !== 'object') continue;

              const title =
                typeof raw.title === 'string' && raw.title.trim().length > 0
                  ? raw.title
                  : '未命名笔记';
              const content =
                typeof raw.content === 'string' ? raw.content : '';

              const tagsArray: string[] = Array.isArray(raw.tags)
                ? raw.tags
                    .filter((t: unknown) => typeof t === 'string')
                    .map((t: string) => t.trim())
                    .filter((t: string) => t.length > 0)
                : [];

              const noteType =
                raw.type === 'article' ? 'article' : 'quick';

              await noteStore.createNote({
                title,
                content,
                tags: tagsArray,
                type: noteType,
              });
            }

            // 2. 重新加载统计与标签
            await Promise.all([
              noteStore.loadStats(),
              noteStore.loadTagsWithCount(),
            ]);
            await noteStore.loadNotes(false);

            if (showToast) showToast(t('settings.data.importSuccess'), 'success');
          } catch (error) {
            console.error('Import logic failed:', error);
            if (showToast) showToast(t('settings.data.importFailed'), 'error');
            throw error;
          }
        },
      });
    }
  } catch (e) {
    console.error('Import failed:', e);
    if (showToast) showToast(t('settings.data.importFormatError'), 'error');
  }
}

function confirmClearData() {
  if (showConfirmDialog) {
    showConfirmDialog({
      title: t('settings.data.clearAllDialogTitle'),
      message: t('settings.data.clearAllDialogMessage'),
      type: 'danger',
      confirmText: t('settings.data.clearAllConfirm'),
      action: async () => {
        try {
          // 后端“删表重建”清空所有笔记相关数据
          await resetAllDataOnBackend();

          // 重新加载默认视图及统计
          await Promise.all([
            noteStore.loadNotes(false),
            noteStore.loadStats(),
            noteStore.loadTagsWithCount(),
          ]);

          if (showToast) showToast(t('settings.data.clearAllSuccess'), 'success');
        } catch (error) {
          console.error('Clear data failed:', error);
          if (showToast) showToast(t('settings.data.clearAllFailed'), 'error');
          throw error;
        }
      },
    });
  }
}
</script>

<style scoped>
.settings-panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Background handled by parent container */
  background: transparent;
  transition: all var(--transition-normal);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.settings-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-title-icon {
  width: 24px;
  height: 24px;
  color: var(--color-accent-strong);
}

.settings-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-body);
  margin: 0;
}

.settings-close {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1.5px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--color-text-muted);
  will-change: transform, background-color, border-color;
  position: relative;
  overflow: hidden;
}

.settings-close::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  transform: translate(-50%, -50%);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 0;
}

.settings-close:hover {
  background: var(
    --state-accent-soft-bg,
    color-mix(in srgb, var(--color-accent) 18%, transparent)
  );
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  color: var(--color-accent-strong);
  transform: scale(1.1) rotate(90deg);
  box-shadow: var(
    --state-accent-soft-shadow,
    0 4px 12px color-mix(
      in srgb,
      var(--color-accent-strong) 30%,
      transparent
    )
  );
}

.settings-close:hover::before {
  width: 300%;
  height: 300%;
}

.settings-close:active {
  transform: scale(0.95) rotate(90deg);
  transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-close-icon {
  position: relative;
  z-index: 1;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.settings-close:hover .settings-close-icon {
  transform: scale(1.1);
}

.settings-close-icon {
  width: 20px;
  height: 20px;
}

.settings-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-nav {
  width: 200px;
  padding: 24px 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  user-select: none;
  position: relative;
  will-change: transform, background-color;
  border-radius: 12px;
  margin: 0 12px;
}

.settings-nav-item:hover {
  background: var(--surface-hover);
  color: var(--color-text-body);
}

.settings-nav-item.active {
  background: var(--color-surface);
  color: var(--color-accent-strong);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.settings-nav-item:active {
  transform: scale(0.98);
}

.settings-nav-icon {
  width: 18px;
  height: 18px;
  transition: all var(--transition-normal);
  flex-shrink: 0;
}

.settings-nav-item:hover .settings-nav-icon {
  transform: scale(1.1);
}

.settings-nav-item.active .settings-nav-icon {
  color: var(--color-accent-strong);
  transform: scale(1.1);
}

.settings-sections {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  overflow-x: hidden;
}

.settings-sections::-webkit-scrollbar {
  width: 8px;
}

.settings-sections::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border-radius: var(--radius-full);
}

.settings-sections::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-border-subtle) 60%, transparent);
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
}

.settings-sections::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-accent) 40%, transparent);
}

.settings-section {
  max-width: 600px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-body);
  margin: 0 0 24px 0;
}

.setting-group {
  margin-bottom: 32px;
  padding: 20px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  transition: all var(--transition-normal);
  will-change: box-shadow, border-color;
}

.setting-group:hover {
  border-color: var(--state-accent-soft-border, color-mix(in srgb, var(--color-accent) 25%, transparent));
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.setting-group.danger {
  border-color: color-mix(in srgb, var(--color-danger) 20%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
}

.setting-group.danger:hover {
  border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.setting-label-icon {
  width: 18px;
  height: 18px;
  color: var(--color-accent-strong);
  transition: all var(--transition-normal);
}

.setting-label-icon.is-on {
  color: color-mix(in srgb, var(--color-accent-strong) 90%, var(--color-accent));
}

.setting-label-icon.danger-icon {
  color: var(--color-danger);
}

.setting-group:hover .setting-label-icon {
  transform: scale(1.1);
  filter: brightness(1.05);
}

.setting-description {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
  line-height: 1.6;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border-radius: var(--radius-sm, 8px);
  border-left: 3px solid var(--color-accent);
  transition: all var(--transition-normal);
}

.setting-group:hover .setting-description {
  border-left-width: 4px;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
}

.setting-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.setting-option-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  user-select: none;
  will-change: transform, box-shadow, border-color;
  position: relative;
  overflow: hidden;
}

.setting-option-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
  z-index: 0;
}

.setting-option-btn:hover {
  border-color: var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 45%, transparent)
  );
  background: var(--surface-hover);
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-accent-md);
}

.setting-option-btn:hover::before {
  left: 100%;
}

.setting-option-btn:active {
  transform: translateY(-1px) scale(0.98);
  transition: all var(--transition-fast);
}

.setting-option-btn.active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 20%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 16%, transparent)
  );
  border-color: var(
    --state-accent-strong-border,
    color-mix(in srgb, var(--color-accent-strong) 50%, transparent)
  );
  color: var(--color-accent-strong);
  font-weight: 600;
  transform: translateY(-1px);
  box-shadow: var(--shadow-accent-md);
  animation: optionActive var(--transition-slow) cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes optionActive {
  0% {
    transform: translateY(-1px) scale(0.98);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-1px) scale(1.02);
    opacity: 1;
  }
  100% {
    transform: translateY(-1px) scale(1);
    opacity: 1;
  }
}

.setting-option-btn:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.setting-option-icon {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 1;
  transition: all var(--transition-normal);
}

.setting-option-btn:hover .setting-option-icon {
  transform: scale(1.15);
  filter: brightness(1.1);
}

.setting-option-btn.active .setting-option-icon {
  transform: scale(1.1);
  filter: brightness(1.15);
}

.setting-range {
  flex: 1;
  height: 8px;
  border-radius: var(--radius-full);
  background: color-mix(
    in srgb,
    var(--color-surface) 90%,
    #000000
  );
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: inset 0 1px 3px color-mix(in srgb, var(--text-primary) 4%, transparent);
}

.setting-range:hover {
  background: color-mix(
    in srgb,
    var(--color-surface) 95%,
    #000000
  );
  box-shadow: inset 0 1px 4px color-mix(in srgb, var(--text-primary) 6%, transparent),
              0 0 0 2px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.setting-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-accent-sm),
              0 0 0 2px color-mix(in srgb, var(--color-surface) 95%, transparent);
  border: 2px solid color-mix(in srgb, var(--color-surface) 98%, transparent);
}

.setting-range:hover::-webkit-slider-thumb {
  width: 22px;
  height: 22px;
  box-shadow: var(--shadow-accent-md),
              0 0 0 2px color-mix(in srgb, var(--color-surface) 98%, transparent);
  transform: scale(1.1);
}

.setting-range:active::-webkit-slider-thumb {
  transform: scale(1.05);
}

.setting-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  cursor: pointer;
  border: 2px solid color-mix(in srgb, var(--color-surface) 98%, transparent);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-accent-sm);
}

.setting-range:hover::-moz-range-thumb {
  width: 22px;
  height: 22px;
  box-shadow: var(--shadow-accent-md);
  transform: scale(1.1);
}

.setting-range:active::-moz-range-thumb {
  transform: scale(1.05);
}

.setting-range-value {
  min-width: 50px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-accent-strong);
  transition: all var(--transition-normal);
}

.setting-range:hover + .setting-range-value {
  transform: scale(1.05);
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border-subtle);
  background: color-mix(
    in srgb,
    var(--color-surface) 92%,
    #000000
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  user-select: none;
  will-change: transform, box-shadow, background-color;
  position: relative;
  overflow: hidden;
}

.setting-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
  z-index: 0;
}

.setting-toggle:hover:not(.active) {
  background: var(--surface-hover);
  border-color: var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 40%, transparent)
  );
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent-md);
}

.setting-toggle:hover:not(.active)::before {
  width: 200%;
  height: 200%;
}

.setting-toggle:active {
  transform: translateY(-1px) scale(0.98);
  transition: all var(--transition-fast);
}

.setting-toggle.active {
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  border-color: var(--color-accent);
  color: var(--color-on-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-accent-lg);
  animation: toggleActive var(--transition-slow) cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes toggleActive {
  0% {
    transform: translateY(-1px) scale(0.95);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-1px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateY(-1px) scale(1);
    opacity: 1;
  }
}

.setting-toggle:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.setting-toggle-icon {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 1;
  transition: all var(--transition-normal);
}

.setting-toggle:hover .setting-toggle-icon {
  transform: scale(1.15);
}

.setting-toggle.active .setting-toggle-icon {
  transform: scale(1.1);
  filter: brightness(1.1);
}

.setting-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 24px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  user-select: none;
  will-change: transform, box-shadow, border-color;
  position: relative;
  overflow: hidden;
}

.setting-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transition: left 0.5s ease;
  z-index: 0;
}

.setting-action-btn:hover {
  border-color: var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 45%, transparent)
  );
  background: var(--surface-hover);
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-accent-md);
}

.setting-action-btn:hover::before {
  left: 100%;
}

.setting-action-btn:active {
  transform: translateY(-1px) scale(0.98);
  transition: all var(--transition-fast);
}

.setting-action-btn.danger {
  background: color-mix(
    in srgb,
    var(--color-danger) 10%,
    transparent
  );
  border-color: color-mix(
    in srgb,
    var(--color-danger) 30%,
    transparent
  );
  color: var(--color-danger);
}

.setting-action-btn.danger:hover {
  background: color-mix(
    in srgb,
    var(--color-danger) 16%,
    transparent
  );
  border-color: color-mix(
    in srgb,
    var(--color-danger) 45%,
    transparent
  );
  transform: translateY(-2px);
  box-shadow: 0 5px 14px
    color-mix(in srgb, var(--color-danger) 25%, transparent);
}

.setting-action-btn:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.setting-action-icon {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 1;
  transition: all var(--transition-normal);
}

.setting-action-btn:hover .setting-action-icon {
  transform: scale(1.1) rotate(-3deg);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1.5px solid var(--color-border-subtle);
  transition: all var(--transition-normal);
  will-change: transform, box-shadow, border-color;
}

.shortcut-item:hover {
  background: color-mix(in srgb, var(--color-surface) 98%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.shortcut-item:active {
  transform: translateX(2px);
  transition: all var(--transition-fast);
}

.shortcut-label {
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
  transition: color var(--transition-normal);
}

.shortcut-item:hover .shortcut-label {
  color: var(--color-text-body);
}

.shortcut-key {
  padding: 5px 12px;
  border-radius: var(--radius-sm, 8px);
  background: color-mix(
    in srgb,
    var(--color-surface) 92%,
    #000000
  );
  border: 1px solid var(--color-border-subtle);
  font-size: 12px;
  font-weight: 600;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-text-body);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--text-primary) 4%, transparent);
  transition: all var(--transition-normal);
}

.shortcut-item:hover .shortcut-key {
  background: color-mix(
    in srgb,
    var(--color-accent) 12%,
    var(--color-surface)
  );
  border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
  color: var(--color-accent-strong);
  transform: scale(1.05);
  box-shadow: 0 2px 4px color-mix(in srgb, var(--color-accent-strong) 15%, transparent);
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
  .settings-content {
    flex-direction: column;
  }

  .settings-nav {
    width: 100%;
    padding: 16px 0;
    border-right: none;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-direction: row;
    overflow-x: auto;
    gap: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
    position: sticky;
    top: 0;
    z-index: 10;
    background: color-mix(in srgb, var(--color-surface) 95%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .settings-nav::-webkit-scrollbar {
    display: none;
  }

  .settings-nav-item {
    padding: 12px 20px;
    white-space: nowrap;
    flex-shrink: 0;
    border-radius: 0;
    margin-right: 0;
  }

  .settings-nav-item.active {
    border-right: none;
    border-bottom: 3px solid var(--color-accent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-accent) 12%, transparent),
      color-mix(in srgb, var(--color-accent) 8%, transparent)
    );
  }

  .settings-nav-item.active::before {
    display: none;
  }

  .settings-nav-item:hover {
    transform: none;
    background: color-mix(in srgb, var(--color-surface) 98%, transparent);
  }

  .settings-sections {
    padding: 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .settings-section {
    max-width: 100%;
  }

  .setting-group {
    padding: 16px;
    margin-bottom: 20px;
  }

  .setting-description {
    font-size: 12px;
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .settings-header {
    padding: 16px 20px;
  }

  .settings-title {
    font-size: 18px;
  }

  .settings-close {
    width: 36px;
    height: 36px;
  }

  .settings-nav {
    padding: 12px 0;
  }

  .settings-nav-item {
    padding: 10px 16px;
    font-size: 13px;
  }

  .settings-sections {
    padding: 20px 16px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 20px;
  }

  .setting-group {
    margin-bottom: 24px;
    padding: 14px;
    border-radius: var(--radius-sm, 10px);
  }

  .setting-label {
    font-size: 13px;
    gap: 6px;
  }

  .setting-label-icon {
    width: 16px;
    height: 16px;
  }

  .setting-description {
    font-size: 12px;
    padding: 8px 10px;
    border-left-width: 2px;
  }

  .setting-controls {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .setting-option-btn,
  .setting-toggle,
  .setting-action-btn {
    width: 100%;
    justify-content: center;
    padding: 11px 18px;
    font-size: 13px;
  }

  .setting-option-btn,
  .setting-toggle {
    flex-direction: row;
  }

  .setting-toggle {
    padding: 11px 18px;
  }

  .theme-cards-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .theme-card {
    padding: 8px;
    border-radius: var(--radius-sm, 10px);
  }

  .theme-card-preview {
    height: 36px;
  }

  .theme-card-label {
    font-size: 10px;
  }

  .shortcuts-list {
    gap: 8px;
  }

  .shortcut-item {
    padding: 12px 14px;
  }

  .shortcut-label {
    font-size: 13px;
  }

  .shortcut-key {
    padding: 4px 10px;
    font-size: 11px;
  }

  .about-logo {
    width: 64px;
    height: 64px;
    border-radius: 16px;
  }

  .about-logo-icon {
    width: 32px;
    height: 32px;
  }

  .about-title {
    font-size: 20px;
  }

  .about-version {
    font-size: 13px;
  }

  .about-description {
    font-size: 13px;
  }

  .about-links {
    flex-direction: column;
    gap: 8px;
  }

  .about-link {
    width: 100%;
  }
}

.about-content {
  text-align: center;
}

.about-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    var(--color-palette-2) 0%,
    var(--color-palette-3) 50%,
    var(--color-palette-4) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-palette-2) 30%, transparent);
}

.about-logo:hover {
  transform: scale(1.05) rotate(3deg);
  box-shadow: var(--shadow-accent-md);
}

.about-logo-icon {
  width: 40px;
  height: 40px;
  color: var(--color-palette-1);
  transition: all var(--transition-normal);
}

.about-logo:hover .about-logo-icon {
  transform: scale(1.1);
}

.about-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-body);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.about-version {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0 0 20px 0;
  font-weight: 500;
}

.about-description {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 24px 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.about-links {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.about-link {
  font-size: 14px;
  color: var(--color-palette-1);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-normal);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-palette-3) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 25%, transparent);
}

.about-link:hover {
  color: var(--color-palette-2);
  background: color-mix(in srgb, var(--color-palette-3) 25%, transparent);
  border-color: color-mix(in srgb, var(--color-palette-2) 40%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-palette-2) 20%, transparent);
}

.about-link:active {
  transform: translateY(0);
}

/* 主题颜色卡片 */
.theme-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
  gap: 8px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all var(--transition-normal);
  user-select: none;
  will-change: transform, box-shadow, border-color;
  position: relative;
  overflow: hidden;
}

.theme-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
  z-index: 0;
}

.theme-card::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-border-subtle);
  background: transparent;
  transition: all var(--transition-normal);
  opacity: 0;
  transform: scale(0.5);
}

.theme-card:hover {
  border-color: var(
    --state-accent-soft-border,
    color-mix(in srgb, var(--color-accent) 45%, transparent)
  );
  background: var(--surface-hover);
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-accent-md);
}

.theme-card:hover::before {
  left: 100%;
}

.theme-card:active {
  transform: translateY(-2px) scale(0.98);
  transition: all var(--transition-fast);
}

.theme-card.active {
  border-color: var(
    --state-accent-strong-border,
    color-mix(in srgb, var(--color-accent-strong) 50%, transparent)
  );
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 15%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 12%, transparent)
  );
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent-md);
  animation: themeCardActive var(--transition-slow) cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes themeCardActive {
  0% {
    transform: translateY(-2px) scale(0.98);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-2px) scale(1.03);
    opacity: 1;
  }
  100% {
    transform: translateY(-2px) scale(1);
    opacity: 1;
  }
}

.theme-card:focus-visible {
  outline: 2px solid
    color-mix(in srgb, var(--color-accent) 55%, transparent);
  outline-offset: 2px;
}

.theme-card-preview {
  width: 100%;
  height: 64px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: all var(--transition-normal);
  z-index: 1;
  padding: 3px;
}

.theme-palette {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.palette-cylinder {
  width: 10px;
  height: 28px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.theme-card:hover .palette-cylinder {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.theme-card:hover .palette-cylinder:nth-child(1) { transition-delay: 0ms; }
.theme-card:hover .palette-cylinder:nth-child(2) { transition-delay: 40ms; }
.theme-card:hover .palette-cylinder:nth-child(3) { transition-delay: 80ms; }
.theme-card:hover .palette-cylinder:nth-child(4) { transition-delay: 120ms; }
.theme-card:hover .palette-cylinder:nth-child(5) { transition-delay: 160ms; }

.theme-card:hover .theme-card-preview {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.theme-card.active .theme-card-preview {
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
  border-color: transparent;
}

.theme-card-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: color var(--transition-normal);
  text-align: center;
  position: relative;
  z-index: 1;
}

.theme-card:hover .theme-card-label {
  color: var(--color-text-body);
}

.theme-card.active .theme-card-label {
  color: var(--color-accent-strong);
  font-weight: 600;
}

@media (max-width: 768px) {
  .settings-sections {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .theme-cards-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .theme-card {
    padding: 6px;
  }

  .theme-card:hover,
  .theme-card:active {
    transform: translateY(-2px) scale(1.01);
  }

  .theme-card-preview {
    height: 36px;
  }
}

@media (max-width: 480px) {
  .theme-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .theme-card {
    padding: 6px;
  }

  .theme-card:hover,
  .theme-card:active {
    transform: translateY(-1px) scale(1.01);
  }

  .theme-card-preview {
    height: 32px;
  }

  .theme-card-label {
    font-size: 10px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .setting-option-btn,
  .setting-toggle,
  .setting-action-btn,
  .theme-card,
  .shortcut-item,
  .settings-nav-item {
    transition: none;
  }

  .setting-option-btn:hover,
  .setting-toggle:hover,
  .setting-action-btn:hover,
  .theme-card:hover,
  .shortcut-item:hover,
  .settings-nav-item:hover {
    transform: none;
  }

  .setting-option-btn:active,
  .setting-toggle:active,
  .setting-action-btn:active,
  .theme-card:active,
  .shortcut-item:active,
  .settings-nav-item:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
</style>
