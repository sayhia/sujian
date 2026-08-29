<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit';
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
  },
);
</script>

<template>
  <button
    :type="type"
    class="base-btn"
    :class="[`btn-${variant}`, `btn-${size}`]"
    :disabled="disabled || loading"
  >
    <svg
      v-if="loading"
      class="btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke-opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--radius-md);
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.base-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-md {
  height: 36px;
  padding: 0 16px;
  font-size: 13.5px;
}
.btn-sm {
  height: 28px;
  padding: 0 12px;
  font-size: 12.5px;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--shadow-1);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-strong);
  box-shadow: var(--shadow-2);
}

.btn-secondary {
  background: var(--paper-1);
  color: var(--ink-900);
  border: 1px solid var(--line);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--paper-2);
  border-color: var(--line-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--ink-700);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--paper-1);
  color: var(--ink-900);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  filter: brightness(1.05);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  animation: btn-rotate 0.8s linear infinite;
}
@keyframes btn-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
