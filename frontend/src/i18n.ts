import { createI18n } from 'vue-i18n';
import zh from './language/zh';
import en from './language/en';
import ja from './language/ja';
import ko from './language/ko';

const messages = { zh, en, ja, ko };

export const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages,
});

export type MessageSchema = typeof zh;
