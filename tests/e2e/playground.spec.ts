import type { Page } from '@playwright/test';
import { expect, test } from './test';

const MOCK_API_PORT = Number(process.env.E2E_MOCK_API_PORT || 4322);
const MOCK_API_BASE = `http://127.0.0.1:${MOCK_API_PORT}`;

function createDroppedRanklistText() {
  return JSON.stringify({
    type: 'general',
    version: '0.3.12',
    contest: {
      title: 'Dropped SRK Fixture',
      startAt: '2024-04-01T10:00:00+08:00',
      duration: [5, 'h'],
      frozenDuration: [1, 'h'],
    },
    problems: [
      {
        title: 'Problem A',
        alias: 'A',
      },
    ],
    series: [
      {
        title: 'Rank',
        rule: {
          preset: 'ICPC',
          options: {},
        },
      },
    ],
    rows: [
      {
        user: {
          id: 'dropped-team',
          name: 'Dropped Team',
          organization: 'Dropped University',
          official: true,
        },
        score: { value: 1, time: [42, 'min'] },
        statuses: [
          { result: 'AC', time: [42, 'min'], tries: 1 },
        ],
      },
    ],
    sorter: {
      algorithm: 'ICPC',
      config: {},
    },
  });
}

function createLargeLineRanklistText(title: string, rowCount: number, paddingLineCount: number) {
  const ranklist = JSON.stringify({
    type: 'general',
    version: '0.3.12',
    contest: {
      title,
      startAt: '2026-06-01T09:00:00+08:00',
      duration: [5, 'h'],
      frozenDuration: [1, 'h'],
    },
    problems: [
      {
        title: 'Problem A',
        alias: 'A',
      },
    ],
    series: [
      {
        title: 'Rank',
        rule: {
          preset: 'ICPC',
          options: {},
        },
      },
    ],
    rows: new Array(rowCount).fill(null).map((_, index) => ({
      user: {
        id: `large-team-${index}`,
        name: `Large Team ${index}`,
        organization: 'Large Paste University',
        official: true,
      },
      score: { value: index % 5, time: [42 + index, 'min'] },
      statuses: [
        { result: index % 2 === 0 ? 'AC' : 'RJ', time: [42 + index, 'min'], tries: 1 },
      ],
    })),
    sorter: {
      algorithm: 'ICPC',
      config: {},
    },
  }, null, 2);
  const body = ranklist.slice(0, -2);
  const padding = new Array(paddingLineCount)
    .fill(null)
    .map((_, index) => `    "k${index}": ${index}`)
    .join(',\n');
  return `${body},\n  "_pastePadding": {\n${padding}\n  }\n}`;
}

async function pasteTextIntoFocusedEditor(page: Page, text: string) {
  await page.evaluate((value) => navigator.clipboard.writeText(value), text);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+V');
}

async function focusPlaygroundEditor(page: Page) {
  await page.locator('[data-id="srk-playground-editor"]').click({
    position: {
      x: 120,
      y: 120,
    },
  });
}

async function dispatchFileDragEvent(page: Page, type: string, text: string, fileName = 'ranklist.srk.json', fileType = 'application/json') {
  await page.evaluate(({ eventType, fileText, droppedFileName, droppedFileType }) => {
    const target = document.querySelector('[data-id="srk-playground-container"]');
    if (!target) {
      throw new Error('Playground container not found');
    }
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([fileText], droppedFileName, { type: droppedFileType }));
    target.dispatchEvent(new DragEvent(eventType, {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    }));
  }, { eventType: type, fileText: text, droppedFileName: fileName, droppedFileType: fileType });
}

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

  test('loads initial editor content from the src URL and passes id to the preview ranklist', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    const src = `${MOCK_API_BASE}/ranking/file?id=file-localized-v2`;
    await page.goto(`/playground?src=${encodeURIComponent(src)}&id=localized-key-v2`);

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="1"][data-ranklist-id="localized-key-v2"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Localized Contest' })).toBeVisible();
  });

  test('falls back to the default editor content when the src URL fails', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    const src = `${MOCK_API_BASE}/ranking/file?id=missing-file`;
    await page.route(src, (route) => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'missing file' }),
    }));
    await page.goto(`/playground?src=${encodeURIComponent(src)}&id=missing-rank`);

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"][data-ranklist-id="missing-rank"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ACM-ICPC World Finals 2018 (Excerpt Demo)' })).toBeVisible();
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(errorToast).toContainText('无法加载 srk 文件，已回退到默认示例');
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

  test('uses a full-width editor pane on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 428, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.setItem('PlaygroundEditorWidth', '500');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();

    const layout = await page.evaluate(() => {
      const container = document.querySelector('[data-id="srk-playground-container"]');
      const editor = document.querySelector('[data-id="srk-playground-editor"]');
      const resizer = document.querySelector('[data-id="srk-playground-resizer"]');
      const preview = document.querySelector('.srk-playground-preview');
      if (!container || !editor || !resizer || !preview) {
        return null;
      }
      const containerRect = container.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      const resizerRect = resizer.getBoundingClientRect();
      const previewRect = preview.getBoundingClientRect();
      return {
        containerRight: Math.round(containerRect.right),
        containerWidth: Math.round(containerRect.width),
        editorRight: Math.round(editorRect.right),
        editorWidth: Math.round(editorRect.width),
        previewTop: Math.round(previewRect.top),
        resizerWidth: Math.round(resizerRect.width),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout!.containerWidth).toBe(428);
    expect(layout!.editorWidth).toBe(layout!.containerWidth);
    expect(layout!.editorRight).toBe(layout!.containerRight);
    expect(layout!.resizerWidth).toBe(layout!.containerWidth);
    expect(layout!.previewTop).toBeGreaterThan(0);
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

  test('keeps the ranklist preview flush with the editor edge', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();

    const previewAlignment = await page.evaluate(() => {
      const preview = document.querySelector('.srk-playground-preview')?.getBoundingClientRect();
      const table = document.querySelector('[data-id="playground-preview"] .srk-main table')?.getBoundingClientRect();
      if (!preview || !table) {
        return null;
      }
      return {
        gap: Math.round(table.left - preview.left),
        previewLeft: Math.round(preview.left),
        tableLeft: Math.round(table.left),
      };
    });

    expect(previewAlignment).not.toBeNull();
    expect(previewAlignment!.gap).toBeLessThanOrEqual(1);
  });

  test('imports a dragged srk json file and shows a drop overlay', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();

    const fileText = createDroppedRanklistText();
    await dispatchFileDragEvent(page, 'dragenter', fileText);
    await expect(page.locator('[data-id="playground-drop-overlay"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-drop-overlay"]')).toContainText('拖放');

    await dispatchFileDragEvent(page, 'dragover', fileText);
    await dispatchFileDragEvent(page, 'drop', fileText);

    await expect(page.locator('[data-id="playground-drop-overlay"]')).toBeHidden();
    await expect(page.locator('[data-id="playground-preview"][data-row-count="1"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dropped SRK Fixture' })).toBeVisible();
  });

  test('keeps the editor responsive and auto-renders when replacing one large paste with another', async ({ page }) => {
    test.setTimeout(120_000);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();

    const firstLargeText = createLargeLineRanklistText('Large Paste One', 20, 35_050);
    const secondLargeText = createLargeLineRanklistText('Large Paste Two', 21, 35_075);
    expect(firstLargeText.split('\n').length).toBeGreaterThan(35_000);
    expect(secondLargeText.split('\n').length).toBeGreaterThan(35_000);

    await dispatchFileDragEvent(page, 'drop', firstLargeText);
    await expect(page.locator('[data-id="playground-preview"][data-row-count="20"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Large Paste One' })).toBeVisible();

    await focusPlaygroundEditor(page);
    await pasteTextIntoFocusedEditor(page, secondLargeText);
    await expect(page.locator('[data-id="playground-preview-deferred"]')).toHaveCount(0);
    await expect(page.locator('[data-id="playground-preview"][data-row-count="21"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Large Paste Two' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Large Paste One' })).toHaveCount(0);
  });

  test('rejects a dragged non-json file with an error toast', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/playground');

    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();

    await dispatchFileDragEvent(page, 'dragenter', 'not srk json', 'ranklist.txt', 'text/plain');
    await expect(page.locator('[data-id="playground-drop-overlay"]')).toBeVisible();
    await dispatchFileDragEvent(page, 'drop', 'not srk json', 'ranklist.txt', 'text/plain');

    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(errorToast).toContainText('不是有效的 srk 文件');
    const errorIcon = errorToast.locator('svg.rankland-sonner-error-icon');
    await expect(errorIcon).toHaveClass(/rankland-sonner-status-icon/);
    await expect(errorIcon).toHaveCSS('color', 'rgb(239, 68, 68)');
    await expect(page.locator('[data-id="playground-drop-overlay"]')).toBeHidden();
    await expect(page.locator('[data-id="playground-preview"][data-row-count="3"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dropped SRK Fixture' })).toHaveCount(0);
  });
});
