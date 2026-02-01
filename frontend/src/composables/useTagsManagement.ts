import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';

export function useTagsManagement(initialTags: Ref<string[]>, maxTags: number = 10) {
  const tagInput = ref('');
  const showSuggestions = ref(false);
  const suggestions = ref<string[]>([]);
  const suggestionIndex = ref(-1);
  const sortAsc = ref(true);
  const tagFilter = ref('');
  const tagColors = ref<Map<string, string>>(new Map());
  const shakingTag = ref<string | null>(null);

  const tagColorPalette = [
    '#fbbf24', '#f59e0b', '#d97706', '#b45309',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
    '#ec4899', '#db2777', '#be185d', '#9d174d',
    '#06b6d4', '#0891b2', '#0e7490', '#155e75',
    '#10b981', '#059669', '#047857', '#065f46',
    '#f87171', '#ef4444', '#dc2626', '#b91c1c'
  ];

  const sortedTags = computed(() => {
    const tags = [...initialTags.value];
    return tags.sort((a, b) => sortAsc.value 
      ? a.localeCompare(b, 'zh-CN') 
      : b.localeCompare(a, 'zh-CN')
    );
  });

  const filteredTags = computed(() => {
    if (!tagFilter.value.trim()) {
      return sortedTags.value;
    }
    const filter = tagFilter.value.toLowerCase();
    return sortedTags.value.filter(tag => 
      tag.toLowerCase().includes(filter)
    );
  });

  const canAddTag = computed(() => {
    return tagInput.value.trim() && initialTags.value.length < maxTags;
  });

  const tagsLimitWarning = computed(() => {
    const count = initialTags.value.length;
    if (count >= maxTags) {
      return `标签数量已达到上限 ${maxTags} 个`;
    }
    if (count >= maxTags - 2) {
      return `还可以添加 ${maxTags - count} 个标签`;
    }
    return '';
  });

  function addTag(tag: string): 'added' | 'duplicate' | 'limit' | 'empty' {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return 'empty';
    
    if (initialTags.value.includes(trimmedTag)) {
      shakingTag.value = trimmedTag;
      setTimeout(() => {
        shakingTag.value = null;
      }, 500);
      return 'duplicate';
    }
    
    if (initialTags.value.length >= maxTags) {
      return 'limit';
    }
    
    initialTags.value.push(trimmedTag);
    tagInput.value = '';
    return 'added';
  }

  function removeTag(tag: string) {
    const index = initialTags.value.indexOf(tag);
    if (index !== -1) {
      initialTags.value.splice(index, 1);
      return true;
    }
    return false;
  }

  function clearAllTags() {
    initialTags.value = [];
  }

  function toggleSort() {
    sortAsc.value = !sortAsc.value;
  }

  function getTagColor(tagName: string): string {
    if (!tagColors.value.has(tagName)) {
      const index = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % tagColorPalette.length;
      tagColors.value.set(tagName, tagColorPalette[index]);
    }
    return tagColors.value.get(tagName) || tagColorPalette[0];
  }

  function setTagColor(tagName: string, color: string) {
    tagColors.value.set(tagName, color);
    saveTagColors();
  }

  function loadTagColors() {
    try {
      const saved = localStorage.getItem('panda-tag-colors');
      if (saved) {
        const colors = JSON.parse(saved);
        tagColors.value = new Map(Object.entries(colors));
      }
    } catch (e) {
      console.error('加载标签颜色失败:', e);
    }
  }

  function saveTagColors() {
    try {
      const obj = Object.fromEntries(tagColors.value);
      localStorage.setItem('panda-tag-colors', JSON.stringify(obj));
    } catch (e) {
      console.error('保存标签颜色失败:', e);
    }
  }

  watch(tagColors, () => {
    saveTagColors();
  }, { deep: true });

  loadTagColors();

  return {
    tagInput,
    showSuggestions,
    suggestions,
    suggestionIndex,
    sortAsc,
    tagFilter,
    filteredTags,
    canAddTag,
    tagsLimitWarning,
    shakingTag,
    addTag,
    removeTag,
    clearAllTags,
    toggleSort,
    getTagColor,
    setTagColor
  };
}
