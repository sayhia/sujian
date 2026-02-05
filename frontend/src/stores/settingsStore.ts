import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { i18n } from '../i18n';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type TimeFormat = '24h' | '12h';
export type Language = 'zh' | 'en' | 'ja' | 'ko';
export type ToolbarStyle = 'default' | 'glass' | 'tiny';
export type ToolbarPosition = 'top' | 'following' | 'fixed';
export type ToolbarLayout = 'full' | 'center';
export type ToolbarAppearance = {
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
};
export type ToolbarAppearanceByStyle = Partial<Record<ToolbarPosition, ToolbarAppearance>>;

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
  toolbarStyle: ToolbarStyle;
  toolbarPosition: ToolbarPosition;
  toolbarAutohide: boolean;
  toolbarMultipleConfig: boolean;
  toolbarAppearanceStyle: ToolbarPosition;
  toolbarAppearanceByStyle: ToolbarAppearanceByStyle;
  toolbarFixedOffsetX: number;
  toolbarFixedOffsetY: number;
  toolbarLayout: ToolbarLayout;
  toolbarBackgroundColor: string;
  toolbarIconColor: string;
  toolbarIconSize: number;
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
    toolbarStyle: 'default',
    toolbarPosition: 'top',
    toolbarAutohide: false,
    toolbarMultipleConfig: false,
    toolbarAppearanceStyle: 'top',
    toolbarAppearanceByStyle: {
      top: {},
      following: {},
      fixed: {},
    },
    toolbarFixedOffsetX: 0,
    toolbarFixedOffsetY: 0,
    toolbarLayout: 'full',
    toolbarBackgroundColor: '',
    toolbarIconColor: '',
    toolbarIconSize: 18,
  });

  const validThemePacks: ThemePack[] = ['purple', 'blue', 'greenMorandi', 'greenFresh', 'brown', 'red'];
  const validLightStyles: LightThemeStyle[] = ['light-purple', 'light-blue', 'light-green-morandi', 'light-green-fresh', 'light-brown', 'light-red'];
  const validDarkStyles: DarkThemeStyle[] = ['dark-purple', 'dark-blue', 'dark-green-morandi', 'dark-green-fresh', 'dark-brown', 'dark-red'];
  const validToolbarStyles: ToolbarStyle[] = ['default', 'glass', 'tiny'];
  const validToolbarPositions: ToolbarPosition[] = ['top', 'following', 'fixed'];
  const validToolbarLayouts: ToolbarLayout[] = ['full', 'center'];

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
        if (!validToolbarStyles.includes(settings.value.toolbarStyle)) {
          const legacyStyle = localStorage.getItem('markdown-toolbar-style');
          if (legacyStyle === 'default' || legacyStyle === 'glass' || legacyStyle === 'tiny') {
            settings.value.toolbarStyle = legacyStyle;
          } else {
            settings.value.toolbarStyle = 'default';
          }
        }
        if (!validToolbarPositions.includes(settings.value.toolbarPosition)) {
          const legacyPosition = localStorage.getItem('markdown-toolbar-position');
          if (legacyPosition === 'top' || legacyPosition === 'following' || legacyPosition === 'fixed') {
            settings.value.toolbarPosition = legacyPosition;
          } else {
            settings.value.toolbarPosition = 'top';
          }
        }
        if (typeof settings.value.toolbarAutohide !== 'boolean') {
          const legacyAutohide = localStorage.getItem('markdown-toolbar-autohide');
          if (legacyAutohide === 'true' || legacyAutohide === 'false') {
            settings.value.toolbarAutohide = legacyAutohide === 'true';
          } else {
            settings.value.toolbarAutohide = false;
          }
        }
        if (typeof settings.value.toolbarMultipleConfig !== 'boolean') {
          settings.value.toolbarMultipleConfig = false;
        }
        if (!validToolbarLayouts.includes(settings.value.toolbarLayout)) {
          settings.value.toolbarLayout = 'full';
        }
        if (!validToolbarPositions.includes(settings.value.toolbarAppearanceStyle)) {
          settings.value.toolbarAppearanceStyle = settings.value.toolbarPosition ?? 'top';
        }
        settings.value.toolbarAppearanceByStyle = normalizeAppearanceByStyle(
          settings.value.toolbarAppearanceByStyle,
        );
        if (typeof settings.value.toolbarFixedOffsetX !== 'number' || Number.isNaN(settings.value.toolbarFixedOffsetX)) {
          settings.value.toolbarFixedOffsetX = 0;
        }
        if (typeof settings.value.toolbarFixedOffsetY !== 'number' || Number.isNaN(settings.value.toolbarFixedOffsetY)) {
          settings.value.toolbarFixedOffsetY = 0;
        }
        if (typeof settings.value.toolbarBackgroundColor !== 'string') {
          settings.value.toolbarBackgroundColor = '';
        }
        if (typeof settings.value.toolbarIconColor !== 'string') {
          settings.value.toolbarIconColor = '';
        }
        if (typeof settings.value.toolbarIconSize !== 'number' || Number.isNaN(settings.value.toolbarIconSize)) {
          settings.value.toolbarIconSize = 18;
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

  function normalizeAppearanceByStyle(
    value: ToolbarAppearanceByStyle | undefined,
  ): ToolbarAppearanceByStyle {
    if (!value || typeof value !== 'object') {
      return { top: {}, following: {}, fixed: {} };
    }
    const nextAppearance: ToolbarAppearanceByStyle = {};
    validToolbarPositions.forEach((style) => {
      const bucket = value[style];
      if (!bucket || typeof bucket !== 'object') {
        nextAppearance[style] = {};
        return;
      }
      const cleaned: ToolbarAppearance = {};
      if (typeof bucket.backgroundColor === 'string') {
        cleaned.backgroundColor = bucket.backgroundColor;
      }
      if (typeof bucket.iconColor === 'string') {
        cleaned.iconColor = bucket.iconColor;
      }
      if (typeof bucket.iconSize === 'number' && !Number.isNaN(bucket.iconSize)) {
        cleaned.iconSize = Math.max(12, Math.min(28, Math.round(bucket.iconSize)));
      }
      nextAppearance[style] = cleaned;
    });
    return nextAppearance;
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

  function setToolbarStyle(style: ToolbarStyle) {
    settings.value.toolbarStyle = style;
    saveSettings();
  }

  function setToolbarPosition(position: ToolbarPosition) {
    settings.value.toolbarPosition = position;
    saveSettings();
  }

  function setToolbarAutohide(value: boolean) {
    settings.value.toolbarAutohide = value;
    saveSettings();
  }

  function setToolbarMultipleConfig(value: boolean) {
    settings.value.toolbarMultipleConfig = value;
    saveSettings();
  }

  function setToolbarAppearanceStyle(style: ToolbarPosition) {
    settings.value.toolbarAppearanceStyle = style;
    saveSettings();
  }

  function setToolbarAppearanceValue(style: ToolbarPosition, patch: Partial<ToolbarAppearance>) {
    const current = settings.value.toolbarAppearanceByStyle ?? {};
    const bucket: ToolbarAppearance = { ...(current[style] ?? {}) };
    if (patch.backgroundColor !== undefined) {
      bucket.backgroundColor = patch.backgroundColor;
    }
    if (patch.iconColor !== undefined) {
      bucket.iconColor = patch.iconColor;
    }
    if (patch.iconSize !== undefined) {
      bucket.iconSize = Math.max(12, Math.min(28, Math.round(patch.iconSize)));
    }
    settings.value.toolbarAppearanceByStyle = { ...current, [style]: bucket };
    saveSettings();
  }

  function setToolbarAppearanceByStyle(value: ToolbarAppearanceByStyle) {
    settings.value.toolbarAppearanceByStyle = normalizeAppearanceByStyle(value);
    saveSettings();
  }

  function clearToolbarAppearanceValue(style: ToolbarPosition, key: keyof ToolbarAppearance) {
    const current = settings.value.toolbarAppearanceByStyle ?? {};
    const bucket: ToolbarAppearance = { ...(current[style] ?? {}) };
    delete bucket[key];
    settings.value.toolbarAppearanceByStyle = { ...current, [style]: bucket };
    saveSettings();
  }

  function setToolbarFixedOffsetX(value: number) {
    settings.value.toolbarFixedOffsetX = Math.max(-240, Math.min(240, Math.round(value)));
    saveSettings();
  }

  function setToolbarFixedOffsetY(value: number) {
    settings.value.toolbarFixedOffsetY = Math.max(-240, Math.min(240, Math.round(value)));
    saveSettings();
  }

  function setToolbarLayout(layout: ToolbarLayout) {
    settings.value.toolbarLayout = layout;
    saveSettings();
  }

  function setToolbarBackgroundColor(color: string) {
    settings.value.toolbarBackgroundColor = color;
    saveSettings();
  }

  function setToolbarIconColor(color: string) {
    settings.value.toolbarIconColor = color;
    saveSettings();
  }

  function setToolbarIconSize(size: number) {
    settings.value.toolbarIconSize = Math.max(12, Math.min(28, Math.round(size)));
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
    setToolbarStyle,
    setToolbarPosition,
    setToolbarAutohide,
    setToolbarMultipleConfig,
    setToolbarAppearanceStyle,
    setToolbarAppearanceValue,
    setToolbarAppearanceByStyle,
    clearToolbarAppearanceValue,
    setToolbarFixedOffsetX,
    setToolbarFixedOffsetY,
    setToolbarLayout,
    setToolbarBackgroundColor,
    setToolbarIconColor,
    setToolbarIconSize,
    loadSettings,
    saveSettings,
  };
});
