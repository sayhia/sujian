import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import EditorialHomeDemo from '../EditorialHomeDemo.vue';

describe('Editorial demo', () => {
  it('renders editorial chapter-like layout and navigation triad', () => {
    window.location.hash = '#/demo/editorial';
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

    expect(wrapper.text()).toContain('杂志感');
    const links = wrapper.findAll('a').map((item) => item.attributes('href'));
    expect(links).toContain('/demo/editorial');
    expect(links).toContain('/demo/editorial/editor');
    expect(links).toContain('/demo/editorial/settings');

    window.location.hash = '';
  });
});
