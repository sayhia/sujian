import { mount } from '@vue/test-utils';
import { useNoteStore } from '../../../../stores/noteStore';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import EditorialHomeDemo from '../EditorialHomeDemo.vue';
import EditorialEditorDemo from '../EditorialEditorDemo.vue';

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

  it('filters reading stream by keyword/tag/time and preserves semantic zones', async () => {
    window.location.hash = '#/';
    const pinia = createPinia();
    const store = useNoteStore(pinia);
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    store.notes = [
      { id: 1, title: '今日诗稿', content: '清晨记录', tags: ['poem'], type: 'quick', created_at: now, updated_at: now, is_archived: false, is_deleted: false },
      { id: 2, title: '旧闻摘录', content: '历史片段', tags: ['history'], type: 'quick', created_at: old, updated_at: old, is_archived: false, is_deleted: false },
    ] as any;

    const wrapper = mount(EditorialHomeDemo, {
      global: {
        plugins: [pinia],
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

    await wrapper.find('[data-testid="search-input"]').setValue('今日');
    expect(wrapper.text()).toContain('今日诗稿');
    expect(wrapper.text()).not.toContain('旧闻摘录');

    await wrapper.find('[data-testid="search-input"]').setValue('');
    await wrapper.find('[data-testid="tag-poem"]').trigger('click');
    expect(wrapper.text()).toContain('今日诗稿');
    expect(wrapper.text()).not.toContain('旧闻摘录');

    await wrapper.find('[data-testid="tag-poem"]').trigger('click');
    await wrapper.find('[data-testid="time-filter"]').setValue('month');
    expect(wrapper.text()).toContain('今日诗稿');
    expect(wrapper.text()).not.toContain('旧闻摘录');

    window.location.hash = '';
  });

  it('shows saving/saved/error inline feedback without clearing form on failure', async () => {
    const pinia = createPinia();
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/notes/new', component: EditorialEditorDemo }],
    });
    await router.push('/notes/new');
    await router.isReady();
    const store = useNoteStore(pinia);
    store.createNote = vi.fn().mockRejectedValue(new Error('save failed')) as any;

    const wrapper = mount(EditorialEditorDemo, {
      global: {
        plugins: [pinia, router],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="String(to)"><slot /></a>',
          },
        },
      },
    });

    const titleInput = wrapper.find('input');
    await titleInput.setValue('不会丢失的标题');
    await wrapper.find('button.editorial-btn').trigger('click');
    await Promise.resolve();

    expect(wrapper.find('[data-testid="save-state"]').text()).toContain('保存失败');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('不会丢失的标题');
  });
});
