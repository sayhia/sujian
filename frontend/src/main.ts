import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
import { tip } from './directives/tip';
import './styles/tokens.css';
import './styles/themes.css';
import './styles/base.css';

// 首帧应用主题（读取 localStorage，避免闪烁；旧主题 key 自动迁移）
function applyInitialTheme() {
  try {
    const raw = localStorage.getItem('sujian-settings-v2');
    const saved = raw ? JSON.parse(raw) : {};
    const root = document.documentElement;
    const theme = saved.theme || 'light';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    const legacyMap: Record<string, string> = {
      purple: 'violet', blue: 'navy', green: 'olive', teal: 'emerald', brown: 'amber', red: 'crimson',
      'cny-1': 'olive', 'cny-5': 'violet', 'cny-10': 'navy', 'cny-20': 'amber', 'cny-50': 'emerald', 'cny-100': 'crimson',
    };
    const savedAccent = saved.accent || 'crimson';
    root.dataset.accent = legacyMap[savedAccent] || savedAccent;
    root.dataset.fontSize = saved.fontSize || 'medium';
    root.dataset.editorWidth = saved.editorWidth || 'medium';
    root.dataset.animations = saved.animationsEnabled === false ? 'off' : 'on';
    const lang = saved.language || 'zh';
    if (lang !== 'zh') {
      (i18n.global.locale as any).value = lang;
    }
  } catch {
    /* ignore */
  }
}
applyInitialTheme();

const app = createApp(App);
app.directive('tip', tip);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount('#app');
