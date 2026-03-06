import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import MinimalHomeDemo from '../MinimalHomeDemo.vue';

describe('Minimal demo', () => {
  it('renders minimal style core layout and can navigate home/editor/settings', () => {
    const wrapper = mount(MinimalHomeDemo, {
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

    expect(wrapper.text()).toContain('专注极简');
    const links = wrapper.findAll('a').map((item) => item.attributes('href'));
    expect(links).toContain('/demo/minimal');
    expect(links).toContain('/demo/minimal/editor');
    expect(links).toContain('/demo/minimal/settings');
  });
});
