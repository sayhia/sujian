import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import CapsuleHomeDemo from '../CapsuleHomeDemo.vue';

describe('Capsule demo', () => {
  it('renders capsule-priority timeline and lock/unlock emotional states', () => {
    const wrapper = mount(CapsuleHomeDemo, {
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

    expect(wrapper.text()).toContain('情绪化时间胶囊');
    const links = wrapper.findAll('a').map((item) => item.attributes('href'));
    expect(links).toContain('/demo/capsule');
    expect(links).toContain('/demo/capsule/editor');
    expect(links).toContain('/demo/capsule/settings');
  });
});
