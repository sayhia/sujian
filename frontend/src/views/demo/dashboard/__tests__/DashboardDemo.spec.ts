import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import DashboardHomeDemo from '../DashboardHomeDemo.vue';

describe('Dashboard demo', () => {
  it('renders dashboard KPI/filter layout and dense editor/settings pattern', () => {
    const wrapper = mount(DashboardHomeDemo, {
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

    expect(wrapper.text()).toContain('仪表盘感');
    const links = wrapper.findAll('a').map((item) => item.attributes('href'));
    expect(links).toContain('/demo/dashboard');
    expect(links).toContain('/demo/dashboard/editor');
    expect(links).toContain('/demo/dashboard/settings');
  });
});
