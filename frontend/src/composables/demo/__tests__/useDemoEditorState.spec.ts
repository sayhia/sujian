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
});
