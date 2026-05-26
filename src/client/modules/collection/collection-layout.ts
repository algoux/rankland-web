export const COLLECTION_COLLAPSED_STORAGE_KEY = 'CollectionNavCollapsed';
export const COLLECTION_MOBILE_LAYOUT_WIDTH = 640;
export const COLLECTION_DESKTOP_NAV_WIDTH = 300;
export const COLLECTION_COLLAPSED_NAV_WIDTH = 80;
export const COLLECTION_NAV_BUTTON_HEIGHT = 40;
export const COLLECTION_WIDTH_TRANSITION = 'width 0.3s cubic-bezier(0.2, 0, 0, 1)';
export const COLLECTION_MARGIN_TRANSITION = 'margin-left 0.3s cubic-bezier(0.2, 0, 0, 1)';

interface CollectionRemainingHeightInput {
  bodyClientHeight: number;
  headerHeight: number;
}

interface CollectionLayoutStateInput {
  clientWidth: number;
  remainingHeight: number;
  collapsed: boolean;
}

export interface CollectionLayoutState {
  isMobileLayout: boolean;
  navWidth: number;
  menuHeight: number;
  ranklistMarginLeft: string;
  ranklistDisplay?: 'none';
}

export function getCollectionRemainingHeight({
  bodyClientHeight,
  headerHeight,
}: CollectionRemainingHeightInput): number {
  return Math.max(0, bodyClientHeight - headerHeight);
}

export function getCollectionLayoutState({
  clientWidth,
  remainingHeight,
  collapsed,
}: CollectionLayoutStateInput): CollectionLayoutState {
  const isMobileLayout = clientWidth < COLLECTION_MOBILE_LAYOUT_WIDTH;
  const navWidth = collapsed
    ? COLLECTION_COLLAPSED_NAV_WIDTH
    : isMobileLayout
      ? clientWidth
      : COLLECTION_DESKTOP_NAV_WIDTH;

  return {
    isMobileLayout,
    navWidth,
    menuHeight: Math.max(0, remainingHeight - COLLECTION_NAV_BUTTON_HEIGHT),
    ranklistMarginLeft: isMobileLayout ? '0px' : `${navWidth}px`,
    ranklistDisplay: isMobileLayout && !collapsed ? 'none' : undefined,
  };
}
