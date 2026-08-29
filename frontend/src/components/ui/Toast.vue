<script setup lang="ts">
import { ref, watch } from 'vue';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  undoLabel?: string;
  onUndo?: () => void;
}

const toasts = ref<ToastItem[]>([]);
let seq = 0;

const icons: Record<ToastItem['type'], string> = {
  success: 'M20 6 9 17l-5-5',
  error: 'M18 6 6 18M6 6l12 12',
  warning: 'M12 3 2.5 20h19L12 3ZM12 10v4M12 17.5h.01',
  info: 'M12 8h.01M12 12v4',
};

function addToast(
  message: string,
  type: ToastItem['type'] = 'info',
  duration = 3000,
  options?: { undoLabel?: string; onUndo?: () => void },
) {
  const id = ++seq;
  toasts.value.push({ id, message, type, duration, undoLabel: options?.undoLabel, onUndo: options?.onUndo });
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

watch(toasts, (list) => {
  if (list.length > 3) toasts.value = list.slice(list.length - 3);
});

defineExpose({ addToast, removeToast });
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast-item" :class="`toast-${t.type}`">
          <span class="toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="icons[t.type]" />
            </svg>
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button v-if="t.undoLabel" class="toast-undo" type="button" @click="t.onUndo?.(); removeToast(t.id)">
            {{ t.undoLabel }}
          </button>
          <button class="toast-close" type="button" aria-label="close" @click="removeToast(t.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <span v-if="t.duration > 0" class="toast-progress" :style="{ animationDuration: `${t.duration}ms` }" aria-hidden="true" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.toast-item {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: min(420px, calc(100vw - 48px));
  padding: 9px 14px 10px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--paper-1) calc(var(--glass-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--line);
  box-shadow: var(--shadow-2);
  font-size: 13px;
  color: var(--ink-900);
  overflow: hidden;
}
.toast-icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
}
.toast-icon svg {
  width: 11px;
  height: 11px;
}
.toast-success .toast-icon {
  background: var(--success-soft);
  color: var(--success);
}
.toast-error .toast-icon {
  background: var(--danger-soft);
  color: var(--danger);
}
.toast-warning .toast-icon {
  background: var(--warning-soft);
  color: var(--warning);
}
.toast-info .toast-icon {
  background: var(--accent-soft);
  color: var(--accent);
}
.toast-msg {
  line-height: 1.4;
}
.toast-undo {
  flex: none;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--accent);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}
.toast-undo:hover {
  background: var(--accent-soft);
}
.toast-close {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: var(--ink-500);
}
.toast-close:hover {
  background: var(--paper-2);
  color: var(--ink-900);
}
.toast-close svg {
  width: 12px;
  height: 12px;
}

/* 倒计时进度条 */
.toast-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  background: color-mix(in srgb, var(--ink-500) 35%, transparent);
  transform-origin: left;
  animation: toast-timer linear forwards;
}
.toast-success .toast-progress {
  background: var(--success);
}
.toast-error .toast-progress {
  background: var(--danger);
}
.toast-warning .toast-progress {
  background: var(--warning);
}
.toast-info .toast-progress {
  background: var(--accent);
}
@keyframes toast-timer {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--dur-med) var(--ease-out);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
