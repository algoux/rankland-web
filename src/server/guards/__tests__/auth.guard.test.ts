import 'reflect-metadata';
import AuthGuard, { hasManagementToken } from '../auth.guard';

describe('management token authorization', () => {
  beforeEach(() => vi.stubEnv('AUTH_TOKEN', 'management-test-token'));
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ['management-test-token', true],
    [undefined, false],
    ['', false],
    ['wrong-token', false],
    [' management-test-token ', false],
    [['management-test-token'], false],
    [['management-test-token', 'management-test-token'], false],
  ])('uses the same exact token rules for guarded and conditional access: %j', async (token, expected) => {
    const ctx = { headers: { 'x-token': token } } as any;
    expect(hasManagementToken(ctx)).toBe(expected);
    await expect(new AuthGuard().canPass(ctx)).resolves.toBe(expected);
  });

  it('fails closed when management auth is unset or empty', async () => {
    for (const configured of [undefined, '']) {
      if (configured === undefined) delete process.env.AUTH_TOKEN;
      else process.env.AUTH_TOKEN = configured;
      for (const supplied of [undefined, '', 'management-test-token']) {
        const ctx = { headers: { 'x-token': supplied } } as any;
        expect(hasManagementToken(ctx)).toBe(false);
        await expect(new AuthGuard().canPass(ctx)).resolves.toBe(false);
      }
    }
  });
});
