import { inject } from 'vue';
import type { ToastType } from '../types/feedback';

export type ShowToastFn = (
  message: string,
  type?: ToastType,
  duration?: number,
  options?: { undoLabel?: string; onUndo?: () => void },
) => void;

export interface ConfirmOptions {
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export type ShowConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

/** 全局 Toast（由 App.vue provide） */
export function useToast(): ShowToastFn {
  const fn = inject<ShowToastFn>('showToast');
  return fn ?? (() => undefined);
}

/** 全局确认弹窗（由 App.vue provide，Promise 化） */
export function useConfirmDialog(): { showConfirm: ShowConfirmFn } {
  const fn = inject<ShowConfirmFn>('showConfirmDialog');
  const fallback: ShowConfirmFn = async () => true;
  return { showConfirm: fn ?? fallback };
}
