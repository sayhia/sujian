<script setup lang="ts">
import type { Note } from '../../types';
import NoteCard from './NoteCard.vue';

defineProps<{ notes: Note[] }>();
const emit = defineEmits<{ archive: [note: Note]; delete: [note: Note] }>();
</script>

<template>
  <div class="note-grid">
    <TransitionGroup name="card">
      <div
        v-for="(note, i) in notes"
        :key="note.id"
        class="grid-item"
        :style="{ '--stagger': `${Math.min(i * 40, 280)}ms` }"
      >
        <NoteCard
          :note="note"
          grid
          @archive="emit('archive', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding-bottom: 24px;
}
.grid-item {
  min-width: 0;
}

.card-enter-active {
  transition: opacity var(--dur-slow) var(--ease-out),
    transform var(--dur-slow) var(--ease-out);
  transition-delay: var(--stagger);
}
.card-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.card-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.card-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
