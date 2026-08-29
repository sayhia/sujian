<script setup lang="ts">
import { useTagColors } from '../../composables/useTagColors';

const props = withDefaults(
  defineProps<{ tag: string; removable?: boolean; clickable?: boolean }>(),
  { removable: false, clickable: false },
);
const emit = defineEmits<{ remove: [tag: string]; select: [tag: string] }>();

const { getTagColor } = useTagColors();
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="tag-chip"
    :class="{ clickable }"
    :style="{ '--tag-color': getTagColor(props.tag) }"
    :type="clickable ? 'button' : undefined"
    @click="clickable && emit('select', props.tag)"
  >
    <span class="tag-dot" aria-hidden="true" />
    <span class="tag-text">{{ props.tag }}</span>
    <button
      v-if="removable"
      type="button"
      class="tag-remove"
      :aria-label="`remove ${props.tag}`"
      @click.stop="emit('remove', props.tag)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </component>
</template>

<style scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--tag-color) 13%, transparent);
  color: color-mix(in srgb, var(--tag-color) 78%, var(--ink-900));
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  text-align: left;
  transition: background-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.tag-chip.clickable {
  cursor: pointer;
}
.tag-chip.clickable:hover {
  background: color-mix(in srgb, var(--tag-color) 22%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tag-color) 12%, transparent);
}
.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tag-color);
  flex: none;
}
.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: -3px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.65;
}
.tag-remove:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--tag-color) 20%, transparent);
}
.tag-remove svg {
  width: 9px;
  height: 9px;
}
</style>
