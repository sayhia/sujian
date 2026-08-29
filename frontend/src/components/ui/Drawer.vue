<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
  }>(),
  { title: '', closeOnBackdrop: true, closeOnEsc: true },
);

const emit = defineEmits<{ close: [] }>();

function onKeydown(e: KeyboardEvent) {
  if (props.closeOnEsc && e.key === 'Escape') emit('close');
}

watch(
  () => props.visible,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : '';
  },
);
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="visible" class="drawer-root">
        <div class="drawer-backdrop" @click="closeOnBackdrop && emit('close')" />
        <aside class="drawer-panel" role="dialog" aria-modal="true" :aria-label="title">
          <header v-if="title || $slots.head" class="drawer-head">
            <slot name="head">
              <h3 class="drawer-title">{{ title }}</h3>
            </slot>
            <button class="drawer-close" type="button" aria-label="close" @click="emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div class="drawer-body">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 110;
}
.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 18, 15, 0.35);
  backdrop-filter: blur(2px);
}
.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: min(560px, 100%);
  display: flex;
  flex-direction: column;
  background: var(--paper-0);
  border-left: 1px solid var(--line);
  box-shadow: var(--shadow-3);
}
.drawer-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px 0 24px;
  border-bottom: 1px solid var(--line);
}
.drawer-title {
  font-size: 15px;
  font-weight: 700;
}
.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--ink-500);
}
.drawer-close:hover {
  background: var(--paper-1);
  color: var(--ink-900);
}
.drawer-close svg {
  width: 16px;
  height: 16px;
}
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 32px;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity var(--dur-med) var(--ease-out);
}
.drawer-fade-enter-active .drawer-panel,
.drawer-fade-leave-active .drawer-panel {
  transition: transform var(--dur-slow) var(--ease-out);
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-fade-enter-from .drawer-panel,
.drawer-fade-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
