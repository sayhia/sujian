<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();
</script>

<template>
  <button
    type="button"
    class="switch"
    :class="{ on: modelValue, disabled }"
    :role="label ? 'switch' : undefined"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="switch-knob" />
  </button>
</template>

<style scoped>
.switch {
  position: relative;
  flex: none;
  width: 42px;
  height: 25px;
  border-radius: var(--radius-full);
  background: var(--paper-2);
  border: 1px solid var(--line);
  transition: background-color var(--dur-med) var(--ease-out), border-color var(--dur-med) var(--ease-out);
}
.switch:hover:not(:disabled) {
  border-color: var(--line-strong);
}
.switch.on {
  background: var(--accent);
  border-color: var(--accent);
}
.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-1);
  transition: transform var(--dur-med) var(--ease-out);
}
.switch.on .switch-knob {
  transform: translateX(17px);
}
.switch.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
