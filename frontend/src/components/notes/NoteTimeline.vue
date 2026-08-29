<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../../stores/settings';
import type { Note } from '../../types';
import { groupKeyOf, type GroupKey } from '../../composables/useDateFormat';
import NoteCard from './NoteCard.vue';

const props = defineProps<{ notes: Note[] }>();
const emit = defineEmits<{ archive: [note: Note]; delete: [note: Note] }>();

const { t } = useI18n();
const settings = useSettingsStore();
const router = useRouter();

function openNote(note: Note) {
  router.push(`/notes/${note.id}/edit`);
}

interface Group {
  key: GroupKey;
  label: string;
  notes: Note[];
}

const groups = computed<Group[]>(() => {
  const map = new Map<GroupKey, Note[]>();
  for (const note of props.notes) {
    const key = groupKeyOf(note.created_at);
    const list = map.get(key) ?? [];
    list.push(note);
    map.set(key, list);
  }
  const labelMap: Record<GroupKey, string> = {
    today: t('home.groupToday'),
    yesterday: t('home.groupYesterday'),
    earlier: t('home.groupEarlier'),
  };
  return (['today', 'yesterday', 'earlier'] as GroupKey[])
    .filter((k) => map.has(k))
    .map((k) => ({ key: k, label: labelMap[k], notes: map.get(k)! }));
});

/** 展平为「里程碑 + 信笺」统一列表，供 TransitionGroup 单根渲染 */
type TimelineItem =
  | { id: string; type: 'milestone'; groupKey: GroupKey; label: string; count: number; stagger: number }
  | { id: string; type: 'note'; note: Note; stagger: number };

const items = computed<TimelineItem[]>(() => {
  const list: TimelineItem[] = [];
  groups.value.forEach((g, gi) => {
    list.push({ id: `m-${g.key}`, type: 'milestone', groupKey: g.key, label: g.label, count: g.notes.length, stagger: 0 });
    g.notes.forEach((n, ni) => {
      list.push({ id: `n-${n.id}`, type: 'note', note: n, stagger: Math.min(40 * (gi * 3 + ni), 320) });
    });
  });
  return list;
});

function locale() {
  switch (settings.settings.language) {
    case 'zh':
      return 'zh-CN';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    default:
      return 'en-US';
  }
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString(locale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.settings.timeFormat === '12h',
  });
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString(locale(), { month: 'short', day: 'numeric' });
}

/** 时间刻度：今天=时刻 / 昨天=「昨天」 / 更早=月日，副行互补 */
function timeInfo(note: Note): { main: string; sub: string } {
  const d = new Date(note.created_at);
  const key = groupKeyOf(note.created_at);
  if (key === 'today') return { main: fmtTime(d), sub: t('home.groupToday') };
  if (key === 'yesterday') return { main: t('home.groupYesterday'), sub: fmtTime(d) };
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return { main: fmtDate(d), sub: sameYear ? fmtTime(d) : String(d.getFullYear()) };
}
</script>

<template>
  <div class="letter-timeline">
    <TransitionGroup name="tl">
      <template v-for="item in items" :key="item.id">
        <div v-if="item.type === 'milestone'" class="tl-milestone" :class="{ today: item.groupKey === 'today' }">
          <span class="ms-label">{{ item.label }}</span>
          <span class="ms-count">{{ item.count }}</span>
        </div>
        <div v-else class="tl-entry" :style="{ '--stagger': `${item.stagger}ms` }">
          <button
            type="button"
            class="tl-node"
            :aria-label="`open ${item.note.title || t('noteCard.emptyTitle')}`"
            v-tip:right="t('noteCard.edit')"
            @click="openNote(item.note)"
          />
          <div class="tl-time">
            <span class="tl-time-main">{{ timeInfo(item.note).main }}</span>
            <span class="tl-time-sub">{{ timeInfo(item.note).sub }}</span>
          </div>
          <div class="tl-card">
            <NoteCard
              :note="item.note"
              @archive="emit('archive', $event)"
              @delete="emit('delete', $event)"
            />
          </div>
        </div>
      </template>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ============ 纸上时间轴：贯穿竖线 + 封蜡节点 ============ */
.letter-timeline {
  position: relative;
  padding-bottom: 40px;
}

/* 竖向轨道线：accent 渐变，如墨痕 */
.letter-timeline::before {
  content: '';
  position: absolute;
  left: 78px;
  top: 6px;
  bottom: 10px;
  width: 2px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--accent) 60%, transparent),
    color-mix(in srgb, var(--accent) 22%, transparent) 62%,
    transparent
  );
  opacity: 0.7;
}

/* ---------- 里程碑 ---------- */
.tl-milestone {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 30px 0 14px;
  padding-left: 108px;
}
.tl-milestone::before {
  content: '';
  position: absolute;
  left: calc(78px - 9px);
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--paper-0);
  border: 3.5px solid var(--accent);
  box-shadow: 0 0 0 5px var(--accent-soft), 0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent);
  z-index: 1;
}
.tl-milestone:first-child {
  margin-top: 6px;
}
/* 「今天」里程碑：柔和呼吸脉冲 */
.tl-milestone.today::before {
  animation: ms-pulse 2.6s var(--ease-out) infinite;
}
@keyframes ms-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 5px var(--accent-soft), 0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 0 9px color-mix(in srgb, var(--accent) 12%, transparent),
      0 2px 10px color-mix(in srgb, var(--accent) 45%, transparent);
  }
}
.ms-label {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--ink-900);
}
.ms-count {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  background: var(--paper-1);
  border: 1px solid var(--line);
  color: var(--ink-500);
  font-variant-numeric: tabular-nums;
}

/* ---------- 信笺节点 ---------- */
.tl-entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding-left: 108px;
  margin-bottom: 14px;
}
/* 封蜡节点：可点击直达编辑 */
.tl-node {
  position: absolute;
  left: calc(78px - 5px);
  top: 21px;
  width: 10px;
  height: 10px;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  background: var(--accent);
  background-clip: content-box;
  box-shadow: 0 0 0 3px var(--accent-soft), 0 0 12px color-mix(in srgb, var(--accent) 45%, transparent);
  z-index: 1;
  cursor: pointer;
  transition: transform var(--dur-med) var(--ease-out), box-shadow var(--dur-med) var(--ease-out);
}
.tl-entry:hover .tl-node {
  transform: scale(1.5);
  box-shadow: 0 0 0 5px var(--accent-soft), 0 0 20px color-mix(in srgb, var(--accent) 60%, transparent);
}
.tl-node:hover {
  transform: scale(1.7);
}

/* 时间刻度列 */
.tl-time {
  position: absolute;
  left: 0;
  top: 18px;
  width: 66px;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 14px;
  pointer-events: none;
}
.tl-time-main {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  transition: color var(--dur-fast) var(--ease-out);
}
.tl-time-sub {
  font-size: 10.5px;
  color: var(--ink-500);
  font-variant-numeric: tabular-nums;
  transition: color var(--dur-fast) var(--ease-out);
}
/* hover 联动：时间刻度点亮 */
.tl-entry:hover .tl-time-main {
  color: var(--accent-strong);
}
.tl-entry:hover .tl-time-sub {
  color: var(--ink-700);
}

/* 卡片区 */
.tl-card {
  flex: 1;
  min-width: 0;
}

/* ---------- 进入 / 移除动画 ---------- */
.tl-enter-active {
  transition: opacity var(--dur-slow) var(--ease-out),
    transform var(--dur-slow) var(--ease-out);
  transition-delay: var(--stagger);
}
.tl-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.tl-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.tl-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ---------- 窄屏降级：隐藏时间刻度，节点靠左 ---------- */
@media (max-width: 560px) {
  .letter-timeline {
    padding-left: 0;
  }
  .letter-timeline::before {
    left: 9px;
  }
  .tl-entry {
    padding-left: 30px;
  }
  .tl-node {
    left: 4px;
  }
  .tl-milestone {
    padding-left: 30px;
  }
  .tl-milestone::before {
    left: 0;
  }
  .tl-time {
    display: none;
  }
}
</style>
