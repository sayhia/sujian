<script setup lang="ts">
defineProps<{ rows?: number; grid?: boolean }>();
</script>

<template>
  <div class="skeleton-feed" :class="{ grid }">
    <template v-for="i in rows ?? 3" :key="i">
      <div v-if="grid" class="sk-card">
        <div class="sk-line w-30" />
        <div class="sk-line w-90" />
        <div class="sk-line w-70" />
      </div>
      <div v-else class="sk-card">
        <div class="sk-row">
          <div class="sk-dot" />
          <div class="sk-line w-20" />
        </div>
        <div class="sk-line w-60" />
        <div class="sk-line w-95" />
        <div class="sk-line w-80" />
        <div class="sk-row">
          <div class="sk-chip" />
          <div class="sk-chip" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skeleton-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 24px;
}
.skeleton-feed.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.sk-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: var(--paper-1);
  border: 1px solid var(--line);
}
.sk-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--paper-2);
}
.sk-chip {
  width: 52px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--paper-2);
}
.sk-line {
  height: 12px;
  border-radius: var(--radius-full);
  background: var(--paper-2);
  position: relative;
  overflow: hidden;
}
.sk-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--ink-500) 10%, transparent), transparent);
  animation: sk-shimmer 1.4s var(--ease-out) infinite;
}
.w-20 { width: 20%; }
.w-30 { width: 30%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-80 { width: 80%; }
.w-90 { width: 90%; }
.w-95 { width: 95%; }

@keyframes sk-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sk-line::after {
    animation: none;
  }
}
</style>
