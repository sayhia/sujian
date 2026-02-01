import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { i18n } from '../i18n';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type TimeFormat = '24h' | '12h';
export type Language = 'zh' | 'en' | 'ja' | 'ko';

// 新主题风格：与 theme.css 中的 html.className 对应（六张图片配色：绝绝紫、不摆蓝、不蕉绿、放青松、糖太棕、发财红）
export type DarkThemeStyle =
  | 'dark-purple'
  | 'dark-blue'
  | 'dark-green-morandi'
  | 'dark-green-fresh'
  | 'dark-brown'
  | 'dark-red';

export type LightThemeStyle =
  | 'light-purple'
  | 'light-blue'
  | 'light-green-morandi'
  | 'light-green-fresh'
  | 'light-brown'
  | 'light-red';

export type ThemePack = 'purple' | 'blue' | 'greenMorandi' | 'greenFresh' | 'brown' | 'red';

interface ThemePackMapping {
  light: LightThemeStyle;
  dark: DarkThemeStyle;
}

const themePackMap: Record<ThemePack, ThemePackMapping> = {
  purple: {
    light: 'light-purple',
    dark: 'dark-purple',
  },
  blue: {
    light: 'light-blue',
    dark: 'dark-blue',
  },
  greenMorandi: {
    light: 'light-green-morandi',
    dark: 'dark-green-morandi',
  },
  greenFresh: {
    light: 'light-green-fresh',
    dark: 'dark-green-fresh',
  },
  brown: {
    light: 'light-brown',
    dark: 'dark-brown',
  },
  red: {
    light: 'light-red',
    dark: 'dark-red',
  },
};

interface Settings {
  theme: Theme;
  fontSize: FontSize;
  animationsEnabled: boolean;
  glassEffectIntensity: number; // 0-100
  timeFormat: TimeFormat;
  language: Language;
  darkThemeStyle: DarkThemeStyle;
  lightThemeStyle: LightThemeStyle;
  themePack: ThemePack;
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings>({
    theme: 'light',
    fontSize: 'medium',
    animationsEnabled: true,
    glassEffectIntensity: 80,
    timeFormat: '24h',
    language: 'zh',
    // 默认亮/暗主题样式：极简浅色 + 极简深色
    darkThemeStyle: 'dark-purple',
    lightThemeStyle: 'light-purple',
    themePack: 'purple',
  });

  const validThemePacks: ThemePack[] = ['purple', 'blue', 'greenMorandi', 'greenFresh', 'brown', 'red'];
  const validLightStyles: LightThemeStyle[] = ['light-purple', 'light-blue', 'light-green-morandi', 'light-green-fresh', 'light-brown', 'light-red'];
  const validDarkStyles: DarkThemeStyle[] = ['dark-purple', 'dark-blue', 'dark-green-morandi', 'dark-green-fresh', 'dark-brown', 'dark-red'];

  // Load settings from localStorage
  function loadSettings() {
    const saved = localStorage.getItem('panda-time-note-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        settings.value = { ...settings.value, ...parsed };
        if (!parsed.themePack || !validThemePacks.includes(settings.value.themePack)) {
          const pack = getThemePackFromStyles(
            settings.value.lightThemeStyle,
            settings.value.darkThemeStyle,
          );
          if (pack) {
            settings.value.themePack = pack;
          } else {
            settings.value.themePack = 'purple';
            settings.value.lightThemeStyle = 'light-purple';
            settings.value.darkThemeStyle = 'dark-purple';
          }
        }
        if (!validLightStyles.includes(settings.value.lightThemeStyle)) {
          const mapping = themePackMap[settings.value.themePack];
          settings.value.lightThemeStyle = mapping.light;
        }
        if (!validDarkStyles.includes(settings.value.darkThemeStyle)) {
          const mapping = themePackMap[settings.value.themePack];
          settings.value.darkThemeStyle = mapping.dark;
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    applySettings();
  }

  // 根据亮色和暗色主题风格推断主题包
  function getThemePackFromStyles(
    light: LightThemeStyle,
    dark: DarkThemeStyle,
  ): ThemePack | null {
    for (const [packId, mapping] of Object.entries(themePackMap)) {
      if (mapping.light === light && mapping.dark === dark) {
        return packId as ThemePack;
      }
    }
    return null;
  }

  // Save settings to localStorage
  function saveSettings() {
    localStorage.setItem('panda-time-note-settings', JSON.stringify(settings.value));
    applySettings();
  }

  // Apply settings to DOM
  function applySettings() {
    // Apply theme
    const root = document.documentElement;
    const effectiveTheme =
      settings.value.theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : settings.value.theme;

    const darkClasses: DarkThemeStyle[] = [
      'dark-purple',
      'dark-blue',
      'dark-green-morandi',
      'dark-green-fresh',
      'dark-brown',
      'dark-red',
    ];
    const lightClasses: LightThemeStyle[] = [
      'light-purple',
      'light-blue',
      'light-green-morandi',
      'light-green-fresh',
      'light-brown',
      'light-red',
    ];
    root.classList.remove(...darkClasses, ...lightClasses);

    if (effectiveTheme === 'light') {
      const lightStyle: LightThemeStyle =
        settings.value.lightThemeStyle || 'light-purple';
      root.classList.add(lightStyle);
    } else {
      const style: DarkThemeStyle =
        settings.value.darkThemeStyle || 'dark-purple';
      root.classList.add(style);
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.fontSize = fontSizeMap[settings.value.fontSize];

    // Apply animations
    if (!settings.value.animationsEnabled) {
      root.style.setProperty('--animation-duration', '0ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    // Apply glass effect intensity
    const intensity = settings.value.glassEffectIntensity / 100;
    root.style.setProperty('--glass-opacity', intensity.toString());
    root.style.setProperty('--glass-blur', `${intensity * 20}px`);
  }

  // Update theme
  function setTheme(theme: Theme) {
    settings.value.theme = theme;
    saveSettings();
  }

  // Update font size
  function setFontSize(size: FontSize) {
    settings.value.fontSize = size;
    saveSettings();
  }

  // Toggle animations
  function setAnimationsEnabled(enabled: boolean) {
    settings.value.animationsEnabled = enabled;
    saveSettings();
  }

  // Update glass effect intensity
  function setGlassEffectIntensity(intensity: number) {
    settings.value.glassEffectIntensity = Math.max(0, Math.min(100, intensity));
    saveSettings();
  }

  // Update time format (12h/24h)
  function setTimeFormat(format: TimeFormat) {
    settings.value.timeFormat = format;
    saveSettings();
  }

  // Update language
  function setLanguage(lang: Language) {
    settings.value.language = lang;
    // 同步到 i18n 实例
    i18n.global.locale.value = lang;
    saveSettings();
  }

  function setDarkThemeStyle(style: DarkThemeStyle) {
    settings.value.darkThemeStyle = style;
    saveSettings();
  }

  function setLightThemeStyle(style: LightThemeStyle) {
    settings.value.lightThemeStyle = style;
    saveSettings();
  }

  function setThemePack(pack: ThemePack) {
    settings.value.themePack = pack;
    const mapping = themePackMap[pack];
    settings.value.lightThemeStyle = mapping.light;
    settings.value.darkThemeStyle = mapping.dark;
    saveSettings();
  }

  // Computed
  const effectiveTheme = computed(() => {
    if (settings.value.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.value.theme;
  });

  // Initialize
  loadSettings();
  // 初始化时同步 i18n locale（如果 localStorage 中已有 language）
  i18n.global.locale.value = settings.value.language;

  // Watch system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings.value.theme === 'system') {
        applySettings();
      }
    });
  }

  return {
    settings,
    effectiveTheme,
    setTheme,
    setFontSize,
    setAnimationsEnabled,
    setGlassEffectIntensity,
    setTimeFormat,
    setLanguage,
    setLightThemeStyle,
    setDarkThemeStyle,
    setThemePack,
    loadSettings,
    saveSettings,
  };
});
