<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  options: { value: string; label: string; icon?: string }[];
  label?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const activeIndex = computed(() => {
  const i = props.options.findIndex((o) => o.value === props.modelValue);
  return i < 0 ? 0 : i;
});
const thumbStyle = computed(() => ({
  width: `calc((100% - 6px) / ${props.options.length})`,
  transform: `translateX(calc(${activeIndex.value} * (100% - 6px)))`,
}));
</script>

<template>
  <div class="segmented" :role="label ? 'radiogroup' : undefined" :aria-label="label">
    <span class="seg-thumb" aria-hidden="true" :style="thumbStyle" />
    <button
      v-for="(opt, i) in options"
      :key="opt.value"
      type="button"
      class="seg-option"
      :class="{ active: opt.value === modelValue }"
      role="radio"
      :aria-checked="opt.value === modelValue"
      :style="{ zIndex: i === activeIndex ? 1 : undefined }"
      @click="emit('update:modelValue', opt.value)"
    >
      <svg v-if="opt.icon" class="seg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path :d="opt.icon" />
      </svg>
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  position: relative;
  display: inline-flex;
  padding: 3px;
  gap: 0;
  border-radius: var(--radius-md);
  background: var(--paper-1);
  border: 1px solid var(--line);
}
.seg-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  height: calc(100% - 6px);
  border-radius: var(--radius-sm);
  background: var(--paper-0);
  box-shadow: var(--shadow-1);
  transition: transform var(--dur-med) var(--ease-out), width var(--dur-med) var(--ease-out);
}
.seg-option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 11px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-500);
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-out);
}
.seg-option:hover {
  color: var(--ink-900);
}
.seg-option.active {
  color: var(--ink-900);
  font-weight: 600;
}
.seg-icon {
  width: 13px;
  height: 13px;
}
</style>
