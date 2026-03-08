import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import MinimalHomeDemo from '../minimal/MinimalHomeDemo.vue';
import EditorialHomeDemo from '../editorial/EditorialHomeDemo.vue';
import EditorialSettingsDemo from '../editorial/EditorialSettingsDemo.vue';
import DashboardHomeDemo from '../dashboard/DashboardHomeDemo.vue';
import CapsuleHomeDemo from '../capsule/CapsuleHomeDemo.vue';

const components = [MinimalHomeDemo, EditorialHomeDemo, DashboardHomeDemo, CapsuleHomeDemo];

describe('Demo responsive and a11y baseline', () => {
  it('keeps primary actions visible and has nav landmark labels', () => {
    components.forEach((component) => {
      const wrapper = mount(component, {
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
});
