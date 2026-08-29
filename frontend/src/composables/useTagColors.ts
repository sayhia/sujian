import { ref } from 'vue';

const STORAGE_KEY = 'sujian-tag-colors-v2';

/** 与纸墨体系协调的低饱和标签色板 */
export const tagColorPalette = [
  '#8b7ec8', '#5b7cb8', '#7e9b87', '#4e9a94', '#9c7a51', '#b0564f',
  '#c08552', '#8a6f9e', '#5f7a6d', '#6f8fae', '#a8876b', '#b98a8a',
  '#7a8fa0', '#9a8b6f', '#6d8f88', '#a36f8f', '#8d9a5b', '#c07b6a',
];

const tagColors = ref<Map<string, string>>(new Map());
let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) tagColors.value = new Map(Object.entries(JSON.parse(saved)));
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(tagColors.value)));
  } catch {
    /* ignore */
  }
}

function colorOf(name: string): string {
  ensureLoaded();
  if (tagColors.value.has(name)) return tagColors.value.get(name)!;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const color = tagColorPalette[hash % tagColorPalette.length];
  tagColors.value.set(name, color);
  persist();
  return color;
}

export function useTagColors() {
  ensureLoaded();
  return {
    getTagColor: colorOf,
    palette: tagColorPalette,
  };
}
