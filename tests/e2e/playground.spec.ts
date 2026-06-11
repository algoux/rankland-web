import { expect, test } from '@playwright/test';

test.describe('/playground', () => {
  test('loads Monaco and the default srk preview', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page).toHaveTitle(/Playground.*RankLand/, { timeout: 20_000 });
    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.monaco-editor .minimap').first()).toBeVisible();
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();
  });

  test('shows the welcome message through the shared ranklist modal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('PlaygroundWelcomeMessageRead');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-welcome"]')).toBeVisible();
    await expect(page.getByText('欢迎来到演练场！')).toBeVisible();
    await expect(page.locator('.playground-welcome')).toHaveCount(0);
    await expect(page.locator('.playground-welcome-panel')).toHaveCount(0);
    const sharedModal = page.locator('.srk-general-modal-root').filter({ has: page.locator('[data-id="playground-welcome"]') });
    await expect(sharedModal).toBeVisible();
    const actionLayout = await page.evaluate(() => {
      const content = document.querySelector('[data-id="playground-welcome"]')?.getBoundingClientRect();
      const actions = document.querySelector('.playground-welcome-actions')?.getBoundingClientRect();
      const button = document.querySelector('.playground-welcome-actions button');
      const buttonRect = button?.getBoundingClientRect();
      if (!content || !actions || !button || !buttonRect) {
        return null;
      }
      return {
        actionsRightGap: Math.round(content.right - actions.right),
        buttonClassName: button.getAttribute('class') || '',
        buttonRightGap: Math.round(content.right - buttonRect.right),
        buttonLeftOffset: Math.round(buttonRect.left - content.left),
      };
    });
    expect(actionLayout).not.toBeNull();
    expect(actionLayout!.actionsRightGap).toBe(0);
    expect(actionLayout!.buttonClassName).toContain('h-9');
    expect(actionLayout!.buttonClassName).toContain('px-4');
    expect(actionLayout!.buttonClassName).toContain('py-2');
    expect(actionLayout!.buttonClassName).not.toContain('h-8');
    expect(actionLayout!.buttonClassName).not.toContain('text-xs');
    expect(actionLayout!.buttonRightGap).toBe(0);
    expect(actionLayout!.buttonLeftOffset).toBeGreaterThan(16);
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.locator('[data-id="playground-welcome"]')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('PlaygroundWelcomeMessageRead'))).toBe('true');
  });

  test('supports a full-width resizable split view and persists editor width', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();

    const initialMetrics = await page.evaluate(() => {
      const container = document.querySelector('[data-id="srk-playground-container"]');
      const editor = document.querySelector('[data-id="srk-playground-editor"]');
      const resizer = document.querySelector('[data-id="srk-playground-resizer"]');
      const preview = document.querySelector('.srk-playground-preview');
      if (!container || !editor || !resizer || !preview) {
        return null;
      }
      const containerRect = container.getBoundingClientRect();
      return {
        containerLeft: Math.round(containerRect.left),
        containerWidth: Math.round(containerRect.width),
        viewportWidth: window.innerWidth,
        editorWidth: Math.round(editor.getBoundingClientRect().width),
        resizerWidth: Math.round(resizer.getBoundingClientRect().width),
        resizerLineWidth: getComputedStyle(resizer, '::before').width,
        previewWidth: Math.round(preview.getBoundingClientRect().width),
      };
    });

    expect(initialMetrics).toEqual({
      containerLeft: 0,
      containerWidth: 1280,
      viewportWidth: 1280,
      editorWidth: 500,
      resizerWidth: 7,
      resizerLineWidth: '1px',
      previewWidth: 773,
    });

    const resizerBox = await page.locator('[data-id="srk-playground-resizer"]').boundingBox();
    expect(resizerBox).not.toBeNull();
    await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
    await expect.poll(() => page.evaluate(() => {
      const resizer = document.querySelector('[data-id="srk-playground-resizer"]');
      return resizer ? getComputedStyle(resizer, '::before').width : '';
    })).toBe('3px');
    await page.mouse.down();
    await page.mouse.move(resizerBox!.x + resizerBox!.width / 2 + 120, resizerBox!.y + resizerBox!.height / 2);
    await page.mouse.up();

    await expect.poll(() => page.evaluate(() => {
      const editor = document.querySelector('[data-id="srk-playground-editor"]');
      return Math.round(editor?.getBoundingClientRect().width || 0);
    })).toBe(620);
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('PlaygroundEditorWidth'))).toBe('620');

    await page.reload();
    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => page.evaluate(() => {
      const editor = document.querySelector('[data-id="srk-playground-editor"]');
      return Math.round(editor?.getBoundingClientRect().width || 0);
    })).toBe(620);
  });

  test('keeps the ranklist table header flush with the preview scrollport while scrolling', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();
    await page.addStyleTag({
      content: '.srk-playground-preview { height: 180px !important; }',
    });

    await page.evaluate(() => {
      const preview = document.querySelector('.srk-playground-preview');
      if (preview instanceof HTMLElement) {
        preview.scrollTop = 360;
        preview.scrollLeft = 120;
      }
    });
    await page.waitForTimeout(100);

    const stickyMetrics = await page.evaluate(() => {
      const preview = document.querySelector('.srk-playground-preview')?.getBoundingClientRect();
      const header = document.querySelector('[data-id="playground-preview"] .srk-main thead th')?.getBoundingClientRect();
      if (!preview || !header) {
        return null;
      }
      return {
        gap: Math.round(header.top - preview.top),
        headerTop: Math.round(header.top),
        previewTop: Math.round(preview.top),
      };
    });

    expect(stickyMetrics).not.toBeNull();
    expect(stickyMetrics!.gap).toBeLessThanOrEqual(1);
  });
});
