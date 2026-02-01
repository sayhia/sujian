<template>
  <Teleport to="body">
    <TransitionRoot appear :show="visible" as="template">
      <Dialog as="div" class="dialog-root" @close="onCancel">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="dialog-backdrop" />
        </TransitionChild>

        <div class="dialog-wrapper">
        <div class="dialog-scroll">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="dialog-panel">
              <!-- Icon -->
              <div class="dialog-icon" :class="iconClass">
                <AlertTriangle v-if="type === 'danger'" class="icon" />
                <AlertCircle v-else-if="type === 'warning'" class="icon" />
                <Info v-else class="icon" />
              </div>
              
              <!-- Content -->
              <DialogTitle as="h3" class="dialog-title">{{ title }}</DialogTitle>
              <DialogDescription class="dialog-message">{{ message }}</DialogDescription>
              
              <!-- Actions -->
              <div class="dialog-actions">
                <button 
                  class="btn btn-secondary" 
                  @click="onCancel"
                  type="button"
                  :aria-label="cancelText"
                >
                  {{ cancelText }}
                </button>
                <button 
                  class="btn" 
                  :class="confirmBtnClass"
                  :disabled="loading"
                  @click="onConfirm"
                  type="button"
                  :aria-label="confirmText"
                  :aria-busy="loading"
                >
                  <Loader2 v-if="loading" class="btn-icon spinning" />
                  {{ confirmText }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-vue-next';

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  message: '确定要执行此操作吗？',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',
  loading: false
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const iconClass = computed(() => ({
  'icon-info': props.type === 'info',
  'icon-warning': props.type === 'warning',
  'icon-danger': props.type === 'danger'
}));

const confirmBtnClass = computed(() => ({
  'btn-primary': props.type === 'info',
  'btn-warning': props.type === 'warning',
  'btn-danger': props.type === 'danger'
}));

function onConfirm() {
  if (!props.loading) {
    emit('confirm');
  }
}

function onCancel() {
  if (!props.loading) {
    emit('cancel');
  }
}
</script>

<!-- 样式已提取到 @/styles/global.css -->
