import { describe, expect, it } from 'vitest';
import router from '../index';

describe('demo style routes', () => {
  it('contains all demo style route groups', () => {
    const paths = router.getRoutes().map((route) => route.path);

    expect(paths).toContain('/demo/styles');
    expect(paths).toContain('/demo/minimal');
    expect(paths).toContain('/demo/editorial');
    expect(paths).toContain('/demo/dashboard');
    expect(paths).toContain('/demo/capsule');
  });

  it('maps default app routes to editorial components', () => {
    const expectedDefaults = [
      '/',
      '/notes/new',
      '/notes/new/article',
      '/notes/:id/edit',
      '/settings',
    ];

    for (const path of expectedDefaults) {
      const route = router.getRoutes().find((item) => item.path === path);
      expect(route, `${path} should exist`).toBeDefined();

      const componentLoader = route?.components?.default as (() => Promise<unknown>) | undefined;
      expect(componentLoader, `${path} should use lazy component loader`).toBeTypeOf('function');
      expect(String(componentLoader)).toContain('/views/demo/editorial/');
      expect(route?.meta.appStyle).toBe('editorial');
    }
  });
});
