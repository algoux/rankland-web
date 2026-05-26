import icpcLogoLight from './assets/icpc_logo_black.png';
import icpcLogoDark from './assets/icpc_logo_white.png';
import ccpcLogoLight from './assets/ccpc_logo_black.png';
import ccpcLogoDark from './assets/ccpc_logo_white.png';
import provincialCpcLogoLight from './assets/provincial_cpc_logo_black.png';
import provincialCpcLogoDark from './assets/provincial_cpc_logo_white.png';
import universityLevelCpcLogoLight from './assets/university-level_cpc_logo_black.png';
import universityLevelCpcLogoDark from './assets/university-level_cpc_logo_white.png';

export interface CollectionCategoryIcon {
  alt: string;
  dark: string;
  light: string;
}

const CATEGORY_ICONS: Record<string, CollectionCategoryIcon> = {
  'dir-icpc': {
    alt: 'ICPC',
    light: icpcLogoLight,
    dark: icpcLogoDark,
  },
  'dir-ccpc': {
    alt: 'CCPC',
    light: ccpcLogoLight,
    dark: ccpcLogoDark,
  },
  'dir-provincial': {
    alt: 'Provincial CPC',
    light: provincialCpcLogoLight,
    dark: provincialCpcLogoDark,
  },
  'dir-university-level': {
    alt: 'University Level CPC',
    light: universityLevelCpcLogoLight,
    dark: universityLevelCpcLogoDark,
  },
};

export function getCollectionCategoryIcon(key: string): CollectionCategoryIcon | undefined {
  return CATEGORY_ICONS[key];
}
