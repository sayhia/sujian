import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { i18n } from '../i18n';
import { DEFAULT_ACCENT, legacyAccentMap } from '../types';
import type { AppSettings, Theme, AccentKey, FontSize, EditorWidth, TimeFormat, Language } from '../types';

const STORAGE_KEY = 'sujian-settings-v2';

const defaults: AppSettings = {
  theme: 'light',
  accent: DEFAULT_ACCENT,
  fontSize: 'medium',
  editorWidth: 'medium',
  animationsEnabled: true,
  glassIntensity: 80,
  timeFormat: '24h',
  language: 'zh',
};

const accentKeys: AccentKey[] = ['olive', 'violet', 'navy', 'amber', 'emerald', 'crimson'];

/** 初始化时同步读取 localStorage，避免主题闪烁；兼容历史主题 key 迁移 */
function readStored(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    const next: AppSettings = { ...defaults, ...parsed };
    // 历史主题 key（purple/cny-1/...）迁移到中性颜色 key
    if (next.accent && !accentKeys.includes(next.accent)) {
      next.accent = legacyAccentMap[next.accent] ?? DEFAULT_ACCENT;
    }
    if (!accentKeys.includes(next.accent)) next.accent = defaults.accent;
    return next;
  } catch {
    return { ...defaults };
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(readStored());
  const loaded = ref(false);

  /** 跟随系统时实际生效的明暗 */
  const systemDark = ref(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  const effectiveTheme = computed<Exclude<Theme, 'system'>>(() =>
    settings.value.theme === 'system' ? (systemDark.value ? 'dark' : 'light') : settings.value.theme,
  );

  /** 应用设置到 DOM（主题/墨色/字号/动效/毛玻璃） */
  function apply() {
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme.value;
    root.dataset.accent = settings.value.accent;
    root.dataset.fontSize = settings.value.fontSize;
    root.dataset.editorWidth = settings.value.editorWidth;
    root.dataset.animations = settings.value.animationsEnabled ? 'on' : 'off';
    const intensity = settings.value.glassIntensity / 100;
    root.style.setProperty('--glass-opacity', String(0.5 + intensity * 0.5));
    root.style.setProperty('--glass-blur', `${Math.round(8 + intensity * 20)}px`);
    if (i18n.global.locale.value !== settings.value.language) {
      i18n.global.locale.value = settings.value.language;
    }
    // 主题切换短暂挂载颜色过渡，避免生硬跳变
    root.classList.remove('theme-anim');
    void root.offsetWidth; // 强制 reflow 以触发过渡
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 420);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
    } catch {
      /* ignore */
    }
  }

  function patch(p: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...p };
    apply();
    persist();
  }

  function setTheme(t: Theme) {
    patch({ theme: t });
  }
  function setAccent(a: AccentKey) {
    patch({ accent: a });
  }
  function setFontSize(f: FontSize) {
    patch({ fontSize: f });
  }
  function setEditorWidth(w: EditorWidth) {
    patch({ editorWidth: w });
  }
  function setAnimationsEnabled(v: boolean) {
    patch({ animationsEnabled: v });
  }
  function setGlassIntensity(v: number) {
    patch({ glassIntensity: Math.max(0, Math.min(100, Math.round(v))) });
  }
  function setTimeFormat(f: TimeFormat) {
    patch({ timeFormat: f });
  }
  function setLanguage(l: Language) {
    patch({ language: l });
  }

  // 监听系统明暗变化（跟随系统时自动切换）
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      systemDark.value = e.matches;
      if (settings.value.theme === 'system') apply();
    });
  }

  // 首帧应用（main.ts 已先同步一次，这里保证 store 初始化后状态一致）
  apply();
  loaded.value = true;

  watch(settings, () => {}, { deep: true });

  return {
    settings,
    effectiveTheme,
    loaded,
    apply,
    persist,
    setTheme,
    setAccent,
    setFontSize,
    setEditorWidth,
    setAnimationsEnabled,
    setGlassIntensity,
    setTimeFormat,
    setLanguage,
  };
});
