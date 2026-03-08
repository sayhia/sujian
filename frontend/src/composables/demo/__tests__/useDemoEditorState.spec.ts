import { describe, expect, it, vi } from 'vitest';
import { useDemoEditorState } from '../useDemoEditorState';

describe('useDemoEditorState', () => {
  it('provides consistent editor save/create flow wrappers', async () => {
    const created = { id: 9, title: 'Draft', content: 'Body', tags: ['x'], type: 'quick' };
    const store = {
      createNote: vi.fn().mockResolvedValue(created),
      updateNote: vi.fn().mockResolvedValue({ ...created, title: 'Updated' }),
    } as any;

    const createVm = useDemoEditorState(store);
    createVm.form.value.title = 'Draft';
    createVm.form.value.content = 'Body';
    const createResult = await createVm.save();
    expect(createResult?.id).toBe(9);
    expect(store.createNote).toHaveBeenCalled();

    const editVm = useDemoEditorState(store, { id: 9, title: 'Draft', content: 'Body', tags: ['x'], type: 'quick' } as any);
    editVm.form.value.title = 'Updated';
    const editResult = await editVm.save();
    expect(editResult?.title).toBe('Updated');
    expect(store.updateNote).toHaveBeenCalledWith(9, expect.objectContaining({ title: 'Updated' }));
  });

  it('supports create/new article/edit modes with route-driven state', async () => {
    const created = { id: 18, title: 'Draft', content: 'Body', tags: [], type: 'quick' };
    const updated = { ...created, title: 'Edited' };
    const store = {
      createNote: vi.fn().mockResolvedValue(created),
      updateNote: vi.fn().mockResolvedValue(updated),
    } as any;

    const createVm = useDemoEditorState(store, undefined, 'create');
    createVm.form.value.title = 'Create Mode';
    await createVm.save();
    expect(store.createNote).toHaveBeenCalledWith(expect.objectContaining({ type: 'quick' }));

    const articleVm = useDemoEditorState(store, undefined, 'article');
    expect(articleVm.form.value.type).toBe('article');
    articleVm.form.value.title = 'Article Mode';
    await articleVm.save();
    expect(store.createNote).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'article' }));

    const editVm = useDemoEditorState(store, { id: 18, title: 'Draft', content: 'Body', tags: [], type: 'quick' } as any, 'edit');
    editVm.form.value.title = 'Edited';
    await editVm.save();
    expect(store.updateNote).toHaveBeenCalledWith(18, expect.objectContaining({ title: 'Edited' }));
  });
});
