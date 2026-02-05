<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="toast"
        :class="toast.type"
        @mouseenter="pauseTimer(toast.id)"
        @mouseleave="resumeTimer(toast.id)"
        @click="handleToastClick(toast)"
      >
        <div class="toast-icon">
          <CheckCircle v-if="toast.type === 'success'" class="icon" />
          <XCircle v-else-if="toast.type === 'error'" class="icon" />
          <AlertCircle v-else-if="toast.type === 'warning'" class="icon" />
          <Info v-else class="icon" />
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ toast.message }}</p>
          <div v-if="toast.undoAction" class="toast-undo">
            <button 
              @click.stop="handleUndo(toast)"
              class="toast-undo-btn"
              :aria-label="t('toast.undoLabel')"
            >
              <RotateCcw class="undo-icon" aria-hidden="true" />
              {{ t('toast.undo') }}
            </button>
          </div>
        </div>
        <button class="toast-close" @click="removeToast(toast.id)" :aria-label="t('toast.close')">
          <X class="close-icon" />
        </button>
        <div 
          class="toast-progress"
          :style="{ width: `${toast.progress}%` }"
          :class="{ paused: toast.paused }"
        ></div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { CheckCircle, XCircle, AlertCircle, Info, X, RotateCcw } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

interface ToastAction {
  label: string;
  action: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: number;
  progress?: number;
  paused?: boolean;
  timer?: number;
  undoAction?: ToastAction;
  onClick?: () => void;
}

const { t } = useI18n();
const toasts = ref<Toast[]>([]);
const MAX_TOASTS = 5;
let toastId = 0;
const progressIntervals = new Map<number, number>();

watch(() => toasts.value.length, (newLength) => {
  if (newLength > MAX_TOASTS) {
    const oldestToast = toasts.value[0];
    removeToast(oldestToast.id);
  }
});

function addToast(
  message: string, 
  type: Toast['type'] = 'info', 
  duration = 3000,
  options?: {
    undoAction?: ToastAction;
    onClick?: () => void;
  }
) {
  const id = ++toastId;
  const intervalMs = 50;
  const totalSteps = duration / intervalMs;
  
  const newToast: Toast = { 
    id, 
    message, 
    type,
    duration,
    timestamp: Date.now(),
    progress: 100,
    paused: false,
    undoAction: options?.undoAction,
    onClick: options?.onClick
  };
  
  toasts.value.push(newToast);
  
  if (duration > 0) {
    const interval = setInterval(() => {
      const toastIndex = toasts.value.findIndex(t => t.id === id);
      if (toastIndex === -1) {
        clearInterval(interval);
        progressIntervals.delete(id);
        return;
      }
      
      const toast = toasts.value[toastIndex];
      if (toast.paused) return;
      
      toast.progress = Math.max(0, (toast.progress || 100) - (100 / totalSteps));
      
      if (toast.progress <= 0) {
        clearInterval(interval);
        progressIntervals.delete(id);
        removeToast(id);
      }
    }, intervalMs);
    
    progressIntervals.set(id, interval);
  }
  
  return id;
}

function removeToast(id: number) {
  const interval = progressIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    progressIntervals.delete(id);
  }
  
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
}

function pauseTimer(id: number) {
  const toast = toasts.value.find(t => t.id === id);
  if (toast && !toast.paused) {
    toast.paused = true;
  }
}

function resumeTimer(id: number) {
  const toast = toasts.value.find(t => t.id === id);
  if (toast && toast.paused) {
    toast.paused = false;
  }
}

function handleUndo(toast: Toast) {
  if (toast.undoAction) {
    toast.undoAction.action();
  }
  removeToast(toast.id);
}

function handleToastClick(toast: Toast) {
  if (toast.onClick) {
    toast.onClick();
  }
}

function clearAll() {
  progressIntervals.forEach(interval => clearInterval(interval));
  progressIntervals.clear();
  toasts.value = [];
}

onUnmounted(() => {
  progressIntervals.forEach(interval => clearInterval(interval));
});

defineExpose({ addToast, removeToast, clearAll });
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-subtle);
  transition: all 0.3s var(--ease-spring);
  cursor: pointer;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
  min-width: 280px;
  max-width: 400px;
}

.toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-on-accent) 40%, transparent), transparent);
  transition: left 0.5s ease;
}

.toast:hover {
  transform: none;
  box-shadow: var(--shadow-lg), var(--shadow-inset-soft);
  border-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.toast:hover::before {
  left: 100%;
}

.toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

.toast:hover .toast-icon {
  transform: none;
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  box-shadow: var(--shadow-sm);
}

.icon {
  width: 20px;
  height: 20px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast.success .icon {
  color: var(--color-status-success);
}

.toast.error .icon {
  color: var(--color-status-danger);
}

.toast.warning .icon {
  color: var(--color-status-warning);
}

.toast.info .icon {
  color: var(--color-status-info);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-palette-1);
  line-height: 1.6;
  padding-top: 2px;
  position: relative;
  z-index: 1;
  margin: 0;
}

.toast-undo {
  margin-top: 8px;
  position: relative;
  z-index: 1;
}

.toast-undo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent-strong);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 15%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 10%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, box-shadow;
}

.toast-undo-btn:hover {
  transform: none;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 20%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 15%, transparent)
  );
  border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
  box-shadow: var(--shadow-sm);
}

.toast-undo-btn:active {
  transform: none;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.undo-icon {
  width: 12px;
  height: 12px;
}

.toast-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin: -6px -6px -6px 0;
  will-change: transform, background-color;
  position: relative;
  z-index: 2;
}

.toast-close:hover {
  background: color-mix(in srgb, var(--text-primary) 10%, var(--color-surface));
  border-color: var(--color-border-subtle);
  transform: none;
  box-shadow: var(--shadow-sm);
}

.toast-close:active {
  transform: none;
  background: color-mix(in srgb, var(--text-primary) 12%, var(--color-surface));
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-close:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--text-primary) 20%, transparent);
  outline-offset: 2px;
}

.close-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-close:hover .close-icon {
  color: var(--color-text-body);
}

/* Progress Bar */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--color-accent),
    var(--color-accent-strong)
  );
  border-radius: 0 0 14px 14px;
  transition: width linear 0.05s;
  will-change: width;
  z-index: 1;
  opacity: 0.8;
}

.toast-progress.paused {
  opacity: 0.4;
}

.toast.success .toast-progress {
  background: linear-gradient(90deg, var(--color-status-success), color-mix(in srgb, var(--color-status-success), black 10%));
}

.toast.error .toast-progress {
  background: linear-gradient(90deg, var(--color-status-danger), color-mix(in srgb, var(--color-status-danger), black 10%));
}

.toast.warning .toast-progress {
  background: linear-gradient(90deg, var(--color-status-warning), color-mix(in srgb, var(--color-status-warning), black 10%));
}

.toast.info .toast-progress {
  background: linear-gradient(90deg, var(--color-status-info), color-mix(in srgb, var(--color-status-info), black 10%));
}

/* Toast types - left border accent with Glassmorphism */
.toast.success {
  border-left: 5px solid var(--color-status-success);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-status-success) 8%, var(--glass-bg)) 0%,
    var(--glass-bg) 100%
  );
}

.toast.error {
  border-left: 5px solid var(--color-status-danger);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-status-danger) 8%, var(--glass-bg)) 0%,
    var(--glass-bg) 100%
  );
}

.toast.warning {
  border-left: 5px solid var(--color-status-warning);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-status-warning) 8%, var(--glass-bg)) 0%,
    var(--glass-bg) 100%
  );
}

.toast.info {
  border-left: 5px solid var(--color-status-info);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-status-info) 8%, var(--glass-bg)) 0%,
    var(--glass-bg) 100%
  );
}

/* Transitions */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(120%) scale(0.9);
  filter: blur(4px);
}

.toast-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(120%) scale(0.95);
  filter: blur(4px);
}

.toast-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
