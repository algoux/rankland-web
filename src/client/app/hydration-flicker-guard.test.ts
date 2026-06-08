import { describe, expect, it, vi } from 'vitest';
import {
  revealBodyAfterInitialHydration,
  shouldDeferInitialHydrationRender,
  waitForInitialHydrationFrame,
} from './hydration-flicker-guard';

describe('hydration flicker guard', () => {
  it('does not require a browser window for optional-frame helpers', async () => {
    await expect(waitForInitialHydrationFrame()).resolves.toBeUndefined();
    await expect(revealBodyAfterInitialHydration()).resolves.toBeUndefined();
    expect(shouldDeferInitialHydrationRender()).toBe(false);
  });

  it('reveals body after animation frames when a window is provided', async () => {
    const body = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    };
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const win = {
      document: {
        body,
      },
      requestAnimationFrame,
    } as unknown as Window;

    await revealBodyAfterInitialHydration(win);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    expect(body.style.opacity).toBe('1');
    expect(body.dataset.ranklandHydrated).toBe('true');
  });
});
