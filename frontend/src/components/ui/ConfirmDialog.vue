<script setup lang="ts">
import Modal from './Modal.vue';
import BaseButton from './BaseButton.vue';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
  }>(),
  {
    title: '确认',
    message: '',
    type: 'info',
    confirmText: '确定',
    cancelText: '取消',
    loading: false,
  },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <Modal :visible="visible" :title="title" :width="'min(400px, calc(100vw - 48px))'" @close="emit('cancel')">
    <div class="confirm-body">
      <span class="confirm-icon" :class="`type-${type}`" aria-hidden="true">
        <svg v-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4M12 17.5h.01" />
        </svg>
        <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5h.01" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M12 12v4" />
        </svg>
      </span>
      <p class="confirm-msg">{{ message }}</p>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="emit('cancel')">{{ cancelText }}</BaseButton>
      <BaseButton
        :variant="type === 'danger' ? 'danger' : 'primary'"
        :loading="loading"
        @click="emit('confirm')"
      >
        {{ confirmText }}
      </BaseButton>
    </template>
  </Modal>
</template>

<style scoped>
.confirm-body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.confirm-icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  margin-top: 2px;
}
.confirm-icon svg {
  width: 18px;
  height: 18px;
}
.confirm-icon.type-danger {
  background: var(--danger-soft);
  color: var(--danger);
}
.confirm-icon.type-warning {
  background: var(--warning-soft);
  color: var(--warning);
}
.confirm-icon.type-info {
  background: var(--accent-soft);
  color: var(--accent);
}
.confirm-msg {
  flex: 1;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-700);
  padding-top: 2px;
}
</style>
