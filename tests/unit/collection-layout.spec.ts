import { describe, expect, it } from 'vitest';
import {
  COLLECTION_COLLAPSED_NAV_WIDTH,
  COLLECTION_DESKTOP_NAV_WIDTH,
  COLLECTION_MOBILE_LAYOUT_WIDTH,
  COLLECTION_NAV_BUTTON_HEIGHT,
  getCollectionLayoutState,
  getCollectionRemainingHeight,
} from '@client/modules/collection/collection-layout';

describe('collection-layout helpers', () => {
  it('matches the old remaining-height hook and clamps invalid results', () => {
    expect(getCollectionRemainingHeight({ bodyClientHeight: 900, headerHeight: 64 })).toBe(836);
    expect(getCollectionRemainingHeight({ bodyClientHeight: 900, headerHeight: 0 })).toBe(900);
    expect(getCollectionRemainingHeight({ bodyClientHeight: 48, headerHeight: 64 })).toBe(0);
  });

  it('derives expanded desktop nav, menu, and panel measurements', () => {
    const state = getCollectionLayoutState({
      clientWidth: 1280,
      remainingHeight: 836,
      collapsed: false,
    });

    expect(state).toEqual({
      isMobileLayout: false,
      navWidth: COLLECTION_DESKTOP_NAV_WIDTH,
      menuHeight: 836 - COLLECTION_NAV_BUTTON_HEIGHT,
      ranklistMarginLeft: `${COLLECTION_DESKTOP_NAV_WIDTH}px`,
      ranklistDisplay: undefined,
    });
  });

  it('derives collapsed desktop nav, menu, and panel measurements', () => {
    const state = getCollectionLayoutState({
      clientWidth: 1280,
      remainingHeight: 836,
      collapsed: true,
    });

    expect(state.navWidth).toBe(COLLECTION_COLLAPSED_NAV_WIDTH);
    expect(state.menuHeight).toBe(836 - COLLECTION_NAV_BUTTON_HEIGHT);
    expect(state.ranklistMarginLeft).toBe(`${COLLECTION_COLLAPSED_NAV_WIDTH}px`);
    expect(state.ranklistDisplay).toBeUndefined();
  });

  it('derives expanded mobile nav width and hides the ranklist panel', () => {
    const state = getCollectionLayoutState({
      clientWidth: COLLECTION_MOBILE_LAYOUT_WIDTH - 1,
      remainingHeight: 780,
      collapsed: false,
    });

    expect(state.isMobileLayout).toBe(true);
    expect(state.navWidth).toBe(COLLECTION_MOBILE_LAYOUT_WIDTH - 1);
    expect(state.menuHeight).toBe(780 - COLLECTION_NAV_BUTTON_HEIGHT);
    expect(state.ranklistMarginLeft).toBe('0px');
    expect(state.ranklistDisplay).toBe('none');
  });

  it('derives collapsed mobile nav width and shows the ranklist panel', () => {
    const state = getCollectionLayoutState({
      clientWidth: 390,
      remainingHeight: 32,
      collapsed: true,
    });

    expect(state.isMobileLayout).toBe(true);
    expect(state.navWidth).toBe(COLLECTION_COLLAPSED_NAV_WIDTH);
    expect(state.menuHeight).toBe(0);
    expect(state.ranklistMarginLeft).toBe('0px');
    expect(state.ranklistDisplay).toBeUndefined();
  });
});
