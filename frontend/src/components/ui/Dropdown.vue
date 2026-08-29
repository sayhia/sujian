<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: string;
  kbd?: string;
  danger?: boolean;
  dividerBefore?: boolean;
}

withDefaults(
  defineProps<{
    items: DropdownItem[];
    align?: 'left' | 'right';
  }>(),
  { align: 'right' },
);

const emit = defineEmits<{ select: [key: string] }>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

function toggle() {
  open.value = !open.value;
}

function pick(item: DropdownItem) {
  open.value = false;
  emit('select', item.key);
}

function onDocClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false;
}

onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
</script>

<template>
  <div ref="rootRef" class="dropdown">
    <slot :toggle="toggle" :open="open" />
    <Transition name="dd">
      <div v-if="open" class="dd-menu" :class="`dd-${align}`">
        <template v-for="item in items" :key="item.key">
          <div v-if="item.dividerBefore" class="dd-divider" />
          <button
            type="button"
            class="dd-item"
            :class="{ danger: item.danger }"
            @click="pick(item)"
          >
            <svg v-if="item.icon" class="dd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="item.icon" />
            </svg>
            <span class="dd-label">{{ item.label }}</span>
            <kbd v-if="item.kbd" class="dd-kbd">{{ item.kbd }}</kbd>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
  display: inline-flex;
}
.dd-menu {
  position: absolute;
  top: calc(100% + 6px);
  min-width: 180px;
  padding: 5px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-0) calc(var(--glass-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--line);
  box-shadow: var(--shadow-pop);
  z-index: 80;
}
.dd-right {
  right: 0;
}
.dd-left {
  left: 0;
}
.dd-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--ink-900);
  text-align: left;
  transition: background-color var(--dur-fast) var(--ease-out);
}
.dd-item:hover {
  background: var(--paper-1);
}
.dd-icon {
  width: 15px;
  height: 15px;
  color: var(--ink-500);
  flex: none;
}
.dd-label {
  flex: 1;
}
.dd-kbd {
  font-family: var(--font-sans);
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--paper-1);
  border: 1px solid var(--line);
  color: var(--ink-500);
}
.dd-item.danger {
  color: var(--danger);
}
.dd-item.danger .dd-icon {
  color: var(--danger);
}
.dd-item.danger:hover {
  background: var(--danger-soft);
}
.dd-divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--line);
}

.dd-enter-active,
.dd-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.dd-enter-from,
.dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
