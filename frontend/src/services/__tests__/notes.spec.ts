import { describe, it, expect } from 'vitest';
import { mapBackendNote } from '../notes';

describe('mapBackendNote', () => {
  it('normalizes a backend note into frontend shape', () => {
    const note = mapBackendNote({
      id: 1,
      title: '标题',
      content: '内容',
      tags: ['a', 'b'],
      type: 'article',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-02T00:00:00Z',
      is_archived: true,
      is_deleted: false,
    });
    expect(note).toEqual({
      id: 1,
      title: '标题',
      content: '内容',
      tags: ['a', 'b'],
      type: 'article',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-02T00:00:00Z',
      is_archived: true,
      is_deleted: false,
    });
  });

  it('fills defaults for missing fields', () => {
    const note = mapBackendNote({ id: 2, title: undefined, tags: undefined });
    expect(note.title).toBe('');
    expect(note.tags).toEqual([]);
    expect(note.type).toBe('quick');
    expect(note.is_archived).toBe(false);
    expect(new Date(note.created_at).getTime()).not.toBeNaN();
  });

  it('converts Date objects to ISO strings', () => {
    const d = new Date('2026-08-03T12:00:00Z');
    const note = mapBackendNote({ id: 3, created_at: d, updated_at: d });
    expect(note.created_at).toBe('2026-08-03T12:00:00.000Z');
  });
});
