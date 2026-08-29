<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    size?: 'sm' | 'md';
    active?: boolean;
    disabled?: boolean;
  }>(),
  {
    size: 'md',
    active: false,
    disabled: false,
  },
);
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    :class="[`ic-${size}`, { active, disabled }]"
    :aria-label="label"
    v-tip:bottom="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--ink-500);
  transition: background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}
.icon-btn:hover:not(:disabled) {
  background: var(--paper-1);
  color: var(--ink-900);
}
.icon-btn.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.icon-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}
.ic-md {
  width: 34px;
  height: 34px;
}
.ic-sm {
  width: 28px;
  height: 28px;
}
.icon-btn :deep(svg) {
  width: 17px;
  height: 17px;
}
.ic-sm :deep(svg) {
  width: 15px;
  height: 15px;
}
</style>
