<script setup lang="ts">
import { provide, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Toast from './components/ui/Toast.vue';
import ConfirmDialog from './components/ui/ConfirmDialog.vue';
import type { ShowToastFn } from './composables/useFeedback';

const { t } = useI18n();
const toastRef = ref<InstanceType<typeof Toast> | null>(null);

const showToast: ShowToastFn = (message, type = 'info', duration = 3000, options) => {
  toastRef.value?.addToast(message, type, duration, options);
};
provide('showToast', showToast);

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  confirmText: string;
  cancelText: string;
  loading: boolean;
}
const state = reactive<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: '',
  cancelText: '',
  loading: false,
});
let resolver: ((v: boolean) => void) | null = null;

const showConfirmDialog = (options: {
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> => {
  state.title = options.title ?? t('common.confirm');
  state.message = options.message ?? '';
  state.type = options.type ?? 'info';
  state.confirmText = options.confirmText ?? t('common.confirm');
  state.cancelText = options.cancelText ?? t('common.cancel');
  state.loading = false;
  state.visible = true;
  return new Promise((resolve) => {
    resolver = resolve;
  });
};
provide('showConfirmDialog', showConfirmDialog);

function resolveConfirm(result: boolean) {
  state.visible = false;
  resolver?.(result);
  resolver = null;
}
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <Toast ref="toastRef" />
  <ConfirmDialog
    :visible="state.visible"
    :title="state.title"
    :message="state.message"
    :type="state.type"
    :confirm-text="state.confirmText"
    :cancel-text="state.cancelText"
    :loading="state.loading"
    @confirm="resolveConfirm(true)"
    @cancel="resolveConfirm(false)"
  />
</template>
