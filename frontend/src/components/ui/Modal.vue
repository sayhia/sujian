<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    width?: string;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
  }>(),
  {
    title: '',
    width: 'min(520px, calc(100vw - 48px))',
    closeOnBackdrop: true,
    closeOnEsc: true,
  },
);

const emit = defineEmits<{ close: [] }>();

function onKeydown(e: KeyboardEvent) {
  if (props.closeOnEsc && e.key === 'Escape') emit('close');
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-root" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-backdrop" @click="closeOnBackdrop && emit('close')" />
        <div class="modal-wrap">
          <div class="modal-panel" :style="{ width }">
            <header v-if="title" class="modal-head">
              <h3 class="modal-title">{{ title }}</h3>
            </header>
            <div class="modal-body">
              <slot />
            </div>
            <footer v-if="$slots.footer" class="modal-foot">
              <slot name="footer" />
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 18, 15, 0.42);
  backdrop-filter: blur(6px);
}
.modal-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-panel {
  background: var(--paper-0);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
}
.modal-head {
  padding: 20px 24px 0;
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
}
.modal-body {
  padding: 16px 24px 20px;
  overflow-y: auto;
}
.modal-foot {
  padding: 0 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--dur-med) var(--ease-out);
}
.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition: transform var(--dur-med) var(--ease-out);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-panel,
.modal-fade-leave-to .modal-panel {
  transform: translateY(10px) scale(0.98);
}
</style>
