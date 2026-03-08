import { ref, watch } from 'vue';

type EditorialSettingsState = {
  typography: string;
  material: string;
  cadence: string;
  writing: string;
};

const STORAGE_KEY = 'editorial-settings';

const defaultState: EditorialSettingsState = {
  typography: 'classic-serif',
  material: 'linen-paper',
  cadence: 'standard',
  writing: 'autosave-30s',
};

export function useEditorialSettings() {
  let initialState = defaultState;
  if (typeof window !== 'undefined' && window.localStorage?.getItem) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        initialState = {
          ...defaultState,
          ...(JSON.parse(raw) as Partial<EditorialSettingsState>),
        };
      }
    } catch {
      initialState = defaultState;
    }
  }

  const settings = ref<EditorialSettingsState>(initialState);

  watch(
    settings,
    (value) => {
      if (typeof window !== 'undefined' && window.localStorage?.setItem) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
    },
    { deep: true },
  );

  return {
    settings,
  };
}
