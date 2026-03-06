import { vi } from 'vitest';

vi.mock('@wailsio/runtime', () => {
  const create = {
    Nullable: (factory: (value: unknown) => unknown) => (value: unknown) => {
      if (value === null || value === undefined) return null;
      return factory(value);
    },
    Array: (factory: (value: unknown) => unknown) => (value: unknown[]) => (value || []).map(factory),
    Any: (value: unknown) => value,
  };

  return {
    Call: {
      ByID: vi.fn(() => Promise.resolve(null)),
    },
    CancellablePromise: Promise,
    Create: create,
  };
});
