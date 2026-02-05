<template>
  <router-view />
  <Toast ref="toastRef" />
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import Toast from './components/Toast.vue';

const toastRef = ref<InstanceType<typeof Toast> | null>(null);

function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  toastRef.value?.addToast(message, type);
}

provide('showToast', showToast);
</script>
