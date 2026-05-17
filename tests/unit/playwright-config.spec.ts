import { describe, expect, it } from 'vitest';
import playwrightConfig from '../../playwright.config';

describe('playwright config', () => {
  it('starts the local Vite server through corepack pnpm', () => {
    expect(playwrightConfig.webServer).toMatchObject({
      command: 'corepack pnpm exec vite --host 127.0.0.1 --port 3000',
    });
  });
});
