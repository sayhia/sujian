<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { updaterApi, type UpdateInfo } from '../../services/updater';

/**
 * 更新对话框：自包含「检查 → 下载 → 安装」全流程。
 * 打开即自动检查；无更新时显示「已是最新」并停留，由用户关闭。
 */
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const { t } = useI18n();

type Stage = 'checking' | 'ready' | 'downloading' | 'downloaded' | 'installing' | 'latest' | 'error';
const stage = ref<Stage>('checking');
const info = ref<UpdateInfo | null>(null);
const progress = ref(0);
const errorMsg = ref('');
let unsubProgress: (() => void) | null = null;

// 打开时自动检查
watch(
  () => props.modelValue,
  async (show) => {
    if (show) {
      stage.value = 'checking';
      info.value = null;
      errorMsg.value = '';
      await doCheck();
    }
  },
  { immediate: true },
);

async function doCheck() {
  stage.value = 'checking';
  const result = await updaterApi.checkForUpdates();
  if (!result || !result.available) {
    stage.value = 'latest';
    return;
  }
  info.value = result;
  stage.value = 'ready';
}

async function doDownload() {
  if (!info.value) return;
  stage.value = 'downloading';
  progress.value = 0;
  unsubProgress = updaterApi.onDownloadProgress((pct) => {
    progress.value = pct < 0 ? progress.value : pct;
  });
  try {
    await updaterApi.downloadUpdate(info.value);
    stage.value = 'downloaded';
  } catch (e: any) {
    errorMsg.value = e?.message || String(e);
    stage.value = 'error';
  } finally {
    if (unsubProgress) {
      unsubProgress();
      unsubProgress = null;
    }
  }
}

async function doInstall() {
  stage.value = 'installing';
  try {
    await updaterApi.applyUpdate();
    // 成功后进程退出，后续不会执行
  } catch (e: any) {
    errorMsg.value = e?.message || String(e);
    stage.value = 'error';
  }
}

function close() {
  if (unsubProgress) {
    unsubProgress();
    unsubProgress = null;
  }
  emit('update:modelValue', false);
}

onUnmounted(() => {
  if (unsubProgress) unsubProgress();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="ud-fade">
      <div v-if="modelValue" class="ud-mask" @click.self="close">
        <div class="ud-card" role="dialog" aria-modal="true">
          <button class="ud-close" @click="close" :aria-label="t('common.close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div class="ud-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12m0 0l4-4m-4 4l-4-4" />
              <path d="M5 21h14" />
            </svg>
          </div>
          <h3 class="ud-title">{{ t('settings.updater.title') }}</h3>

          <!-- 检查中 -->
          <div v-if="stage === 'checking'" class="ud-body">
            <div class="ud-spinner" aria-hidden="true"></div>
            <p class="ud-hint">{{ t('settings.updater.checking') }}</p>
          </div>

          <!-- 已是最新 -->
          <div v-else-if="stage === 'latest'" class="ud-body">
            <p class="ud-ok">{{ t('settings.updater.latest') }}</p>
            <button class="ud-btn" @click="close">{{ t('common.close') }}</button>
          </div>

          <!-- 就绪/下载中/已下载 -->
          <div v-else-if="info" class="ud-body">
            <div class="ud-versions">
              <div class="ud-ver">
                <span class="ud-vlbl">{{ t('settings.updater.current') }}</span>
                <span class="ud-vval">{{ info.currentVersion }}</span>
              </div>
              <span class="ud-arrow" aria-hidden="true">→</span>
              <div class="ud-ver">
                <span class="ud-vlbl">{{ t('settings.updater.latestVersion') }}</span>
                <span class="ud-vval ud-new">{{ info.latestVersion }}</span>
              </div>
            </div>

            <div v-if="info.notes" class="ud-notes">
              <p class="ud-notes-title">{{ t('settings.updater.notes') }}</p>
              <pre class="ud-notes-body">{{ info.notes }}</pre>
            </div>

            <div v-if="stage === 'downloading'" class="ud-progress">
              <div class="ud-bar">
                <div class="ud-bar-fill" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="ud-pct">{{ progress }}%</span>
            </div>

            <div v-if="stage === 'installing'" class="ud-hint">
              <div class="ud-spinner ud-sm" aria-hidden="true"></div>
              <span>{{ t('settings.updater.installing') }}</span>
            </div>

            <div class="ud-actions">
              <button v-if="stage === 'ready'" class="ud-btn ud-primary" @click="doDownload">
                {{ t('settings.updater.download') }}
              </button>
              <button v-if="stage === 'downloaded'" class="ud-btn ud-primary" @click="doInstall">
                {{ t('settings.updater.install') }}
              </button>
              <button v-if="stage === 'downloading' || stage === 'ready'" class="ud-btn ud-ghost" @click="close">
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>

          <!-- 错误 -->
          <div v-else-if="stage === 'error'" class="ud-body">
            <p class="ud-err">{{ t('settings.updater.error') }}</p>
            <p v-if="errorMsg" class="ud-errmsg">{{ errorMsg }}</p>
            <div class="ud-actions">
              <button class="ud-btn ud-primary" @click="doCheck">{{ t('settings.updater.retry') }}</button>
              <button class="ud-btn ud-ghost" @click="close">{{ t('common.close') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ud-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ink-900) 38%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.ud-card {
  position: relative;
  width: min(440px, 92vw);
  max-height: 86vh;
  overflow: auto;
  padding: 28px 28px 24px;
  border-radius: var(--radius-lg);
  background: var(--paper-1);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-pop, 0 18px 48px rgba(0, 0, 0, 0.18));
  text-align: center;
}
.ud-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-500);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ud-close:hover {
  background: var(--paper-2);
  color: var(--ink-900);
}
.ud-close svg {
  width: 16px;
  height: 16px;
}
.ud-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.ud-icon svg {
  width: 28px;
  height: 28px;
}
.ud-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 18px;
}
.ud-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.ud-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-600);
}
.ud-ok {
  font-size: 14px;
  color: var(--ink-800);
  margin: 6px 0;
}
.ud-versions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
}
.ud-ver {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.ud-vlbl {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-500);
}
.ud-vval {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-900);
  font-variant-numeric: tabular-nums;
}
.ud-vval.ud-new {
  color: var(--accent-strong);
}
.ud-arrow {
  font-size: 18px;
  color: var(--ink-400);
}
.ud-notes {
  width: 100%;
  text-align: left;
}
.ud-notes-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-500);
  margin-bottom: 6px;
}
.ud-notes-body {
  max-height: 160px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--paper-2);
  border: 1px solid var(--line);
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-700);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
.ud-progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ud-bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--paper-2);
  border: 1px solid var(--line);
  overflow: hidden;
}
.ud-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent-strong);
  transition: width 0.2s var(--ease-spring, ease);
}
.ud-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-700);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}
.ud-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.ud-btn {
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--paper-1);
  color: var(--ink-800);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s var(--ease-spring, ease);
}
.ud-btn:hover {
  background: var(--paper-2);
}
.ud-btn.ud-primary {
  background: var(--accent-strong);
  border-color: transparent;
  color: #fff;
}
.ud-btn.ud-primary:hover {
  filter: brightness(1.08);
}
.ud-btn.ud-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--ink-500);
}
.ud-err {
  font-size: 14px;
  color: var(--danger, #c0392b);
  font-weight: 600;
}
.ud-errmsg {
  font-size: 11px;
  color: var(--ink-500);
  word-break: break-word;
  max-width: 100%;
}
.ud-spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid var(--line);
  border-top-color: var(--accent-strong);
  animation: ud-spin 0.8s linear infinite;
}
.ud-spinner.ud-sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
@keyframes ud-spin {
  to {
    transform: rotate(360deg);
  }
}
.ud-fade-enter-active,
.ud-fade-leave-active {
  transition: opacity 0.22s var(--ease-spring, ease);
}
.ud-fade-enter-active .ud-card,
.ud-fade-leave-active .ud-card {
  transition: transform 0.28s var(--ease-spring, ease), opacity 0.22s ease;
}
.ud-fade-enter-from,
.ud-fade-leave-to {
  opacity: 0;
}
.ud-fade-enter-from .ud-card,
.ud-fade-leave-to .ud-card {
  transform: translateY(12px) scale(0.96);
  opacity: 0;
}
</style>
