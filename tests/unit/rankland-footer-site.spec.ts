import { describe, expect, it } from 'vitest';
import { createRanklandFooterSiteState } from '@client/components/rankland-footer-site';

describe('createRanklandFooterSiteState', () => {
  it('shows beian text for the RankLand cnn alias', () => {
    expect(
      createRanklandFooterSiteState({
        RANKLAND_SITE_ALIAS: 'cnn',
        SITE_ALIAS: 'global',
        BEIAN: '鲁ICP备00000000号',
      }),
    ).toMatchObject({
      showBeian: true,
      beianText: '鲁ICP备00000000号',
    });
  });

  it('supports the legacy SITE_ALIAS cnn env name', () => {
    expect(
      createRanklandFooterSiteState({
        SITE_ALIAS: 'cnn',
        BEIAN: '鲁ICP备11111111号',
      }),
    ).toMatchObject({
      showBeian: true,
      beianText: '鲁ICP备11111111号',
    });
  });

  it('hides beian for non-cnn aliases', () => {
    expect(
      createRanklandFooterSiteState({
        RANKLAND_SITE_ALIAS: 'global',
        SITE_ALIAS: 'cnn',
        BEIAN: '鲁ICP备00000000号',
      }),
    ).toMatchObject({
      showBeian: false,
      beianText: '鲁ICP备00000000号',
    });
  });
});
