import type * as srk from '@algoux/standard-ranklist';
import type { CSSProperties } from 'vue';

export interface StyledRanklistRendererProps {
  data: srk.Ranklist;
  name: string;
  id?: string;
  meta?: {
    viewCnt?: number;
  };
  showFooter?: boolean;
  showFilter?: boolean;
  showProgress?: boolean;
  isLive?: boolean;
  tableClass?: string;
  tableStyle?: CSSProperties;
}
