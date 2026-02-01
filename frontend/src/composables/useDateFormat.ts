import { computed, type Ref } from 'vue';

export function useDateFormat(dateStr: Ref<string | undefined | null>) {
  return computed(() => {
    if (!dateStr.value) return '-';
    const date = new Date(dateStr.value);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });
}

export function useShortDateFormat(dateStr: Ref<string | undefined | null>) {
  return computed(() => {
    if (!dateStr.value) return '-';
    const date = new Date(dateStr.value);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleDateString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  });
}
