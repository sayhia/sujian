import { ref, onUnmounted } from 'vue';

export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number = 300) {
  const timeout = ref<number | null>(null);
  let lastCallTime = 0;

  const debouncedFn = (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      return fn(...args);
    }

    if (timeout.value !== null) {
      clearTimeout(timeout.value);
    }

    timeout.value = window.setTimeout(() => {
      lastCallTime = Date.now();
      fn(...args);
      timeout.value = null;
    }, delay);
  };

  onUnmounted(() => {
    if (timeout.value !== null) {
      clearTimeout(timeout.value);
    }
  });

  return debouncedFn;
}
