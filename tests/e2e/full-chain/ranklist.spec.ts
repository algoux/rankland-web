import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFile } from 'fs/promises';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function stubClipboard(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText = text;
        },
      },
    });
  });
}

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

async function forceSystemLightMode(page: Page) {
  await page.addInitScript(() => {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: false,
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
  const overflow = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

async function expectHoverDropdownOpensAndCloses(page: Page, triggerTestId: string, itemTestId: string) {
  const trigger = page.locator(`[data-id="${triggerTestId}"]`);
  const item = page.locator(`[data-id="${itemTestId}"]`);

  await expect(item).toBeHidden();
  await trigger.hover();
  await expect(item).toBeVisible();
  await page.mouse.move(10, 10);
  await expect(item).toBeHidden();
}

async function expectNotificationMessage(page: Page, message: string) {
  await expect(page.locator('.ant-notification-notice-message', { hasText: message })).toBeVisible();
}

async function getHeaderActionTriggerStyle(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      paddingLeft: style.paddingLeft,
      borderLeftWidth: style.borderLeftWidth,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderRadius: style.borderRadius,
      color: style.color,
    };
  });
}

async function getHeaderActionGapStyle(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const actions = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-actions"]');
    if (!meta || !actions) {
      throw new Error('Missing ranklist header meta/action elements');
    }
    const metaStyle = window.getComputedStyle(meta);
    const actionsStyle = window.getComputedStyle(actions);
    return {
      metaColumnGap: metaStyle.columnGap,
      metaRowGap: metaStyle.rowGap,
      actionsColumnGap: actionsStyle.columnGap,
      actionsRowGap: actionsStyle.rowGap,
    };
  });
}

async function getHeaderActionDisplayStyle(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const actions = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-actions"]');
    if (!meta || !actions) {
      throw new Error('Missing ranklist header meta/action elements');
    }
    const metaStyle = window.getComputedStyle(meta);
    const actionsStyle = window.getComputedStyle(actions);
    return {
      metaDisplay: metaStyle.display,
      actionsDisplay: actionsStyle.display,
    };
  });
}

async function getHeaderMetaBlockSpacing(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    if (!meta || !contributors || !refLinks) {
      throw new Error('Missing ranklist header meta block');
    }
    const metaStyle = window.getComputedStyle(meta);
    const contributorsStyle = window.getComputedStyle(contributors);
    const refLinksStyle = window.getComputedStyle(refLinks);
    return {
      metaMarginBottom: metaStyle.marginBottom,
      contributorsMarginTop: contributorsStyle.marginTop,
      contributorsMarginBottom: contributorsStyle.marginBottom,
      refLinksMarginTop: refLinksStyle.marginTop,
    };
  });
}

async function getHeaderMetaDomParity(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    if (!meta || !contributors || !refLinks || !time) {
      throw new Error('Missing ranklist header meta DOM targets');
    }

    return {
      contributorsParentDataId: contributors.parentElement?.getAttribute('data-id') || '',
      refLinksParentDataId: refLinks.parentElement?.getAttribute('data-id') || '',
      timeParentDataId: time.parentElement?.getAttribute('data-id') || '',
    };
  });
}

async function getRanklistHeaderTitlePresentation(page: Page) {
  return page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-title"]');
    if (!title) {
      throw new Error('Missing ranklist header title');
    }
    const style = window.getComputedStyle(title);
    return {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      marginBottom: style.marginBottom,
    };
  });
}

async function getHeaderUtilityClasses(page: Page) {
  return page.evaluate(() => {
    const banner = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-banner"]');
    const bannerWrap = banner?.parentElement;
    const title = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-title"]');
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    if (!banner || !bannerWrap || !title || !meta || !contributors || !refLinks || !time) {
      throw new Error('Missing ranklist header utility class targets');
    }
    const bannerWrapStyle = window.getComputedStyle(bannerWrap);
    const bannerStyle = window.getComputedStyle(banner);
    return {
      bannerWrapClasses: Array.from(bannerWrap.classList),
      bannerClasses: Array.from(banner.classList),
      bannerInlineStyle: banner.getAttribute('style') || '',
      bannerWrapAlignItems: bannerWrapStyle.alignItems,
      bannerWrapDisplay: bannerWrapStyle.display,
      bannerWrapJustifyContent: bannerWrapStyle.justifyContent,
      bannerWrapMarginBottom: bannerWrapStyle.marginBottom,
      bannerMarginBottom: bannerStyle.marginBottom,
      titleClasses: Array.from(title.classList),
      metaClasses: Array.from(meta.classList),
      contributorsClasses: Array.from(contributors.classList),
      refLinksClasses: Array.from(refLinks.classList),
      timeClasses: Array.from(time.classList),
    };
  });
}

async function getRanklistHeaderTextSizes(page: Page) {
  return page.evaluate(() => {
    const viewCount = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-view-count"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    if (!viewCount || !contributors || !refLinks || !time) {
      throw new Error('Missing ranklist header text-size target');
    }
    return {
      viewCountFontSize: window.getComputedStyle(viewCount).fontSize,
      contributorsFontSize: window.getComputedStyle(contributors).fontSize,
      refLinksFontSize: window.getComputedStyle(refLinks).fontSize,
      timeFontSize: window.getComputedStyle(time).fontSize,
    };
  });
}

async function getRanklistLinkColors(page: Page) {
  return page.evaluate(() => {
    const viewCount = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-view-count"]');
    const refLink = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"] a');
    const refLinkLine = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    const extraRefLinkTrigger = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-ref-link-extra-action"]',
    );
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    const footerContactTrigger = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-footer"] [data-id="contact-us-trigger"]',
    );
    if (!viewCount || !refLink || !refLinkLine || !extraRefLinkTrigger || !time || !footerContactTrigger) {
      throw new Error('Missing ranklist link color target');
    }
    return {
      viewCountColor: window.getComputedStyle(viewCount).color,
      refLinkColor: window.getComputedStyle(refLink).color,
      refLinkLineColor: window.getComputedStyle(refLinkLine).color,
      extraRefLinkTriggerColor: window.getComputedStyle(extraRefLinkTrigger).color,
      timeColor: window.getComputedStyle(time).color,
      footerContactTriggerColor: window.getComputedStyle(footerContactTrigger).color,
    };
  });
}

async function getUserModalBodyColor(page: Page) {
  return page.evaluate(() => {
    const modalBody = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-user-modal"] .rankland-user-modal-body',
    );
    if (!modalBody) {
      throw new Error('Missing rankland user modal body');
    }
    return window.getComputedStyle(modalBody).color;
  });
}

async function getUserModalTeamMemberEntryDom(page: Page) {
  return page.evaluate(() => {
    const row = document.querySelector<HTMLElement>('[data-id="rankland-user-modal-team-members"]');
    if (!row) {
      throw new Error('Missing user modal team members row');
    }

    return Array.from(row.children).map((child) => ({
      tagName: child.tagName,
      dataId: child.getAttribute('data-id') || '',
      text: (child.textContent || '').replace(/\s+/g, ' ').trim(),
      childDataIds: Array.from(child.children).map((grandchild) => grandchild.getAttribute('data-id') || ''),
    }));
  });
}

async function getModalRootClasses(page: Page, wrapperDataId: string) {
  return page.evaluate((dataId) => {
    const modalRoot = document.querySelector<HTMLElement>(`[data-id="${dataId}"] .srk-modal-root`);
    if (!modalRoot) {
      throw new Error(`Missing modal root for ${dataId}`);
    }
    return Array.from(modalRoot.classList);
  }, wrapperDataId);
}

async function getTableWrapperMarginLeft(page: Page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!wrapper) {
      throw new Error('Missing rankland-ranklist-table-wrapper');
    }
    return window.getComputedStyle(wrapper).marginLeft;
  });
}

async function getModalTableWrapperDomParity(page: Page) {
  return page.evaluate(() => {
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    const userModal = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-user-modal"]');
    const solutionModal = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-solution-modal"]');
    const footer = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-footer"]');
    if (!tableWrapper || !userModal || !solutionModal || !footer) {
      throw new Error('Missing ranklist modal table-wrapper DOM targets');
    }

    return {
      userModalInsideTableWrapper: tableWrapper.contains(userModal),
      solutionModalInsideTableWrapper: tableWrapper.contains(solutionModal),
      footerInsideTableWrapper: tableWrapper.contains(footer),
    };
  });
}

async function getControlsToTableGap(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!controls || !tableWrapper) {
      throw new Error('Missing ranklist controls or table wrapper');
    }
    return Math.round(tableWrapper.getBoundingClientRect().top - controls.getBoundingClientRect().bottom);
  });
}

async function getTableSpacerStyle(page: Page) {
  return page.evaluate(() => {
    const spacer = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-spacer"]');
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!spacer || !tableWrapper) {
      throw new Error('Missing ranklist table spacer or wrapper');
    }
    const spacerStyle = window.getComputedStyle(spacer);
    const tableWrapperStyle = window.getComputedStyle(tableWrapper);
    return {
      spacerClasses: Array.from(spacer.classList),
      spacerMarginTop: spacerStyle.marginTop,
      tableWrapperMarginTop: tableWrapperStyle.marginTop,
    };
  });
}

async function getProgressToControlsGap(page: Page) {
  return page.evaluate(() => {
    const progress = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-progress"]');
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    if (!progress || !controls) {
      throw new Error('Missing ranklist progress or controls');
    }
    return Math.round(controls.getBoundingClientRect().top - progress.getBoundingClientRect().bottom);
  });
}

async function getTimeToProgressGap(page: Page) {
  return page.evaluate(() => {
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    const progress = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-progress"]');
    if (!time || !progress) {
      throw new Error('Missing ranklist time or progress');
    }
    return Math.round(progress.getBoundingClientRect().top - time.getBoundingClientRect().bottom);
  });
}

async function getFooterParagraphSpacing(page: Page) {
  return page.evaluate(() => {
    const paragraphs = Array.from(
      document.querySelectorAll<HTMLElement>('[data-id="rankland-ranklist-footer"] p'),
    );
    if (paragraphs.length < 2) {
      throw new Error('Missing ranklist footer paragraphs');
    }
    return paragraphs.slice(0, 2).map((paragraph) => {
      const style = window.getComputedStyle(paragraph);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
  });
}

async function getFooterUtilityClasses(page: Page) {
  return page.evaluate(() => {
    const footer = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-footer"]');
    const paragraphs = Array.from(
      document.querySelectorAll<HTMLElement>('[data-id="rankland-ranklist-footer"] p'),
    );
    if (!footer || paragraphs.length < 5) {
      throw new Error('Missing ranklist footer or footer paragraphs');
    }

    return {
      footerClasses: Array.from(footer.classList),
      paragraphClasses: paragraphs.slice(0, 5).map((paragraph) => Array.from(paragraph.classList)),
    };
  });
}

async function getFilterControlSpacing(page: Page) {
  return page.evaluate(() => {
    const filters = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-filters"]');
    const organizationFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]');
    const officialFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-official-filter"]');
    const officialWrapper = officialFilter?.parentElement instanceof HTMLElement ? officialFilter.parentElement : null;
    const markerFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-marker-filter"]');
    if (!filters || !organizationFilter || !officialWrapper || !markerFilter) {
      throw new Error('Missing ranklist filter controls');
    }
    const filtersStyle = window.getComputedStyle(filters);
    const organizationFilterStyle = window.getComputedStyle(organizationFilter);
    const officialWrapperStyle = window.getComputedStyle(officialWrapper);
    const markerFilterStyle = window.getComputedStyle(markerFilter);
    return {
      filtersColumnGap: filtersStyle.columnGap,
      organizationFilterMarginLeft: organizationFilterStyle.marginLeft,
      checkboxMarginLeft: officialWrapperStyle.marginLeft,
      checkboxColumnGap: officialWrapperStyle.columnGap,
      markerMarginLeft: markerFilterStyle.marginLeft,
    };
  });
}

async function getFilterControlInnerGaps(page: Page) {
  return page.evaluate(() => {
    const filters = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-filters"]');
    const organizationFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]');
    const organizationText =
      Array.from(filters?.children || []).find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element.textContent?.trim() === '筛选',
      ) ||
      Array.from(filters?.querySelectorAll<HTMLElement>('span') || []).find(
        (element) => element.textContent?.trim() === '筛选',
      );
    const officialFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-official-filter"]');
    const officialWrapper = officialFilter?.parentElement instanceof HTMLElement ? officialFilter.parentElement : null;
    const officialText = Array.from(officialWrapper?.children || []).find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.textContent?.trim() === '仅正式参赛',
    );
    if (!filters || !organizationFilter || !organizationText || !officialWrapper || !officialFilter || !officialText) {
      throw new Error('Missing ranklist filter inner gap targets');
    }

    const officialWrapperStyle = window.getComputedStyle(officialWrapper);
    const organizationTextBox = organizationText.getBoundingClientRect();
    const organizationFilterBox = organizationFilter.getBoundingClientRect();
    const officialTextBox = officialText.getBoundingClientRect();
    const officialFilterBox = officialFilter.getBoundingClientRect();

    return {
      checkboxColumnGap: officialWrapperStyle.columnGap,
      officialTextToSwitchGap: Math.round(officialFilterBox.left - officialTextBox.right),
      organizationTextToSelectGap: Math.round(organizationFilterBox.left - organizationTextBox.right),
    };
  });
}

async function getFilterControlDomParity(page: Page) {
  return page.evaluate(() => {
    const filters = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-filters"]');
    const organizationFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]');
    const officialFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-official-filter"]');
    const officialWrapper = officialFilter?.parentElement instanceof HTMLElement ? officialFilter.parentElement : null;
    const markerFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-marker-filter"]');
    if (!filters || !organizationFilter || !officialWrapper || !markerFilter) {
      throw new Error('Missing ranklist filter DOM parity targets');
    }

    const children = Array.from(filters.children).map((child) => {
      const element = child as HTMLElement;
      return {
        classList: Array.from(element.classList),
        dataId: element.getAttribute('data-id') || '',
        tagName: element.tagName,
        text: element.textContent?.trim() || '',
      };
    });

    return {
      childSummaries: children.slice(0, 4),
      directLabelCount: filters.querySelectorAll(':scope > label').length,
      filtersClasses: Array.from(filters.classList),
      markerParentDataId: markerFilter.parentElement?.getAttribute('data-id') || '',
      organizationFilterClasses: Array.from(organizationFilter.classList),
      organizationFilterInlineWidth: organizationFilter.style.width,
      organizationParentDataId: organizationFilter.parentElement?.getAttribute('data-id') || '',
      organizationParentTagName: organizationFilter.parentElement?.tagName || '',
      officialWrapperClasses: Array.from(officialWrapper.classList),
      officialWrapperParentDataId: officialWrapper.parentElement?.getAttribute('data-id') || '',
      officialWrapperTagName: officialWrapper.tagName,
    };
  });
}

async function getMobileFilterControlLayout(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    const filters = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-filters"]');
    const organizationFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]');
    const officialFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-official-filter"]');
    const officialWrapper = officialFilter?.parentElement instanceof HTMLElement ? officialFilter.parentElement : null;
    const markerFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-marker-filter"]');
    if (!controls || !filters || !organizationFilter || !officialWrapper || !markerFilter) {
      throw new Error('Missing ranklist mobile filter layout targets');
    }

    const controlsStyle = window.getComputedStyle(controls);
    const filtersStyle = window.getComputedStyle(filters);
    const organizationFilterStyle = window.getComputedStyle(organizationFilter);
    const officialWrapperStyle = window.getComputedStyle(officialWrapper);
    const markerFilterStyle = window.getComputedStyle(markerFilter);
    return {
      controlsAlignItems: controlsStyle.alignItems,
      controlsFlexDirection: controlsStyle.flexDirection,
      filtersAlignItems: filtersStyle.alignItems,
      filtersColumnGap: filtersStyle.columnGap,
      filtersFlexDirection: filtersStyle.flexDirection,
      filtersRowGap: filtersStyle.rowGap,
      markerMarginLeft: markerFilterStyle.marginLeft,
      officialMarginLeft: officialWrapperStyle.marginLeft,
      organizationFilterWidth: organizationFilterStyle.width,
    };
  });
}

async function getControlsUtilityClasses(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    const organizationFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]');
    const officialFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-official-filter"]');
    const markerFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-marker-filter"]');
    const officialWrapper = officialFilter?.parentElement instanceof HTMLElement ? officialFilter.parentElement : null;
    const officialText = Array.from(officialWrapper?.children || []).find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.textContent?.trim() === '仅正式参赛',
    );
    if (!controls || !organizationFilter || !officialWrapper || !officialText || !markerFilter) {
      throw new Error('Missing ranklist controls utility class targets');
    }
    return {
      controlsClasses: Array.from(controls.classList),
      organizationFilterClasses: Array.from(organizationFilter.classList),
      officialWrapperClasses: Array.from(officialWrapper.classList),
      officialTextClasses: Array.from(officialText.classList),
      markerFilterClasses: Array.from(markerFilter.classList),
    };
  });
}

async function getRouteContentSpacing(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Missing route content element: ${selector}`);
    }
    const style = window.getComputedStyle(element);
    return {
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      paddingBottom: style.paddingBottom,
    };
  }, selector);
}

async function getRanklistLoadedWrapperDom(page: Page) {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-id="ranklist-content"]');
    if (!content || !(content.parentElement instanceof HTMLElement)) {
      throw new Error('Missing ranklist content wrapper');
    }

    const contentStyle = window.getComputedStyle(content);
    return {
      rootTagName: content.parentElement.tagName,
      rootClasses: Array.from(content.parentElement.classList),
      contentTagName: content.tagName,
      contentClasses: Array.from(content.classList),
      contentMarginTop: contentStyle.marginTop,
      contentMarginBottom: contentStyle.marginBottom,
    };
  });
}

async function getRanklistRendererTopLevelDom(page: Page) {
  return page.locator('[data-id="ranklist-content"]').evaluate((content) => (
    Array.from(content.children)
      .filter((child) => child.getAttribute('data-id') !== 'ranklist-hydrated')
      .map((child) => ({
        tagName: child.tagName,
        dataId: child.getAttribute('data-id'),
        classList: Array.from(child.classList),
      }))
  ));
}

async function hasLoadedZcoolXiaoWeiFont(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts).some(
      (fontFace) => fontFace.family === 'ZCOOL XiaoWei' && fontFace.status === 'loaded',
    );
  });
}

async function selectRanklistOrganization(page: Page, organization: string, expectedSelectedCount: number) {
  const filter = page.locator('[data-id="rankland-ranklist-organization-filter"]');
  const visibleDropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  const option = visibleDropdown.locator('.ant-select-item-option', { hasText: organization }).first();
  const selectedTag = filter.locator('.ant-select-selection-item');

  await filter.click();
  try {
    await visibleDropdown.waitFor({ state: 'visible', timeout: 1000 });
    await option.waitFor({ state: 'visible', timeout: 1000 });
  } catch (error) {
    await filter.click({ force: true });
    await page.keyboard.press('ArrowDown');
    await visibleDropdown.waitFor({ state: 'visible', timeout: 5000 });
    await option.waitFor({ state: 'visible', timeout: 5000 });
  }
  await option.click();
  await page.keyboard.press('Escape');
  await expect(selectedTag).toHaveText(`已选择 ${expectedSelectedCount} 个`);
}

async function reloadRanklistAndWaitForHydration(page: Page) {
  await page.reload();
  await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
  await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
}

test.describe('/ranklist/:id full-chain route', () => {
  test('renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await forceSystemLightMode(page);
    await stubClipboard(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 | RankLand');
    await expect(
      page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]'),
    ).toBeVisible();
    await expect(page.locator('[data-id="ranklist-content"]')).toHaveClass(/(^|\s)mt-8(\s|$)/);
    await expect(page.locator('[data-id="ranklist-content"]')).toHaveClass(/(^|\s)mb-8(\s|$)/);
    expect(await getRouteContentSpacing(page, '[data-id="ranklist-content"]')).toMatchObject({
      marginTop: '32px',
      marginBottom: '32px',
    });
    expect(await getRanklistLoadedWrapperDom(page)).toMatchObject({
      rootTagName: 'DIV',
      rootClasses: [],
      contentTagName: 'DIV',
      contentClasses: ['mt-8', 'mb-8'],
      contentMarginTop: '32px',
      contentMarginBottom: '32px',
    });
    await expect(page.locator('.rankland-ranklist')).toHaveCount(0);
    await expect(page.locator('.rankland-ranklist-header')).toHaveCount(0);
    expect(await getRanklistRendererTopLevelDom(page)).toEqual([
      {
        tagName: 'DIV',
        dataId: null,
        classList: ['flex', 'items-center', 'justify-center'],
      },
      {
        tagName: 'H1',
        dataId: 'rankland-ranklist-title',
        classList: ['text-center', 'mb-1'],
      },
      {
        tagName: 'DIV',
        dataId: 'rankland-ranklist-header-meta',
        classList: ['text-center', 'mt-1'],
      },
      {
        tagName: 'P',
        dataId: 'rankland-ranklist-time',
        classList: ['text-center', 'mb-0'],
      },
      {
        tagName: 'DIV',
        dataId: 'rankland-ranklist-progress',
        classList: ['mx-4'],
      },
      {
        tagName: 'DIV',
        dataId: 'rankland-ranklist-controls',
        classList: ['mt-3', 'mx-4', 'flex', 'justify-between', 'items-center'],
      },
      {
        tagName: 'DIV',
        dataId: 'rankland-ranklist-table-spacer',
        classList: ['mt-6'],
      },
      {
        tagName: 'DIV',
        dataId: 'rankland-ranklist-table-wrapper',
        classList: ['ml-4'],
      },
      {
        tagName: 'FOOTER',
        dataId: 'rankland-ranklist-footer',
        classList: ['text-center', 'mt-8'],
      },
    ]);
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('width', '1px');
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('height', '1px');
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    expect(await getRanklistHeaderTitlePresentation(page)).toMatchObject({
      fontSize: '32px',
      fontWeight: '500',
      marginBottom: '4px',
    });
    const headerUtilityClasses = await getHeaderUtilityClasses(page);
    expect(headerUtilityClasses).toMatchObject({
      bannerWrapClasses: expect.arrayContaining([
        'flex',
        'items-center',
        'justify-center',
      ]),
      bannerClasses: expect.arrayContaining(['mb-2']),
      bannerWrapAlignItems: 'center',
      bannerWrapDisplay: 'flex',
      bannerWrapJustifyContent: 'center',
      bannerWrapMarginBottom: '0px',
      bannerMarginBottom: '8px',
      titleClasses: expect.arrayContaining(['text-center', 'mb-1']),
    });
    expect(headerUtilityClasses.bannerWrapClasses).not.toContain('rankland-ranklist-banner-wrap');
    expect(headerUtilityClasses.bannerClasses).toEqual(['mb-2']);
    expect(headerUtilityClasses.bannerClasses).not.toContain('rankland-ranklist-banner');
    expect(headerUtilityClasses.bannerInlineStyle.replace(/\s+/g, '')).toContain('max-width:min(100%,1820px)');
    expect(headerUtilityClasses.bannerInlineStyle.replace(/\s+/g, '')).toContain('max-height:40vh');
    expect(headerUtilityClasses.metaClasses).toEqual(['text-center', 'mt-1']);
    expect(headerUtilityClasses.metaClasses).not.toContain('rankland-ranklist-header-meta');
    expect(headerUtilityClasses.contributorsClasses).toEqual(['mb-0']);
    expect(headerUtilityClasses.contributorsClasses).not.toContain('rankland-ranklist-contributors');
    expect(headerUtilityClasses.refLinksClasses).toEqual([]);
    expect(headerUtilityClasses.refLinksClasses).not.toContain('rankland-ranklist-ref-links');
    expect(headerUtilityClasses.timeClasses).toEqual(['text-center', 'mb-0']);
    expect(headerUtilityClasses.timeClasses).not.toContain('rankland-ranklist-time');
    expect(await getRanklistHeaderTextSizes(page)).toMatchObject({
      viewCountFontSize: '14px',
      contributorsFontSize: '14px',
      refLinksFontSize: '14px',
      timeFontSize: '14px',
    });
    await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('42');
    await expect(page.locator('[data-id="rankland-ranklist-view-count"] .anticon-eye')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveClass(/(^|\s)mr-2(\s|$)/);
    const viewCountClasses = await page.locator('[data-id="rankland-ranklist-view-count"]').evaluate((element) => (
      Array.from(element.classList)
    ));
    expect(viewCountClasses).toEqual(['mr-2']);
    expect(viewCountClasses).not.toContain('rankland-ranklist-view-count');
    await expect(page.locator('[data-id="rankland-ranklist-contributors"]')).toContainText(
      '贡献者：RankLand Alpha, Team Beta',
    );
    expect(await page.locator('[data-id="rankland-ranklist-contributors"]').evaluate((element) => (
      Array.from(element.children)
        .filter((child) => child.tagName === 'SPAN')
        .map((child) => (child.textContent || '').replace(/\s+/g, ' ').trim())
    ))).toEqual(['RankLand Alpha', ', Team Beta']);
    await expect(page.locator('[data-id="rankland-ranklist-contributors"] a', { hasText: 'RankLand Alpha' })).toHaveAttribute(
      'href',
      'https://github.com/rankland-alpha',
    );
    await expect(page.locator('[data-id="rankland-ranklist-contributors"] a', { hasText: 'RankLand Alpha' })).toHaveAttribute(
      'target',
      '_blank',
    );
    await expect(page.locator('[data-id="rankland-ranklist-contributors"] a', { hasText: 'RankLand Alpha' })).toHaveAttribute(
      'rel',
      'noopener',
    );
    expect(await getHeaderMetaBlockSpacing(page)).toMatchObject({
      metaMarginBottom: '0px',
      contributorsMarginTop: '0px',
      contributorsMarginBottom: '0px',
      refLinksMarginTop: '0px',
    });
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"]')).toContainText(
      '相关链接：Official Site, Mirror, Statements',
    );
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"]')).toHaveJSProperty('tagName', 'SPAN');
    expect(await getHeaderMetaDomParity(page)).toEqual({
      contributorsParentDataId: 'rankland-ranklist-header-meta',
      refLinksParentDataId: 'rankland-ranklist-header-meta',
      timeParentDataId: 'ranklist-content',
    });
    expect(await page.locator('[data-id="rankland-ranklist-ref-links"]').evaluate((element) => (
      Array.from(element.children)
        .filter((child) => child.tagName === 'SPAN' && child.querySelector('a'))
        .map((child) => (child.textContent || '').replace(/\s+/g, ' ').trim())
    ))).toEqual(['Official Site', ', Mirror', ', Statements']);
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"] a').first()).toHaveAttribute('target', '_blank');
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"] a').first()).toHaveAttribute('rel', 'noopener');
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveText('and 1 more');
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"] .anticon-caret-down')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveCSS(
      'margin-left',
      '0px',
    );
    await expect.poll(() => getRanklistLinkColors(page)).toMatchObject({
      viewCountColor: 'rgba(0, 0, 0, 0.85)',
      refLinkColor: 'rgb(255, 129, 4)',
      extraRefLinkTriggerColor: 'rgba(0, 0, 0, 0.85)',
      refLinkLineColor: 'rgba(0, 0, 0, 0.85)',
      timeColor: 'rgba(0, 0, 0, 0.85)',
      footerContactTriggerColor: 'rgb(255, 129, 4)',
    });
    expect((await getRanklistLinkColors(page)).extraRefLinkTriggerColor).not.toBe(
      (await getRanklistLinkColors(page)).refLinkColor,
    );
    await page.locator('[data-id="rankland-ranklist-ref-links"] a').first().hover();
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"] a').first()).toHaveCSS(
      'color',
      'rgb(255, 157, 46)',
    );
    await expect(page.locator('[data-id="rankland-ranklist-banner"]')).toHaveAttribute(
      'src',
      `${mockBaseURL}/srk-assets/test-key/banner.png`,
    );
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    const progressWrapper = page.locator('[data-id="rankland-ranklist-progress"]');
    await expect(progressWrapper).toHaveClass(/^mx-4$/);
    expect(await progressWrapper.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-ranklist-progress',
    );
    expect(await progressWrapper.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
      };
    })).toMatchObject({
      marginLeft: '16px',
      marginRight: '16px',
    });
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-table-wrapper"]')).toHaveClass('ml-4');
    expect(await getTableWrapperMarginLeft(page)).toBe('16px');
    expect(await getTimeToProgressGap(page)).toBe(5);
    expect(await getProgressToControlsGap(page)).toBe(12);
    expect(await getControlsToTableGap(page)).toBe(24);
    const tableSpacerStyle = await getTableSpacerStyle(page);
    expect(tableSpacerStyle).toEqual({
      spacerClasses: expect.arrayContaining(['mt-6']),
      spacerMarginTop: '24px',
      tableWrapperMarginTop: '0px',
    });
    expect(tableSpacerStyle.spacerClasses).not.toContain('rankland-ranklist-table-spacer');
    const remarks = page.locator('[data-id="rankland-ranklist-table-wrapper"] .srk-remarks');
    const remarksWrapperStyle = await remarks.evaluate((element) => {
      const wrapper = element.parentElement;
      if (!wrapper) {
        throw new Error('Missing SRK remarks wrapper');
      }
      const style = window.getComputedStyle(wrapper);
      return {
        classList: Array.from(wrapper.classList),
        marginBottom: style.marginBottom,
        textAlign: style.textAlign,
      };
    });
    expect(remarksWrapperStyle).toMatchObject({
      classList: ['mb-4', 'text-center'],
      marginBottom: '16px',
      textAlign: 'center',
    });
    expect(remarksWrapperStyle.classList).not.toContain('rankland-ranklist-remarks');
    expect(await getModalTableWrapperDomParity(page)).toEqual({
      userModalInsideTableWrapper: true,
      solutionModalInsideTableWrapper: true,
      footerInsideTableWrapper: false,
    });
    await expect(remarks).toHaveText('备注：赛后补题榜单，仅供展示');
    await expect(remarks).toBeVisible();
    expect(await remarks.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        fontSize: style.fontSize,
        borderTopWidth: style.borderTopWidth,
        borderTopStyle: style.borderTopStyle,
        borderTopColor: style.borderTopColor,
        borderRadius: style.borderRadius,
        paddingLeft: style.paddingLeft,
        paddingTop: style.paddingTop,
        opacity: style.opacity,
      };
    })).toMatchObject({
      display: 'inline-block',
      fontSize: '12px',
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: 'rgba(255, 129, 4, 0.8)',
      borderRadius: '4px',
      paddingLeft: '8px',
      paddingTop: '4px',
      opacity: '0.75',
    });
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('需要专业的赛事外榜托管？');
    const footerGitHubLink = page.locator('[data-id="rankland-ranklist-footer"] a[href="https://github.com/algoux"]');
    await expect(footerGitHubLink).toHaveAttribute('target', '_blank');
    expect(await footerGitHubLink.getAttribute('rel')).toBeNull();
    const footerStandardRanklistLink = page.locator(
      '[data-id="rankland-ranklist-footer"] a[href="https://github.com/algoux/standard-ranklist"]',
    );
    await expect(footerStandardRanklistLink).toHaveAttribute('target', '_blank');
    expect(await footerStandardRanklistLink.getAttribute('rel')).toBeNull();
    const footerCollectionLink = page.locator(
      '[data-id="rankland-ranklist-footer"] a[href="https://github.com/algoux/srk-collection"]',
    );
    await expect(footerCollectionLink).toHaveAttribute('target', '_blank');
    expect(await footerCollectionLink.getAttribute('rel')).toBeNull();
    expect(await getFooterParagraphSpacing(page)).toEqual([
      { marginTop: '0px', marginBottom: '0px' },
      { marginTop: '4px', marginBottom: '0px' },
    ]);
    expect(await getFooterUtilityClasses(page)).toMatchObject({
      footerClasses: ['text-center', 'mt-8'],
      paragraphClasses: [
        expect.arrayContaining(['mb-0']),
        expect.arrayContaining(['mt-1', 'mb-0']),
        expect.arrayContaining(['mt-1', 'mb-0']),
        expect.arrayContaining(['mt-1', 'mb-0']),
        expect.arrayContaining(['mt-1', 'mb-0']),
      ],
    });
    expect((await getFooterUtilityClasses(page)).footerClasses).not.toContain('rankland-ranklist-footer');
    await expect(page.locator('[data-id="rankland-ranklist-beian"]')).toHaveCount(0);
    const footerContactTrigger = page.locator('[data-id="rankland-ranklist-footer"] [data-id="contact-us-trigger"]');
    await expect(footerContactTrigger).toHaveText('联系我们');
    await expect(footerContactTrigger).toHaveJSProperty('tagName', 'A');
    expect(await footerContactTrigger.getAttribute('href')).toBeNull();
    await footerContactTrigger.click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toBeVisible();
    await expect(page.locator('[data-id="contact-us-email"][href="mailto:algoux.org@gmail.com"]')).toHaveText(
      'algoux.org@gmail.com',
    );
    await expect(page.locator('[data-id="contact-us-qq-image"]')).toBeVisible();
    await page.locator('[data-id="contact-us-close"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toHaveCount(0);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"] .anticon-download')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"] .anticon-share-alt')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-0(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-solid(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-gray-400(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)mr-2(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)pl-2(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveClass(/(^|\s)border-l(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)pl-2(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-0(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-l(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-solid(\s|$)/);
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toHaveClass(/(^|\s)border-gray-400(\s|$)/);
    const ranklistExportTrigger = page.locator('[data-id="rankland-ranklist-export-menu-button"]');
    const ranklistShareTrigger = page.locator('[data-id="rankland-ranklist-share-menu-button"]');
    await expect(ranklistExportTrigger).toHaveJSProperty('tagName', 'A');
    await expect(ranklistShareTrigger).toHaveJSProperty('tagName', 'A');
    expect(await ranklistExportTrigger.getAttribute('href')).toBeNull();
    expect(await ranklistShareTrigger.getAttribute('href')).toBeNull();
    expect(await ranklistExportTrigger.getAttribute('title')).toBeNull();
    expect(await ranklistShareTrigger.getAttribute('title')).toBeNull();
    expect(await ranklistExportTrigger.getAttribute('aria-label')).toBeNull();
    expect(await ranklistShareTrigger.getAttribute('aria-label')).toBeNull();
    expect(await ranklistExportTrigger.evaluate((element) => Array.from(element.classList))).toEqual([
      'border-0',
      'border-solid',
      'border-gray-400',
      'mr-2',
      'pl-2',
      'border-l',
      'ant-dropdown-trigger',
    ]);
    expect(await ranklistShareTrigger.evaluate((element) => Array.from(element.classList))).toEqual([
      'pl-2',
      'border-0',
      'border-l',
      'border-solid',
      'border-gray-400',
      'ant-dropdown-trigger',
    ]);
    for (const trigger of [ranklistExportTrigger, ranklistShareTrigger]) {
      const classList = await trigger.evaluate((element) => Array.from(element.classList));
      expect(classList).not.toContain('ant-btn');
      expect(classList).not.toContain('ant-btn-sm');
      expect(classList).not.toContain('rankland-ranklist-header-action-trigger');
      expect(classList).not.toContain('rankland-ranklist-header-action-separated');
    }
    expect(await getHeaderActionGapStyle(page)).toEqual({
      metaColumnGap: 'normal',
      metaRowGap: 'normal',
      actionsColumnGap: 'normal',
      actionsRowGap: 'normal',
    });
    expect(await getHeaderActionDisplayStyle(page)).toEqual({
      metaDisplay: 'block',
      actionsDisplay: 'inline',
    });
    for (const selector of [
      '[data-id="rankland-ranklist-export-menu-button"]',
      '[data-id="rankland-ranklist-share-menu-button"]',
    ]) {
      expect(await getHeaderActionTriggerStyle(page, selector)).toMatchObject({
        paddingLeft: '8px',
        borderLeftWidth: '1px',
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '0px',
        borderRadius: '0px',
        color: 'rgb(255, 129, 4)',
      });
    }
    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveCSS(
      'color',
      'rgb(255, 157, 46)',
    );
    await page.mouse.move(10, 10);
    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-group"]')).toContainText('导出为');
    await page.mouse.move(10, 10);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-group"]')).toBeHidden();
    await expectHoverDropdownOpensAndCloses(
      page,
      'rankland-ranklist-export-menu-button',
      'rankland-ranklist-export-srk-action',
    );
    await expectHoverDropdownOpensAndCloses(
      page,
      'rankland-ranklist-share-menu-button',
      'rankland-ranklist-copy-link-action',
    );
    await expectHoverDropdownOpensAndCloses(
      page,
      'rankland-ranklist-ref-link-extra-action',
      'rankland-ranklist-ref-link-extra-archive',
    );
    await page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-archive"]')).toHaveAttribute(
      'target',
      '_blank',
    );
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-archive"]')).toHaveAttribute(
      'rel',
      'noopener',
    );

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-srk-action"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-key.srk.json');
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    expect(JSON.parse(await readFile(downloadPath!, 'utf8')).contest.title).toBe('Test Contest 2024');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const gymGhostDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]').click();
    const gymGhostDownload = await gymGhostDownloadPromise;
    expect(gymGhostDownload.suggestedFilename()).toBe('test-key_gymghost.dat');
    const gymGhostDownloadPath = await gymGhostDownload.path();
    expect(gymGhostDownloadPath).not.toBeNull();
    const gymGhostContent = await readFile(gymGhostDownloadPath!, 'utf8');
    expect(gymGhostContent).toContain('@contest "Test Contest 2024"');
    expect(gymGhostContent).toContain('Team Alpha');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const vjudgeDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-vjudge-action"]').click();
    const vjudgeDownload = await vjudgeDownloadPromise;
    expect(vjudgeDownload.suggestedFilename()).toBe('test-key_vjreplay.xlsx');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const excelDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-xlsx-action"]').click();
    const excelDownload = await excelDownloadPromise;
    expect(excelDownload.suggestedFilename()).toBe('test-key.xlsx');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveCount(0);

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').hover();
    await page.locator('[data-id="rankland-ranklist-copy-link-action"]').click();
    await expectNotificationMessage(page, '链接已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(`http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key`);

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').hover();
    await page.locator('[data-id="rankland-ranklist-copy-embed-action"]').click();
    await expectNotificationMessage(page, '嵌入代码已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(
      `<iframe src="http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`,
    );

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    expect(await getModalRootClasses(page, 'rankland-ranklist-user-modal')).toEqual(
      expect.arrayContaining([
        'srk-modal-root',
        'srk-animated-modal-root',
        'srk-react-modal-root',
        'srk-general-modal-root',
      ]),
    );
    await expect(userModal.locator('.srk-modal-title')).toHaveText('Team Alpha');
    await expect(userModal.locator('.user-modal')).toBeVisible();
    await expect(userModal.locator('[data-id="rankland-user-modal-name"]')).toHaveCount(0);
    const organizationLine = userModal.locator('[data-id="rankland-user-modal-organization"]');
    await expect(organizationLine).toHaveText('Org A');
    await expect(organizationLine).toHaveClass(/^mb-0$/);
    expect(await organizationLine.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-line',
    );
    expect(await organizationLine.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-organization',
    );
    const organizationLineStyle = await organizationLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(organizationLineStyle).toMatchObject({
      marginTop: '0px',
      marginBottom: '0px',
    });
    const teamMembers = userModal.locator('[data-id="rankland-user-modal-team-members"]');
    await expect(teamMembers.locator('[data-id="rankland-user-modal-team-member"]')).toContainText(['Alice', 'Bob']);
    await expect(teamMembers).toHaveClass(/^user-modal-info-team-members mt-2$/);
    expect(await teamMembers.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-team-members',
    );
    const teamSeparator = teamMembers.locator('[data-id="rankland-user-modal-team-separator"]');
    await expect(teamSeparator).toHaveText('/');
    expect(await teamSeparator.evaluate((element) => element.textContent)).toBe(' / ');
    const teamMemberStyle = await teamMembers.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        opacity: style.opacity,
        marginTop: style.marginTop,
        paddingTop: style.paddingTop,
      };
    });
    expect(teamMemberStyle).toMatchObject({
      display: 'block',
      opacity: '0.8',
      marginTop: '8px',
      paddingTop: '6px',
    });
    expect(await getUserModalTeamMemberEntryDom(page)).toEqual([
      {
        tagName: 'SPAN',
        dataId: 'rankland-user-modal-team-member-entry',
        text: 'Alice',
        childDataIds: ['rankland-user-modal-team-member'],
      },
      {
        tagName: 'SPAN',
        dataId: 'rankland-user-modal-team-member-entry',
        text: '/ Bob',
        childDataIds: ['rankland-user-modal-team-separator', 'rankland-user-modal-team-member'],
      },
    ]);
    const separatorStyle = await teamMembers
      .locator('[data-id="rankland-user-modal-team-separator"]')
      .evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          opacity: style.opacity,
          fontSize: style.fontSize,
        };
      });
    expect(separatorStyle).toMatchObject({
      opacity: '0.5',
      fontSize: '11.2px',
    });
    const markerRow = userModal.locator('.user-modal-info-markers');
    await expect(markerRow).toHaveClass(/^user-modal-info-markers mt-2$/);
    expect(await markerRow.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-markers',
    );
    const markerRowStyle = await markerRow.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        marginTop: style.marginTop,
      };
    });
    expect(markerRowStyle).toMatchObject({
      display: 'block',
      marginTop: '8px',
    });
    const marker = userModal.locator('[data-id="rankland-user-modal-marker"]').first();
    await expect(marker).toHaveText('Gold Group');
    await expect(marker).toHaveClass(/user-modal-info-marker/);
    await expect(marker).toHaveClass(/srk-preset-marker-yellow/);
    const markerStyle = await marker.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        fontSize: style.fontSize,
        borderRadius: style.borderRadius,
        borderTopWidth: style.borderTopWidth,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        marginRight: style.marginRight,
      };
    });
    expect(markerStyle).toMatchObject({
      display: 'inline-block',
      fontSize: '12px',
      borderRadius: '4px',
      borderTopWidth: '1px',
      paddingTop: '2px',
      paddingRight: '2px',
      paddingBottom: '2px',
      paddingLeft: '2px',
      marginRight: '0px',
    });
    const photo = userModal.locator('[data-id="rankland-user-modal-photo"]');
    await expect(photo).toHaveAttribute('alt', '选手照片');
    const photoInlineStyle = (await photo.getAttribute('style')) || '';
    expect(photoInlineStyle.replace(/\s+/g, ' ')).toContain('width: 100%');
    const photoWrapper = userModal.locator('.rankland-user-modal-photo');
    await expect(photoWrapper).toHaveClass(/(^|\s)mt-4(\s|$)/);
    const photoWrapperStyle = await photoWrapper.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
      };
    });
    expect(photoWrapperStyle).toMatchObject({
      marginTop: '16px',
    });
    const photoStyle = await photo.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        width: style.width,
        maxWidth: style.maxWidth,
      };
    });
    const photoModalBodyWidth = await photo.evaluate((element) => {
      const modalBody = element.closest('.rankland-user-modal-body');
      return modalBody ? window.getComputedStyle(modalBody).width : '';
    });
    expect(photoStyle).toMatchObject({
      width: photoModalBodyWidth,
      maxWidth: '100%',
    });
    const segmentLine = userModal.locator('[data-id="rankland-user-modal-segment"]');
    await expect(segmentLine).toContainText('所在奖区（Rank）：');
    await expect(segmentLine).toHaveClass(/^mt-4 mb-0$/);
    expect(await segmentLine.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-line',
    );
    expect(await segmentLine.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-segment',
    );
    const segmentLineStyle = await segmentLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(segmentLineStyle).toMatchObject({
      marginTop: '16px',
      marginBottom: '0px',
    });
    const segmentLabel = userModal.locator('[data-id="rankland-user-modal-segment-label"]');
    await expect(segmentLabel).toHaveText('Gold');
    await expect(segmentLabel).toHaveClass(/^user-modal-segment-label bg-segment-gold$/);
    expect(await segmentLabel.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-segment-label',
    );
    const segmentLabelStyle = await segmentLabel.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        borderRadius: style.borderRadius,
        color: style.color,
      };
    });
    expect(segmentLabelStyle).toMatchObject({
      display: 'inline-block',
      paddingTop: '4px',
      paddingRight: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
      borderRadius: '4px',
      color: 'rgb(255, 255, 255)',
    });
    const slogan = userModal.locator('[data-id="rankland-user-modal-slogan"]');
    await expect(slogan).toHaveText('Keep moving forward');
    await expect(photoWrapper.locator('[data-id="rankland-user-modal-slogan"]')).toHaveText('Keep moving forward');
    expect(
      await userModal.evaluate((modal) => {
        const photoElement = modal.querySelector('[data-id="rankland-user-modal-photo"]');
        const sloganElement = modal.querySelector('[data-id="rankland-user-modal-slogan"]');
        return (
          photoElement?.parentElement === sloganElement?.parentElement &&
          !!sloganElement?.parentElement?.classList.contains('rankland-user-modal-photo')
        );
      }),
    ).toBe(true);
    await expect(slogan).toHaveClass(/^slogan mt-4 mb-2$/);
    expect(await slogan.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-slogan',
    );
    const sloganStyle = await slogan.evaluate((element) => {
      const style = window.getComputedStyle(element);
      const beforeStyle = window.getComputedStyle(element, '::before');
      return {
        textAlign: style.textAlign,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        beforeContent: beforeStyle.content,
        beforeDisplay: beforeStyle.display,
        beforeFontSize: beforeStyle.fontSize,
      };
    });
    expect(sloganStyle).toMatchObject({
      textAlign: 'center',
      fontSize: '32px',
      marginTop: '16px',
      marginBottom: '8px',
      beforeContent: '"SLOGAN"',
      beforeDisplay: 'block',
      beforeFontSize: '14px',
    });
    expect(sloganStyle.fontFamily).toContain('ZCOOL XiaoWei');
    expect(await hasLoadedZcoolXiaoWeiFont(page)).toBe(true);
    await userModal.getByRole('button', { name: 'Close' }).click();
    await expect(userModal.locator('.srk-modal')).toBeHidden();

    await page.locator('.srk-user-cell', { hasText: 'Team Beta' }).click();
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    const unofficialLine = userModal.locator('[data-id="rankland-user-modal-unofficial"]');
    await expect(unofficialLine).toHaveText('＊ 非正式参加者');
    await expect(unofficialLine).toHaveClass(/^mt-4 mb-0$/);
    expect(await unofficialLine.evaluate((element) => Array.from(element.classList))).not.toContain(
      'rankland-user-modal-unofficial',
    );
    const unofficialLineStyle = await unofficialLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(unofficialLineStyle).toMatchObject({
      marginTop: '16px',
      marginBottom: '0px',
    });
    const betaPhotoWrapper = userModal.locator('.rankland-user-modal-photo');
    await expect(betaPhotoWrapper).toHaveCount(1);
    await expect(betaPhotoWrapper).toHaveClass(/(^|\s)mt-4(\s|$)/);
    await expect(betaPhotoWrapper.locator('[data-id="rankland-user-modal-photo"]')).toHaveCount(0);
    await expect(betaPhotoWrapper.locator('[data-id="rankland-user-modal-slogan"]')).toHaveCount(0);
    const betaPhotoWrapperStyle = await betaPhotoWrapper.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
      };
    });
    expect(betaPhotoWrapperStyle).toMatchObject({
      marginTop: '16px',
    });
    await userModal.getByRole('button', { name: 'Close' }).click();
    await expect(userModal.locator('.srk-modal')).toBeHidden();

    await page
      .locator('tr', { hasText: 'Team Alpha' })
      .locator('.srk-prest-status-block-accepted')
      .first()
      .click();
    const solutionModal = page.locator('[data-id="rankland-ranklist-solution-modal"]');
    await expect(solutionModal.locator('.srk-modal')).toBeVisible();
    expect(await getModalRootClasses(page, 'rankland-ranklist-solution-modal')).toEqual(
      expect.arrayContaining([
        'srk-modal-root',
        'srk-animated-modal-root',
        'srk-react-modal-root',
        'srk-general-modal-root',
      ]),
    );
    await expect(solutionModal).toContainText('Solutions of A (Team Alpha)');
    await expect(solutionModal).toContainText('Accepted');
    await solutionModal.getByRole('button', { name: 'Close' }).click();
    await expect(solutionModal.locator('.srk-modal')).toBeHidden();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string; search: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter(
      (requestRecord) =>
        requestRecord.path === '/file/download' &&
        new URLSearchParams(requestRecord.search).get('id') === 'file-test-1',
    );

    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(1);
  });

  test('hides broken SRK asset images like the legacy SrkAssetImage component', async ({ page, request }) => {
    await request.post(`${mockBaseURL}/__reset`);
    await page.route('**/srk-assets/test-key/banner.png', async (route) => {
      await route.fulfill({ status: 404, body: 'missing banner' });
    });
    await page.route('**/srk-assets/test-key/team-alpha.png', async (route) => {
      await route.fulfill({ status: 404, body: 'missing photo' });
    });

    const response = await page.goto('/ranklist/test-key?focus=yes');
    expect(response?.status()).toBe(200);

    const banner = page.locator('[data-id="rankland-ranklist-banner"]');
    await expect(banner).toHaveAttribute('src', `${mockBaseURL}/srk-assets/test-key/banner.png`);
    await expect.poll(async () => banner.evaluate((element) => window.getComputedStyle(element).display)).toBe('none');

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('.rankland-user-modal');
    await expect(userModal).toBeVisible();
    const photo = userModal.locator('[data-id="rankland-user-modal-photo"]');
    await expect(photo).toHaveAttribute('src', `${mockBaseURL}/srk-assets/test-key/team-alpha.png`);
    await expect.poll(async () => photo.evaluate((element) => window.getComputedStyle(element).display)).toBe('none');
  });

  test('uses the legacy responsive width for the user info modal on mobile', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.setViewportSize({ width: 390, height: 844 });

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    const teamAlphaRow = page.locator('tr', { hasText: 'Team Alpha' });
    await expect(teamAlphaRow).toBeVisible();

    await teamAlphaRow.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click({ force: true });
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"] [data-srk-modal-panel="true"]');
    await expect(userModal).toBeVisible();

    const modalLayout = await userModal.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        style: element.getAttribute('style') || '',
        width: Math.round(box.width),
        viewportWidth: window.innerWidth,
      };
    });

    expect(modalLayout.width).toBeLessThanOrEqual(modalLayout.viewportWidth);
    expect(modalLayout.style).toContain(`width: ${modalLayout.viewportWidth - 20}px`);
  });

  test('renders the Not Found page when the backend returns missing ranklist', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found | RankLand');
    await expect(page.locator('[data-id="ranklist-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-not-found"]')).toHaveClass(/(^|\s)mt-16(\s|$)/);
    await expect(page.locator('[data-id="ranklist-not-found"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
    await expect(page.locator('[data-id="ranklist-not-found"] h3')).toHaveText('Ranklist Not Found');
    await expect(page.locator('[data-id="ranklist-not-found"] h3')).toHaveClass(/(^|\s)mb-4(\s|$)/);
    await expect(page.locator('[data-id="ranklist-not-found-home-link"][href="/"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-primary/);
    await expect(page.locator('[data-id="ranklist-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-sm/);

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/missing-key');

    expect(rankRequests).toHaveLength(1);
  });

  test('renders the legacy ranklist load error state with Ant Design refresh action', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await request.post(`${mockBaseURL}/__fail-ranklist/test-key`);

    const response = await page.goto('/ranklist/test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('RankLand');
    await expect(page.locator('[data-id="ranklist-error"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-error"] p')).toHaveText('An error occurred while loading data');
    await expect(page.locator('[data-id="ranklist-error"]')).toHaveClass(/(^|\s)mt-16(\s|$)/);
    await expect(page.locator('[data-id="ranklist-error"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
    await expect(page.locator('[data-id="ranklist-error"]')).toHaveCSS('margin-top', '64px');
    await expect(page.locator('[data-id="ranklist-error"]')).toHaveCSS('text-align', 'center');
    await expect(page.locator('[data-id="ranklist-refresh"]')).toHaveText('Refresh');
    await expect(page.locator('[data-id="ranklist-refresh"]')).toHaveClass(/ant-btn-primary/);
    await expect(page.locator('[data-id="ranklist-refresh"]')).toHaveClass(/ant-btn-sm/);

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter((requestRecord) => requestRecord.path === '/file/download');

    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(0);
  });

  test('renders legacy Ant Design filter controls and preserves filtering behavior', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.setViewportSize({ width: 1280, height: 800 });

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-organization-filter"]')).toHaveClass(/ant-select/);
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toHaveClass(/ant-switch/);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"]')).toHaveClass(/ant-radio-group/);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper')).toContainText([
      '全部',
      'Gold Group',
      'Silver Group',
    ]);
    expect(await getFilterControlSpacing(page)).toMatchObject({
      filtersColumnGap: '0px',
      organizationFilterMarginLeft: '8px',
      checkboxMarginLeft: '20px',
      checkboxColumnGap: 'normal',
      markerMarginLeft: '20px',
    });
    expect(await getFilterControlInnerGaps(page)).toMatchObject({
      checkboxColumnGap: 'normal',
      officialTextToSwitchGap: 4,
      organizationTextToSelectGap: 8,
    });
    expect(await getFilterControlDomParity(page)).toMatchObject({
      childSummaries: [
        { tagName: 'SPAN', text: '筛选' },
        { dataId: 'rankland-ranklist-organization-filter', tagName: 'DIV' },
        {
          classList: expect.arrayContaining(['ml-5', 'inline-flex', 'items-center']),
          tagName: 'SPAN',
        },
        { dataId: 'rankland-ranklist-marker-filter', tagName: 'DIV' },
      ],
      directLabelCount: 0,
      filtersClasses: [],
      markerParentDataId: 'rankland-ranklist-filters',
      organizationFilterClasses: expect.arrayContaining(['ml-2']),
      organizationFilterInlineWidth: '160px',
      organizationParentDataId: 'rankland-ranklist-filters',
      organizationParentTagName: 'DIV',
      officialWrapperParentDataId: 'rankland-ranklist-filters',
      officialWrapperTagName: 'SPAN',
    });
    const controlsUtilityClasses = await getControlsUtilityClasses(page);
    expect(controlsUtilityClasses).toMatchObject({
      controlsClasses: [
        'mt-3',
        'mx-4',
        'flex',
        'justify-between',
        'items-center',
      ],
      organizationFilterClasses: expect.arrayContaining(['ml-2']),
      officialWrapperClasses: expect.arrayContaining([
        'ml-5',
        'inline-flex',
        'items-center',
      ]),
      officialTextClasses: expect.arrayContaining(['mr-1']),
      markerFilterClasses: expect.arrayContaining([
        'ml-5',
        'inline-flex',
        'items-center',
      ]),
    });
    expect(controlsUtilityClasses.controlsClasses).not.toContain('rankland-ranklist-controls');
    expect(controlsUtilityClasses.organizationFilterClasses).not.toContain('rankland-ranklist-select');
    expect(controlsUtilityClasses.officialWrapperClasses).not.toContain('rankland-ranklist-checkbox');
    expect(controlsUtilityClasses.markerFilterClasses).not.toContain('rankland-ranklist-marker-filter');

    await page.setViewportSize({ width: 390, height: 844 });
    await reloadRanklistAndWaitForHydration(page);
    expect(await getMobileFilterControlLayout(page)).toMatchObject({
      controlsAlignItems: 'center',
      controlsFlexDirection: 'row',
      filtersAlignItems: 'center',
      filtersColumnGap: '0px',
      filtersFlexDirection: 'row',
      filtersRowGap: '0px',
      markerMarginLeft: '20px',
      officialMarginLeft: '20px',
      organizationFilterWidth: '160px',
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await reloadRanklistAndWaitForHydration(page);
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();

    await selectRanklistOrganization(page, 'Org A', 1);
    await selectRanklistOrganization(page, 'Org B', 2);

    const organizationFilter = page.locator('[data-id="rankland-ranklist-organization-filter"]');
    await expect(organizationFilter.locator('.ant-select-selection-item')).toHaveText('已选择 2 个');

    await reloadRanklistAndWaitForHydration(page);

    await selectRanklistOrganization(page, 'Org A', 1);

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toHaveCount(0);

    await reloadRanklistAndWaitForHydration(page);
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-official-filter"]').click();

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toHaveCount(0);

    await reloadRanklistAndWaitForHydration(page);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper', { hasText: 'Gold Group' }).click();

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toHaveCount(0);
  });

  test('passes the RankLand dark theme into the low-level SRK table renderer', async ({ page, request }) => {
    await denyExternalCalls(page);
    await forceSystemDarkMode(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveClass('dark');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect.poll(() => getRanklistLinkColors(page)).toMatchObject({
      refLinkColor: 'rgb(246, 172, 6)',
      extraRefLinkTriggerColor: 'rgba(255, 255, 255, 0.85)',
      refLinkLineColor: 'rgba(255, 255, 255, 0.85)',
      footerContactTriggerColor: 'rgb(246, 172, 6)',
    });
    for (const selector of [
      '[data-id="rankland-ranklist-export-menu-button"]',
      '[data-id="rankland-ranklist-share-menu-button"]',
    ]) {
      expect(await getHeaderActionTriggerStyle(page, selector)).toMatchObject({
        color: 'rgb(246, 172, 6)',
      });
    }
    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toHaveCSS(
      'color',
      'rgb(167, 119, 11)',
    );
    await page.mouse.move(10, 10);
    await page.locator('[data-id="rankland-ranklist-ref-links"] a').first().hover();
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"] a').first()).toHaveCSS(
      'color',
      'rgb(167, 119, 11)',
    );
    await expect(
      page.locator('[data-id="rankland-ranklist-table-wrapper"] .srk-remarks'),
    ).toHaveCSS('border-top-color', 'rgba(246, 172, 6, 0.8)');

    await expect.poll(async () => {
      return page.locator('.srk-problem-header').first().evaluate((element) => {
        return window.getComputedStyle(element).backgroundImage;
      });
    }).toContain('rgb(15, 23, 42)');

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    await expect.poll(() => getUserModalBodyColor(page)).toBe('rgba(255, 255, 255, 0.85)');
  });

  test('keeps the ranklist page wrappers within desktop and mobile viewport bounds', async ({
    page,
    request,
  }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/ranklist/test-key?focus=yes');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-controls"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-header-actions"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-controls"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-footer"]'), page);
    await page.screenshot({ path: testInfo.outputPath('ranklist-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/ranklist/test-key?focus=yes');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-header-actions"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-controls"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-footer"]'), page);
    await page.screenshot({ path: testInfo.outputPath('ranklist-mobile.png'), fullPage: true });
  });

  test('renders the legacy view count fallback when metadata omits viewCnt', async ({ page, request }) => {
    await denyExternalCalls(page);
    await forceSystemLightMode(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/no-view-count-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('-');
    await expect(page.locator('[data-id="rankland-ranklist-view-count"] .anticon-eye')).toBeVisible();
  });
});
