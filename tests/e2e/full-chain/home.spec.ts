import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function forceSystemDarkMode(page: Page) {
  await page.addInitScript(() => {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: query === '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })) as typeof window.matchMedia;
  });
}

async function expectElementWithinViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
}

async function expectNoHorizontalDocumentOverflow(page: Page) {
  await expect.poll(
    () =>
      page.evaluate(() => {
        const viewportWidth = window.innerWidth;

        return Math.max(
          document.body.scrollWidth - viewportWidth,
          document.documentElement.scrollWidth - viewportWidth,
        );
      }),
    { message: 'horizontal document overflow should settle after async page styles load' },
  ).toBeLessThanOrEqual(1);
}

async function getHomeContentSpacing(page: Page) {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-id="home-content"]');
    const section = document.querySelector<HTMLElement>('[data-id="home-recommendations"]');
    const heading = document.querySelector<HTMLElement>('[data-id="home-recommendations"] > :first-child');
    if (!content || !section || !heading) {
      throw new Error('Missing home content spacing probe elements');
    }

    const contentStyle = getComputedStyle(content);
    const sectionStyle = getComputedStyle(section);
    const headingStyle = getComputedStyle(heading);

    return {
      maxWidth: contentStyle.maxWidth,
      paddingTop: contentStyle.paddingTop,
      paddingRight: contentStyle.paddingRight,
      paddingBottom: contentStyle.paddingBottom,
      paddingLeft: contentStyle.paddingLeft,
      sectionMarginTop: sectionStyle.marginTop,
      headingMarginBottom: headingStyle.marginBottom,
    };
  });
}

async function getHomeLegacyWrapperStructure(page: Page) {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-id="home-content"]');
    const intro = document.querySelector<HTMLElement>('[data-id="home-intro"]');
    if (!content || !intro) {
      throw new Error('Missing home legacy wrapper elements');
    }

    return {
      contentTagName: content.tagName,
      contentClassList: Array.from(content.classList),
      introTagName: intro.tagName,
      introClassList: Array.from(intro.classList),
      introParentDataId: intro.parentElement?.getAttribute('data-id'),
      introFirstChildDataId: (intro.firstElementChild as HTMLElement | null)?.getAttribute('data-id'),
    };
  });
}

async function getHomeLegacyBlockStructure(page: Page) {
  return page.evaluate(() => {
    const blockDataIds = ['home-recommendations', 'home-tools', 'home-resources', 'home-contact', 'home-about'];

    return blockDataIds.map((dataId) => {
      const block = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
      if (!block) {
        throw new Error(`Missing home legacy block element: ${dataId}`);
      }

      return {
        dataId,
        tagName: block.tagName,
        classList: Array.from(block.classList),
        parentDataId: block.parentElement?.getAttribute('data-id'),
      };
    });
  });
}

async function getHomeRecommendationTitlePresentation(page: Page) {
  return page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>('[data-id="home-recommendations"] > :first-child');
    if (!heading) {
      throw new Error('Missing home recommendations heading');
    }

    const style = getComputedStyle(heading);
    return {
      tagName: heading.tagName,
      className: heading.className,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      marginBottom: style.marginBottom,
      text: heading.textContent?.trim(),
    };
  });
}

async function getHomeTotalSrkCountPresentation(page: Page) {
  return page.evaluate(() => {
    const count = document.querySelector<HTMLElement>('[data-id="home-total-srk-count"]');
    if (!count) {
      throw new Error('Missing home total srk count');
    }

    const style = getComputedStyle(count);
    return {
      tagName: count.tagName,
      fontStyle: style.fontStyle,
      fontWeight: style.fontWeight,
      text: count.textContent?.trim(),
    };
  });
}

async function getHomeCardParagraphPresentation(page: Page) {
  return page.evaluate(() => {
    const cardDataIds = [
      'home-recommendation-search',
      'home-recommendation-collection',
      'home-tool-paste-then-ac',
      'home-tool-algo-bootstrap',
    ];

    return cardDataIds.map((dataId) => {
      const paragraph = document.querySelector<HTMLElement>(`[data-id="${dataId}"] .ant-card p`);
      if (!paragraph) {
        throw new Error(`Missing home card paragraph: ${dataId}`);
      }

      const style = getComputedStyle(paragraph);
      return {
        dataId,
        classList: Array.from(paragraph.classList),
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
  });
}

async function getHomeCardColumnPresentation(page: Page) {
  return page.evaluate(() => {
    const cardDataIds = [
      'home-recommendation-search',
      'home-recommendation-collection',
      'home-tool-paste-then-ac',
      'home-tool-algo-bootstrap',
    ];

    return cardDataIds.map((dataId) => {
      const link = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
      const column = link?.closest<HTMLElement>('.ant-col');
      if (!link || !column) {
        throw new Error(`Missing home card column: ${dataId}`);
      }

      const style = getComputedStyle(column);
      return {
        dataId,
        classList: Array.from(column.classList),
        marginBottom: style.marginBottom,
      };
    });
  });
}

async function getHomeCardRowPresentation(page: Page) {
  return page.evaluate(() => {
    const rowDataIds = ['home-recommendations', 'home-tools'];

    return rowDataIds.map((dataId) => {
      const row = document.querySelector<HTMLElement>(`[data-id="${dataId}"] .ant-row`);
      if (!row) {
        throw new Error(`Missing home card row: ${dataId}`);
      }

      const style = getComputedStyle(row);
      return {
        dataId,
        rowGap: style.rowGap,
      };
    });
  });
}

test.describe('/ full-chain route', () => {
  test('renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await forceSystemDarkMode(page);

    const response = await page.goto('/');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    const html = await response!.text();
    expect(html).toContain('欢迎来到 RankLand');
    expect(html).toContain('1234');
    expect(html).toContain('56789');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('https://rl.algoux.org/search?kw={search_term_string}');
    await expect(page).toHaveTitle('RankLand');
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    expect(await getHomeLegacyWrapperStructure(page)).toMatchObject({
      contentTagName: 'MAIN',
      contentClassList: expect.arrayContaining(['normal-content']),
      introTagName: 'DIV',
      introClassList: expect.arrayContaining(['home-intro']),
      introParentDataId: 'home-content',
      introFirstChildDataId: 'home-hero',
    });
    expect(await getHomeLegacyBlockStructure(page)).toEqual([
      {
        dataId: 'home-recommendations',
        tagName: 'DIV',
        classList: expect.arrayContaining(['block', 'home-section']),
        parentDataId: 'home-intro',
      },
      {
        dataId: 'home-tools',
        tagName: 'DIV',
        classList: expect.arrayContaining(['block', 'home-section']),
        parentDataId: 'home-intro',
      },
      {
        dataId: 'home-resources',
        tagName: 'DIV',
        classList: expect.arrayContaining(['block', 'home-section']),
        parentDataId: 'home-intro',
      },
      {
        dataId: 'home-contact',
        tagName: 'DIV',
        classList: expect.arrayContaining(['block', 'home-section']),
        parentDataId: 'home-intro',
      },
      {
        dataId: 'home-about',
        tagName: 'DIV',
        classList: expect.arrayContaining(['block', 'home-section']),
        parentDataId: 'home-intro',
      },
    ]);
    await expect(page.locator('[data-id="home-total-srk-count"]')).toHaveText('1234');
    expect(await getHomeTotalSrkCountPresentation(page)).toMatchObject({
      tagName: 'STRONG',
      fontStyle: 'normal',
      fontWeight: '700',
      text: '1234',
    });
    await expect(page.locator('[data-id="home-total-view-count"]')).toHaveText('56789');
    await expect(page.locator('[data-id="home-recommendation-search"][href="/search"]')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendation-collection"][href="/collection/official"]')).toBeVisible();
    await expect(page.locator('[data-id="home-hero"] p')).toHaveClass(/(^|\s)text-base(\s|$)/);
    await expect(page.locator('[data-id="home-hero"] p')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
    await expect(page.locator('[data-id="home-resources"] li').first()).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.85)',
    );
    await expect(page.locator('[data-id="home-about"] .home-separator')).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.85)',
    );
    await expect(page.locator('[data-id="home-recommendations"] .ant-row')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendations"] .ant-col')).toHaveCount(2);
    await expect(page.locator('[data-id="home-recommendations"] .ant-card-hoverable')).toHaveCount(2);
    expect(await getHomeRecommendationTitlePresentation(page)).toMatchObject({
      tagName: 'H1',
      className: 'block-title',
      fontSize: '32px',
      fontWeight: '500',
      marginBottom: '20px',
      text: '为你推荐',
    });
    const recommendationCard = page.locator('[data-id="home-recommendation-search"] .home-card.ant-card');
    await expect(recommendationCard).toHaveCSS('background-color', 'rgb(20, 20, 20)');
    await expect(recommendationCard).toHaveCSS('border-top-color', 'rgb(48, 48, 48)');
    await expect(recommendationCard).toHaveCSS('border-radius', '2px');
    await expect(recommendationCard).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
    await expect(recommendationCard.locator('h2')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
    await expect(recommendationCard.locator('p')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
    await expect(page.locator('[data-id="home-recommendation-search"] .ant-card h2')).toContainText('探索');
    await expect(page.locator('[data-id="home-recommendation-search"] .home-card-title')).toHaveCSS('column-gap', '0px');
    await expect(page.locator('[data-id="home-recommendation-search"] .anticon-unordered-list')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendation-search"] .anticon-unordered-list')).toHaveCSS('margin-right', '12px');
    await expect(page.locator('[data-id="home-recommendation-collection"] .ant-card h2')).toContainText('榜单合集');
    await expect(page.locator('[data-id="home-recommendation-collection"] .anticon-trophy')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendation-collection"] .anticon-trophy')).toHaveCSS('margin-right', '12px');
    await expect(page.locator('[data-id="home-tools"] .ant-row')).toBeVisible();
    await expect(page.locator('[data-id="home-tools"] .ant-col')).toHaveCount(2);
    await expect(page.locator('[data-id="home-tools"] .ant-card-hoverable')).toHaveCount(2);
    expect(await getHomeCardRowPresentation(page)).toEqual([
      {
        dataId: 'home-recommendations',
        rowGap: 'normal',
      },
      {
        dataId: 'home-tools',
        rowGap: 'normal',
      },
    ]);
    expect(await getHomeCardColumnPresentation(page)).toEqual([
      {
        dataId: 'home-recommendation-search',
        classList: expect.arrayContaining(['mb-4']),
        marginBottom: '16px',
      },
      {
        dataId: 'home-recommendation-collection',
        classList: expect.arrayContaining(['mb-4']),
        marginBottom: '16px',
      },
      {
        dataId: 'home-tool-paste-then-ac',
        classList: expect.arrayContaining(['mb-4']),
        marginBottom: '16px',
      },
      {
        dataId: 'home-tool-algo-bootstrap',
        classList: expect.arrayContaining(['mb-4']),
        marginBottom: '16px',
      },
    ]);
    expect(await getHomeCardParagraphPresentation(page)).toEqual([
      {
        dataId: 'home-recommendation-search',
        classList: expect.arrayContaining(['mt-4', 'mb-0']),
        marginTop: '16px',
        marginBottom: '0px',
      },
      {
        dataId: 'home-recommendation-collection',
        classList: expect.arrayContaining(['mt-4', 'mb-0']),
        marginTop: '16px',
        marginBottom: '0px',
      },
      {
        dataId: 'home-tool-paste-then-ac',
        classList: expect.arrayContaining(['mt-4', 'mb-0']),
        marginTop: '16px',
        marginBottom: '0px',
      },
      {
        dataId: 'home-tool-algo-bootstrap',
        classList: expect.arrayContaining(['mt-4', 'mb-0']),
        marginTop: '16px',
        marginBottom: '0px',
      },
    ]);
    await expect(page.locator('[data-id="home-tool-paste-then-ac"][href="https://paste.then.ac/?utm_source=rankland"]')).toBeVisible();
    await expect(page.locator('[data-id="home-tool-paste-then-ac"] img[alt="paste.then.ac logo"]')).toHaveCSS('width', '24px');
    await expect(page.locator('[data-id="home-tool-paste-then-ac"] img[alt="paste.then.ac logo"]')).toHaveCSS('height', '24px');
    await expect(page.locator('[data-id="home-tool-paste-then-ac"] img[alt="paste.then.ac logo"]')).toHaveCSS('padding', '2px');
    await expect(page.locator('[data-id="home-tool-paste-then-ac"] img[alt="paste.then.ac logo"]')).toHaveCSS('margin-right', '12px');
    await expect(page.locator('[data-id="home-tool-algo-bootstrap"][href="https://ab.algoux.cn/?utm_source=rankland"]')).toBeVisible();
    const legacyNoRelExternalLinks = [
      'https://paste.then.ac/?utm_source=rankland',
      'https://ab.algoux.cn/?utm_source=rankland',
      'https://srk.algoux.org/?utm_source=rankland',
      'https://github.com/algoux/srk-collection',
      'https://github.com/algoux/standard-ranklist-renderer-component',
      'https://github.com/algoux/standard-ranklist-utils',
      'https://github.com/algoux/standard-ranklist-convert-to',
      'https://github.com/algoux',
      'https://algoux.org',
      'https://servicestatus.algoux.org',
    ];
    for (const href of legacyNoRelExternalLinks) {
      const link = page.locator(`[data-id="home-content"] a[href="${href}"]`).first();
      await expect(link).toHaveAttribute('target', '_blank');
      expect(await link.getAttribute('rel')).toBeNull();
    }
    await expect(page.locator('[data-id="home-hydrated"]')).toHaveText('hydrated');
    const homeContactTrigger = page.locator('[data-id="home-contact"] [data-id="contact-us-trigger"]');
    await expect(homeContactTrigger).toHaveText('与我们联系');
    await expect(homeContactTrigger).toHaveJSProperty('tagName', 'A');
    expect(await homeContactTrigger.getAttribute('href')).toBeNull();
    await page.locator('[data-id="home-contact"] [data-id="contact-us-trigger"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toBeVisible();
    await expect(page.locator('.contact-us-modal-wrap .ant-modal-content')).toHaveCSS(
      'background-color',
      'rgb(31, 31, 31)',
    );
    await expect(page.locator('.contact-us-modal-wrap .ant-modal-content')).toHaveCSS('border-radius', '2px');
    await expect(page.locator('.contact-us-modal-wrap .ant-modal-title')).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.85)',
    );
    await expect(page.locator('.contact-us-modal-wrap .ant-modal-close')).toHaveCSS(
      'color',
      'rgba(255, 255, 255, 0.45)',
    );
    await expect(page.locator('.contact-us-modal-wrap .ant-modal-body')).toHaveCSS('padding', '24px');
    await expect(page.locator('[data-id="contact-us-email"][href="mailto:algoux.org@gmail.com"]')).toHaveText(
      'algoux.org@gmail.com',
    );
    await expect(page.locator('[data-id="contact-us-qq-image"]')).toBeVisible();
    await expect(page.locator('[data-id="contact-us-qq-image"]')).toHaveClass(/(^|\s)w-full(\s|$)/);
    await page.locator('[data-id="contact-us-close"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toHaveCount(0);

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const statisticsRequests = requests.filter((requestRecord) => requestRecord.path === '/statistics');

    expect(statisticsRequests).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/listall')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/test-key')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(false);
  });

  test('keeps the home page layout within desktop and mobile viewport bounds', async ({ page, request }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expect(page.locator('[data-id="home-hero"]')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendations"]')).toBeVisible();
    await expect.poll(() => getHomeContentSpacing(page), {
      message: 'home desktop content spacing should settle after async page styles load',
    }).toMatchObject({
      maxWidth: 'none',
      paddingTop: '32px',
      paddingRight: '50px',
      paddingBottom: '32px',
      paddingLeft: '50px',
      sectionMarginTop: '40px',
      headingMarginBottom: '20px',
    });
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-search"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-collection"]'), page);
    await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expect.poll(() => getHomeContentSpacing(page), {
      message: 'home mobile content spacing should settle after async page styles load',
    }).toMatchObject({
      maxWidth: 'none',
      paddingTop: '32px',
      paddingRight: '20px',
      paddingBottom: '32px',
      paddingLeft: '20px',
      sectionMarginTop: '40px',
      headingMarginBottom: '20px',
    });
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="home-hero"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-search"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-collection"]'), page);
    await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true });
  });

  test('renders legacy statistics fallback for a partial upstream response without hydration drift', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await request.post(`${mockBaseURL}/__use-partial-statistics`);

    const response = await page.goto('/');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    const html = await response!.text();
    expect(html).toMatch(/<strong data-id="home-total-srk-count"[^>]*>-<\/strong>/);
    expect(html).toMatch(/<span data-id="home-total-view-count"[^>]*>-<\/span>/);
    await expect(page.locator('[data-id="home-total-srk-count"]')).toHaveText('-');
    await expect(page.locator('[data-id="home-total-view-count"]')).toHaveText('-');
    await expect(page.locator('[data-id="home-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    expect(requests.filter((requestRecord) => requestRecord.path === '/statistics')).toHaveLength(1);
  });
});
