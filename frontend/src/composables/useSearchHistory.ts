import { ref } from 'vue';

const STORAGE_KEY = 'sujian-search-history';
const MAX_HISTORY = 10;

// 模块级单例，多处（SearchPalette 等）共享
const history = ref<string[]>([]);
let loaded = false;

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        history.value = parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_HISTORY);
      }
    }
  } catch (e) {
    console.error('加载搜索历史失败:', e);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value));
  } catch (e) {
    console.error('保存搜索历史失败:', e);
  }
}

/** 搜索历史：localStorage 持久化，去重置顶，上限 10 条 */
export function useSearchHistory() {
  if (!loaded) {
    load();
    loaded = true;
  }

  function addHistory(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    history.value = [trimmed, ...history.value.filter(item => item !== trimmed)].slice(0, MAX_HISTORY);
    save();
  }

  function removeHistory(query: string) {
    history.value = history.value.filter(item => item !== query);
    save();
  }

  function clearHistory() {
    history.value = [];
    save();
  }

  return { history, addHistory, removeHistory, clearHistory };
}
