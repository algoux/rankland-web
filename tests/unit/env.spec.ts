import { describe, expect, it } from 'vitest';

describe('migration test harness', () => {
  it('runs TypeScript tests with project aliases available', async () => {
    const mod = await import('@common/enums/err-code.enum');
    expect(mod.ErrCode).toBeDefined();
  });
});
