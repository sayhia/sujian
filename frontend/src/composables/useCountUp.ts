import { ref, watch, type Ref } from 'vue';

/**
 * 数字滚动动画：target 变化时从旧值平滑滚动到新值。
 * @param source 目标值 Ref
 * @param duration 动画时长 ms
 */
export function useCountUp(source: Ref<number>, duration = 500) {
  const display = ref(0);
  let raf = 0;
  let from = 0;

  watch(source, (to) => {
    if (typeof requestAnimationFrame === 'undefined') {
      display.value = to;
      return;
    }
    cancelAnimationFrame(raf);
    const start = performance.now();
    const delta = to - from;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      display.value = Math.round(from + delta * eased);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        from = to;
      }
    };
    raf = requestAnimationFrame(step);
  });

  return display;
}
