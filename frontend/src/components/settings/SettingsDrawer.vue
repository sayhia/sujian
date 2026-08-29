<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Drawer from '../ui/Drawer.vue';
import AppearanceSection from './AppearanceSection.vue';
import PreferenceSection from './PreferenceSection.vue';
import DataSection from './DataSection.vue';
import AboutSection from './AboutSection.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

const tabs = ['appearance', 'preferences', 'data', 'about'] as const;
type TabKey = (typeof tabs)[number];
const activeTab = ref<TabKey>('appearance');

const tabLabels: Record<TabKey, string> = {
  appearance: t('settings.appearance'),
  preferences: t('settings.preferences'),
  data: t('settings.data'),
  about: t('settings.about'),
};

watch(
  () => props.visible,
  (v) => {
    if (v) activeTab.value = 'appearance';
  },
);
</script>

<template>
  <Drawer :visible="visible" :title="t('settings.title')" @close="emit('close')">
    <nav class="settings-tabs" role="tablist" aria-label="settings">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        class="settings-tab"
        :class="{ active: activeTab === tab }"
        role="tab"
        :aria-selected="activeTab === tab"
        @click="activeTab = tab"
      >
        {{ tabLabels[tab] }}
      </button>
    </nav>

    <div class="settings-content">
      <Transition name="tab" mode="out-in">
        <AppearanceSection v-if="activeTab === 'appearance'" key="appearance" />
        <PreferenceSection v-else-if="activeTab === 'preferences'" key="preferences" />
        <DataSection v-else-if="activeTab === 'data'" key="data" />
        <AboutSection v-else key="about" />
      </Transition>
    </div>
  </Drawer>
</template>

<style scoped>
.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: var(--radius-lg);
  background: var(--paper-1);
  border: 1px solid var(--line);
}
.settings-tab {
  flex: 1;
  height: 32px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-500);
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.settings-tab:hover {
  color: var(--ink-900);
}
.settings-tab.active {
  background: var(--paper-0);
  color: var(--accent-strong);
  box-shadow: var(--shadow-1);
}
.settings-content {
  padding: 4px 2px;
}

/* 分区切换过渡 */
.tab-enter-active {
  transition: opacity var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out);
}
.tab-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.tab-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tab-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
