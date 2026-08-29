import { computed, type Ref } from 'vue';
import { useSettingsStore } from '../stores/settings';

function localeOf(lang: string): string {
  switch (lang) {
    case 'zh':
      return 'zh-CN';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    default:
      return 'en-US';
  }
}

/** 完整日期时间：按设置的语言与时间格式输出 */
export function useDateFormat(dateStr: Ref<string | undefined | null>, opts: { includeTime?: boolean } = {}) {
  const settings = useSettingsStore();
  return computed(() => {
    if (!dateStr.value) return '-';
    const date = new Date(dateStr.value);
    if (Number.isNaN(date.getTime())) return '-';
    const locale = localeOf(settings.settings.language);
    const hour12 = settings.settings.timeFormat === '12h';
    const datePart = date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!opts.includeTime) return datePart;
    const timePart = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12 });
    return `${datePart} ${timePart}`;
  });
}

/** 相对时间：今天显示时刻，昨天/周内显示相对，更早显示日期 */
export function useRelativeDate(dateStr: Ref<string | undefined | null>) {
  const settings = useSettingsStore();
  return computed(() => {
    if (!dateStr.value) return '';
    const date = new Date(dateStr.value);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const time = date.getTime();
    const locale = localeOf(settings.settings.language);
    if (time >= startOfToday) {
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.settings.timeFormat === '12h',
      });
    }
    const days = Math.floor((startOfToday - time) / 86400000);
    if (days === 1) {
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    }
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  });
}

export type GroupKey = 'today' | 'yesterday' | 'earlier';

/** 时间轴分组键 */
export function groupKeyOf(dateStr: string | undefined): GroupKey {
  if (!dateStr) return 'earlier';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'earlier';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (date.getTime() >= startOfToday) return 'today';
  const days = Math.floor((startOfToday - date.getTime()) / 86400000);
  if (days === 1) return 'yesterday';
  return 'earlier';
}
