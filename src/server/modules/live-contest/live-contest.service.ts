import { Provide, Inject } from 'bwcx-core';
import Long from 'long';
import { LiveContestModel } from '@server/models/live-contest.model';
import { LiveContestMemberModel, type LiveContestMember } from '@server/models/live-contest-member.model';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
  rankland_live_contest_client,
} from '@common/proto/rankland_live_contest';
import { LiveContestEventModel } from '@server/models/live-contest-event.model';
import MiscUtils from '@server/utils/misc.util';
import type { User } from '@algoux/standard-ranklist';
import type * as srk from '@algoux/standard-ranklist';

export type LiveContestMemberInput = Omit<LiveContestMember, 'contestId' | 'createdAt' | 'updatedAt'>;

@Provide()
export default class LiveContestService {
  public constructor(@Inject() private readonly miscUtils: MiscUtils) {}

  private contestIdCacheMap = new Map<string, string>();

  public async findContestIdByAlias(alias: string): Promise<string> {
    let contestId = this.contestIdCacheMap.get(alias);
    if (contestId) {
      return contestId;
    }
    const existed = await LiveContestModel.findOne({ alias });
    if (!existed) {
      throw new LogicException(ErrCode.LiveContestNotFound);
    }
    contestId = existed._id.toString();
    this.contestIdCacheMap.set(alias, contestId);
    return contestId;
  }

  public async insertNewSolutionEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.INewSolutionEvent,
  ): Promise<{ _id: string }> {
    const contestId = await this.findContestIdByAlias(alias);
    const existed = await LiveContestEventModel.findOne({
      contestId,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      solutionId: data.solutionId,
    });
    if (existed && existed.eventId !== eventId) {
      return {
        _id: existed._id.toString(),
      };
    }
    const res = await LiveContestEventModel.findOneAndUpdate(
      { contestId, eventId },
      {
        type: rankland_live_contest_common.EventType.NEW_SOLUTION,
        solutionId: data.solutionId,
        userId: data.userId,
        problemAlias: data.problemAlias,
        timeValue: data.time.value,
        timeUnit: data.time.unit,
      },
      {
        upsert: true,
        new: true,
      },
    );
    return {
      _id: res._id.toString(),
    };
  }

  public async insertSolutionOnProgressEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.ISolutionOnProgressEvent,
  ): Promise<{ _id: string }> {
    const contestId = await this.findContestIdByAlias(alias);
    const res = await LiveContestEventModel.findOneAndUpdate(
      { contestId, eventId },
      {
        type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
        solutionId: data.solutionId,
        percentageProgress: data.percentageProgress,
      },
      {
        upsert: true,
        new: true,
      },
    );
    return {
      _id: res._id.toString(),
    };
  }

  public async insertSolutionOnResultSettleEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.ISolutionOnResultSettleEvent,
  ): Promise<{ _id: string }> {
    const contestId = await this.findContestIdByAlias(alias);
    const res = await LiveContestEventModel.findOneAndUpdate(
      { contestId, eventId },
      {
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionId: data.solutionId,
        result: data.result,
        timeValue: data.time.value,
        timeUnit: data.time.unit,
      },
      {
        upsert: true,
        new: true,
      },
    );
    return {
      _id: res._id.toString(),
    };
  }

  public async insertSolutionOnResultChangeEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.ISolutionOnResultChangeEvent,
  ): Promise<{ _id: string }> {
    const contestId = await this.findContestIdByAlias(alias);
    const res = await LiveContestEventModel.findOneAndUpdate(
      { contestId, eventId },
      {
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
        solutionId: data.solutionId,
        previousResult: data.previousResult,
        result: data.result,
        timeValue: data.time.value,
        timeUnit: data.time.unit,
      },
      {
        upsert: true,
        new: true,
      },
    );
    return {
      _id: res._id.toString(),
    };
  }

  public async dropEvents(alias: string): Promise<void> {
    const contestId = await this.findContestIdByAlias(alias);
    await LiveContestEventModel.deleteMany({ contestId });
  }

  public async handleProducerEvent(alias: string, req: rankland_live_contest_producer.IProducerEvent) {
    const contestId = await this.findContestIdByAlias(alias);
    switch (req.type) {
      case rankland_live_contest_common.EventType.NEW_SOLUTION: {
        await this.insertNewSolutionEvent(alias, req.eventId, req.newSolutionData);
        break;
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS: {
        await this.insertSolutionOnProgressEvent(alias, req.eventId, req.solutionOnProgressData);
        break;
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE: {
        await this.insertSolutionOnResultSettleEvent(alias, req.eventId, req.solutionOnResultSettleData);
        break;
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE: {
        await this.insertSolutionOnResultChangeEvent(alias, req.eventId, req.solutionOnResultChangeData);
        break;
      }
    }
  }

  public encodeEventToClientEvent(event: any): rankland_live_contest_client.IClientEvent {
    switch (event.type) {
      case rankland_live_contest_common.EventType.NEW_SOLUTION: {
        return {
          eventId: event.eventId,
          type: event.type,
          newSolutionData: {
            solutionId: event.solutionId,
            userId: event.userId,
            problemAlias: event.problemAlias,
            time: {
              value: event.timeValue,
              unit: event.timeUnit,
            },
          },
        };
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS: {
        return {
          eventId: event.eventId,
          type: event.type,
          solutionOnProgressData: {
            solutionId: event.solutionId,
            percentageProgress: event.percentageProgress,
          },
        };
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE: {
        return {
          eventId: event.eventId,
          type: event.type,
          solutionOnResultSettleData: {
            solutionId: event.solutionId,
            result: event.result,
            time: {
              value: event.timeValue,
              unit: event.timeUnit,
            },
          },
        };
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE: {
        return {
          eventId: event.eventId,
          type: event.type,
          solutionOnResultChangeData: {
            solutionId: event.solutionId,
            previousResult: event.previousResult,
            result: event.result,
            time: {
              value: event.timeValue,
              unit: event.timeUnit,
            },
          },
        };
      }
    }
  }

  public async getAllEventsAsClientEvents(alias: string): Promise<rankland_live_contest_client.IClientEvent[]> {
    const contestId = await this.findContestIdByAlias(alias);
    const _s = Date.now();
    const res = await LiveContestEventModel.find({ contestId }).sort({ eventId: 1 });
    const formattedRes = [];
    for (const event of res) {
      formattedRes.push(this.encodeEventToClientEvent(event));
    }
    console.log(`[getAllEventsAsClientEvents] fetch all events data from db: ${Date.now() - _s}ms`);
    return formattedRes;
  }

  public async processEventResult(
    alias: string,
    result: rankland_live_contest_common.Result,
    timeValue: number | Long,
    timeUnit: rankland_live_contest_common.TimeUnit,
  ) {
    if (!result) {
      return result;
    }
    const contestId = await this.findContestIdByAlias(alias);
    const contest = await LiveContestModel.findById(contestId);
    if (!contest) {
      throw new LogicException(ErrCode.LiveContestNotFound);
    }
    const { duration, frozenDuration } = contest.contest;
    // TODO server time diff
    const d = this.miscUtils.convertRLTimeDurationToSrk(timeValue, timeUnit);
    const timeMs = this.miscUtils.formatTimeDuration(d, 'ms');
    const durationMs = this.miscUtils.formatTimeDuration(duration, 'ms');
    const frozenDurationMs = this.miscUtils.formatTimeDuration(frozenDuration, 'ms') || 0;
    const inFrozen = timeMs >= durationMs - frozenDurationMs;
    if (inFrozen) {
      console.log('In frozen', timeMs, 'previous result', result);
      return rankland_live_contest_common.Result.FZ;
    }
    return result;
  }

  public filterMemberForPublic(member: LiveContestMember | any): User {
    const memberObj = member && typeof member.toObject === 'function' ? member.toObject() : member;
    const { _id, contestId, banned, broadcasterToken, index, createdAt, updatedAt, ...publicMember } = memberObj as any;
    return publicMember as User;
  }

  public filterMemberForAdmin(
    member: LiveContestMember | any,
  ): Omit<LiveContestMember, 'contestId' | 'createdAt' | 'updatedAt' | '_id' | 'index'> {
    const memberObj = member && typeof member.toObject === 'function' ? member.toObject() : member;
    const { _id, contestId, createdAt, updatedAt, index, ...adminMember } = memberObj as any;
    return adminMember;
  }

  public async findContestMembers(
    alias: string,
    filters?: {
      userId?: string;
      name?: string;
      organization?: string;
      markerId?: string;
      official?: boolean;
      teamMemberName?: string;
      banned?: boolean;
    },
  ): Promise<LiveContestMember[]> {
    const contestId = await this.findContestIdByAlias(alias);

    const query: any = {
      contestId,
    };

    if (filters) {
      if (filters.userId !== undefined) {
        query.id = filters.userId;
      }

      if (filters.name !== undefined) {
        query.name = { $regex: filters.name, $options: 'i' };
      }

      if (filters.organization !== undefined) {
        query.organization = { $regex: filters.organization, $options: 'i' };
      }

      if (filters.markerId !== undefined) {
        query.markers = filters.markerId;
      }

      if (filters.official !== undefined) {
        if (filters.official) {
          // official === true means "not explicitly false"
          query.$or = [{ official: { $exists: false } }, { official: { $ne: false } }];
        } else {
          query.official = false;
        }
      }

      if (filters.teamMemberName !== undefined) {
        query['teamMembers.name'] = { $regex: filters.teamMemberName, $options: 'i' };
      }

      if (filters.banned !== undefined) {
        query.banned = filters.banned;
      }
    }

    const members = await LiveContestMemberModel.find(query).sort({ index: 1 });
    return members;
  }

  public async findContestMemberById(alias: string, userId: string): Promise<LiveContestMember | null> {
    const contestId = await this.findContestIdByAlias(alias);

    const member = await LiveContestMemberModel.findOne({
      contestId,
      id: userId,
    });

    if (!member) {
      return null;
    }

    return member;
  }

  public async upsertContestMembers(contestId: string, members: LiveContestMemberInput[]): Promise<void> {
    if (!members || members.length === 0) {
      return;
    }

    const operations = members.map((member, index) => ({
      updateOne: {
        filter: { contestId, id: member.id },
        update: {
          $set: {
            ...member,
            banned: member.banned === undefined ? false : member.banned,
            contestId,
            index,
          },
        },
        upsert: true,
      },
    }));

    await LiveContestMemberModel.bulkWrite(operations);
  }

  public async replaceContestMembers(contestId: string, members: LiveContestMemberInput[]): Promise<void> {
    const requestedMemberIds = new Set(members.map((m) => m.id));
    const existingMembers = await LiveContestMemberModel.find({ contestId });
    const existingMemberIds = new Set(existingMembers.map((m) => m.id));

    const idsToDelete = Array.from(existingMemberIds).filter((id) => !requestedMemberIds.has(id));
    if (idsToDelete.length > 0) {
      await LiveContestMemberModel.deleteMany({
        contestId,
        id: { $in: idsToDelete },
      });
    }

    if (members.length > 0) {
      const operations = members.map((member, index) => {
        return {
          updateOne: {
            filter: { contestId, id: member.id },
            update: {
              $set: {
                ...member,
                banned: member.banned === undefined ? false : member.banned,
                contestId,
                index,
              },
            },
            upsert: true,
          },
        };
      });

      await LiveContestMemberModel.bulkWrite(operations);
    }
  }

  public async updateContestMember(
    alias: string,
    userId: string,
    data: {
      name?: string | srk.I18NStringSet | null;
      official?: boolean | null;
      avatar?: string | srk.Image | null;
      photo?: string | srk.Image | null;
      organization?: string | srk.I18NStringSet | null;
      location?: string | null;
      teamMembers?: srk.ExternalUser[] | null;
      markers?: string[] | null;
      banned?: boolean | null;
      broadcasterToken?: string | null;
      index?: number | null;
    },
  ): Promise<void> {
    const contestId = await this.findContestIdByAlias(alias);
    const member = await LiveContestMemberModel.findOne({ contestId, id: userId });
    if (!member) {
      throw new LogicException(ErrCode.LiveContestMemberNotFound);
    }

    const updateData: any = {};
    const unsetData: any = {};

    // 处理每个字段：undefined 表示不更新，null 表示删除字段，其他值表示更新
    if (data.name !== undefined) {
      if (data.name === null) {
        unsetData.name = '';
      } else {
        updateData.name = data.name;
      }
    }
    if (data.official !== undefined) {
      if (data.official === null) {
        unsetData.official = '';
      } else {
        updateData.official = data.official;
      }
    }
    if (data.avatar !== undefined) {
      if (data.avatar === null) {
        unsetData.avatar = '';
      } else {
        updateData.avatar = data.avatar;
      }
    }
    if (data.photo !== undefined) {
      if (data.photo === null) {
        unsetData.photo = '';
      } else {
        updateData.photo = data.photo;
      }
    }
    if (data.organization !== undefined) {
      if (data.organization === null) {
        unsetData.organization = '';
      } else {
        updateData.organization = data.organization;
      }
    }
    if (data.location !== undefined) {
      if (data.location === null) {
        unsetData.location = '';
      } else {
        updateData.location = data.location;
      }
    }
    if (data.teamMembers !== undefined) {
      if (data.teamMembers === null) {
        unsetData.teamMembers = '';
      } else {
        updateData.teamMembers = data.teamMembers;
      }
    }
    if (data.markers !== undefined) {
      if (data.markers === null) {
        unsetData.markers = '';
      } else {
        updateData.markers = data.markers;
      }
    }
    if (data.banned !== undefined) {
      if (data.banned === null) {
        unsetData.banned = '';
      } else {
        updateData.banned = data.banned;
      }
    }
    if (data.broadcasterToken !== undefined) {
      if (data.broadcasterToken === null) {
        unsetData.broadcasterToken = '';
      } else {
        updateData.broadcasterToken = data.broadcasterToken;
      }
    }

    const updateQuery: any = {};
    if (Object.keys(updateData).length > 0) {
      updateQuery.$set = updateData;
    }
    if (Object.keys(unsetData).length > 0) {
      updateQuery.$unset = unsetData;
    }

    if (Object.keys(updateQuery).length > 0) {
      await LiveContestMemberModel.updateOne({ contestId, id: userId }, updateQuery);
    }
  }
}
