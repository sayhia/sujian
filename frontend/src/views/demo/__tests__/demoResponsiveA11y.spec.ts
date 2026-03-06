import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import MinimalHomeDemo from '../minimal/MinimalHomeDemo.vue';
import EditorialHomeDemo from '../editorial/EditorialHomeDemo.vue';
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
});
