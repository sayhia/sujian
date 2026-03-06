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
});
