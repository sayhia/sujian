import { vi } from 'vitest';

// jsdom 缺少 ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// mock @wailsio/runtime 绑定调用层
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

// jsdom 无 matchMedia（settings store 依赖）
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (() =>
    ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
}
