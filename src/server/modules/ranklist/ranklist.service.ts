import { Inject, Provide } from 'bwcx-core';
import ContestService from '@server/modules/contest/contest.service';

export interface IApiRanklistInfo {
  id: string;
  uniqueKey: string;
  name: string;
  fileID: string;
  viewCnt: number;
  content?: string;
  createdAt: string;
  updatedAt?: string;
}

@Provide()
export class RanklistService {
  public constructor(
    @Inject(ContestService)
    private readonly contestService: ContestService,
  ) {}

  public async getAllRanklists(): Promise<IApiRanklistInfo[]> {
    const { contests } = await this.contestService.listContests(false);

    return contests
      .flatMap((contest): IApiRanklistInfo[] => {
        if (!contest.srkFileID) {
          return [];
        }

        return [{
          id: contest._id,
          uniqueKey: contest.uk,
          name: contest.name,
          fileID: contest.srkFileID,
          viewCnt: contest.viewCount,
          createdAt: contest.createdAt,
          updatedAt: contest.updatedAt,
        }];
      })
      .sort(compareRanklistsNewestFirst);
  }
}

export default RanklistService;

function compareRanklistsNewestFirst(left: IApiRanklistInfo, right: IApiRanklistInfo): number {
  const leftCreatedAt = Date.parse(left.createdAt);
  const rightCreatedAt = Date.parse(right.createdAt);
  if (leftCreatedAt !== rightCreatedAt) {
    return rightCreatedAt - leftCreatedAt;
  }

  if (/^\d+$/.test(left.id) && /^\d+$/.test(right.id) && left.id.length !== right.id.length) {
    return right.id.length - left.id.length;
  }
  return right.id.localeCompare(left.id);
}
