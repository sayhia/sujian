import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import EditorialHomeDemo from '../EditorialHomeDemo.vue';

describe('Editorial demo', () => {
  it('renders editorial chapter-like layout and navigation triad', () => {
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
  });

  it('renders chapter directory, reading stream, and marginalia zones', () => {
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

    expect(wrapper.find('[data-zone="directory"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="reading-stream"]').exists()).toBe(true);
    expect(wrapper.find('[data-zone="marginalia"]').exists()).toBe(true);

    const links = wrapper.findAll('a').map((item) => item.attributes('href'));
    expect(links).toContain('/');
    expect(links).toContain('/notes/new');
    expect(links).toContain('/settings');

    window.location.hash = '';
  });

  it('applies chinese-first typographic classes and constrained reading widths', () => {
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

    expect(wrapper.find('main.editorial-shell.editorial-chinese-first').exists()).toBe(true);
    expect(wrapper.find('.editorial-reading-measure').exists()).toBe(true);
    expect(wrapper.find('.editorial-serif-heading').exists()).toBe(true);

    window.location.hash = '';
  });
});
