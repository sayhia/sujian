<script setup lang="ts">
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    title?: string;
    hint?: string;
    actionLabel?: string;
    onAction?: () => void;
  }>(),
  { title: '', hint: '', actionLabel: '', onAction: undefined },
);

const { t } = useI18n();
</script>

<template>
  <div class="empty-state">
    <!-- 信笺插画：纸面 + 封缄印章 -->
    <div class="empty-art" aria-hidden="true">
      <div class="art-paper">
        <svg viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 6h44a2 2 0 0 1 2 2v32a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
          <path d="m12 10 20 14L52 10" opacity="0.55" />
          <path d="M22 26h20M22 32h12" opacity="0.4" />
        </svg>
        <span class="art-seal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M12 3c2.8 2.6 5.8 3.9 8 4-1 3.4-1 6.8 0 10-2.4.1-5 1.3-8 4-3-2.7-5.6-3.9-8-4 1-3.2 1-6.6 0-10 2.2-.1 5.2-1.4 8-4Z" />
          </svg>
        </span>
      </div>
      <span class="art-dot dot-1" />
      <span class="art-dot dot-2" />
      <span class="art-dot dot-3" />
    </div>
    <p class="empty-title">{{ title }}</p>
    <p v-if="hint" class="empty-hint">{{ hint }}</p>
    <button v-if="actionLabel && onAction" class="empty-action" type="button" @click="onAction">
      {{ actionLabel }}
    </button>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 72px 24px 56px;
  color: var(--ink-500);
}

/* 插画容器：渐变底 + 漂浮点 */
.empty-art {
  position: relative;
  width: 108px;
  height: 84px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.art-paper {
  position: relative;
  width: 84px;
  height: 62px;
  border-radius: var(--radius-md);
  background: linear-gradient(160deg, var(--paper-1), var(--paper-2));
  border: 1px solid var(--line);
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  transform: rotate(-1.5deg);
  transition: transform var(--dur-slow) var(--ease-out);
}
.empty-state:hover .art-paper {
  transform: rotate(0deg) translateY(-3px);
}
.art-paper svg {
  width: 48px;
  height: 34px;
}
.art-seal {
  position: absolute;
  right: -10px;
  bottom: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
.art-seal svg {
  width: 15px;
  height: 15px;
}
.art-dot {
  position: absolute;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}
.dot-1 {
  width: 10px;
  height: 10px;
  top: 6px;
  left: 10px;
}
.dot-2 {
  width: 6px;
  height: 6px;
  top: 22px;
  right: 4px;
  background: color-mix(in srgb, var(--ink-500) 30%, transparent);
}
.dot-3 {
  width: 8px;
  height: 8px;
  bottom: 2px;
  left: 18px;
  background: color-mix(in srgb, var(--ink-500) 22%, transparent);
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-900);
  margin-bottom: 6px;
}
.empty-hint {
  font-size: 13px;
  line-height: 1.7;
  max-width: 320px;
}
.empty-action {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  padding: 7px 16px;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
  transition: background-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}
.empty-action:hover {
  background: var(--accent-soft);
  transform: translateY(-1px);
  box-shadow: var(--shadow-1);
}
.empty-action:active {
  transform: scale(0.97);
}
</style>
