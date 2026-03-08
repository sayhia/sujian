import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import EditorialHomeDemo from '../editorial/EditorialHomeDemo.vue';
import EditorialSettingsDemo from '../editorial/EditorialSettingsDemo.vue';

describe('Demo responsive and a11y baseline', () => {
  it('keeps primary actions visible and has nav landmark labels', () => {
    const wrapper = mount(EditorialHomeDemo, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="String(to)"><slot /></a>',
          },
        },
      },
    });

    const nav = wrapper.find('nav');
    expect(nav.exists()).toBe(true);
    expect(nav.attributes('aria-label')).toBeTruthy();
    expect(wrapper.findAll('a').length).toBeGreaterThanOrEqual(3);
    expect(wrapper.find('main').exists()).toBe(true);
    expect(wrapper.find('h1').exists()).toBe(true);
  });
  it('shows typography/material/cadence sections with accessible nav', () => {
    window.location.hash = '#/settings';
    const wrapper = mount(EditorialSettingsDemo, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="String(to)"><slot /></a>',
          },
        },
      },
    });

    const nav = wrapper.find('nav[aria-label="Editorial settings navigation"]');
    expect(nav.exists()).toBe(true);
    expect(wrapper.find('[data-zone="typography"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="material"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="cadence"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="writing"]').exists()).toBe(true);

    window.location.hash = '';
  });

  it('keeps primary navigation and reading flow valid in collapsed mobile layout', () => {
    window.location.hash = '#/';
    const wrapper = mount(EditorialHomeDemo, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="String(to)"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.find('nav[aria-label="Editorial navigation"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="directory"][data-mobile-order="1"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="reading-stream"][data-mobile-order="2"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="marginalia"][data-mobile-order="3"]').exists()).toBe(true);

    window.location.hash = '';
  });

  it('binds settings controls to persisted state and restores values on mount', () => {
    const memoryStorage = {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
      removeItem(key: string) {
        this.store.delete(key);
      },
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: memoryStorage,
    });

    window.localStorage.setItem(
      'editorial-settings',
      JSON.stringify({
        typography: 'modern-geo',
        material: 'coated-paper',
        cadence: 'compact',
        writing: 'autosave-60s',
      }),
    );
    window.location.hash = '#/settings';
    const wrapper = mount(EditorialSettingsDemo, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="String(to)"><slot /></a>',
          },
        },
      },
    });

    expect((wrapper.find('[data-testid="settings-typography"]').element as HTMLSelectElement).value).toBe('modern-geo');
    expect((wrapper.find('[data-testid="settings-material"]').element as HTMLSelectElement).value).toBe('coated-paper');
    expect((wrapper.find('[data-testid="settings-cadence"]').element as HTMLSelectElement).value).toBe('compact');
    expect((wrapper.find('[data-testid="settings-writing"]').element as HTMLSelectElement).value).toBe('autosave-60s');

    window.location.hash = '';
  });
});
