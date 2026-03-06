import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DemoStyleSelector from '../DemoStyleSelector.vue';

describe('DemoStyleSelector', () => {
  it('renders 4 style cards with navigation links', () => {
    const wrapper = mount(DemoStyleSelector, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="String(to)"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('专注极简');
    expect(wrapper.text()).toContain('杂志感');
    expect(wrapper.text()).toContain('仪表盘感');
    expect(wrapper.text()).toContain('情绪化时间胶囊');

    const links = wrapper.findAll('a').map((item) => item.attributes('href'));
    expect(links).toContain('/demo/minimal');
    expect(links).toContain('/demo/editorial');
    expect(links).toContain('/demo/dashboard');
    expect(links).toContain('/demo/capsule');
  });
});
