import { Provide, Inject } from 'bwcx-core';
import Long from 'long';
import { LiveContestModel } from '@server/models/live-contest.model';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
  rankland_live_contest_client,
} from '@common/proto/rankland_live_contest';
import { LiveContestEventModel } from '@server/models/live-contest-event.model';
import MiscUtils from '@server/utils/misc.util';

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
        const firstNewSolutionEvent = await LiveContestEventModel.findOne({
          contestId,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          solutionId: req.solutionOnResultSettleData.solutionId,
        });
        if (firstNewSolutionEvent) {
          const timeValue = firstNewSolutionEvent.timeValue;
          const timeUnit = firstNewSolutionEvent.timeUnit;
          req.solutionOnResultSettleData.result = await this.processEventResult(
            alias,
            req.solutionOnResultSettleData.result,
            timeValue,
            timeUnit,
          );
        } else {
          console.warn(
            'No NewSolution event found for',
            contestId,
            alias,
            req.solutionOnResultSettleData.solutionId,
            req.eventId,
          );
        }
        break;
      }
      case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE: {
        await this.insertSolutionOnResultChangeEvent(alias, req.eventId, req.solutionOnResultChangeData);
        const firstNewSolutionEvent = await LiveContestEventModel.findOne({
          contestId,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          solutionId: req.solutionOnResultChangeData.solutionId,
        });
        if (firstNewSolutionEvent) {
          const timeValue = firstNewSolutionEvent.timeValue;
          const timeUnit = firstNewSolutionEvent.timeUnit;
          req.solutionOnResultChangeData.result = await this.processEventResult(
            alias,
            req.solutionOnResultChangeData.result,
            timeValue,
            timeUnit,
          );
        } else {
          console.warn(
            'No NewSolution event found for',
            contestId,
            alias,
            req.solutionOnResultChangeData.solutionId,
            req.eventId,
          );
        }
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
    const res = await LiveContestEventModel.find({ contestId }).sort({ eventId: 1 });
    const formattedRes = [];
    for (const event of res) {
      // 对于 result settle 和 change，时间需要为 new solution 的时间
      switch (event.type) {
        case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE:
        case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE: {
          const firstNewSolutionEvent = await LiveContestEventModel.findOne({
            contestId,
            type: rankland_live_contest_common.EventType.NEW_SOLUTION,
            solutionId: event.solutionId,
          });
          if (firstNewSolutionEvent) {
            const timeValue = firstNewSolutionEvent.timeValue;
            const timeUnit = firstNewSolutionEvent.timeUnit;
            event.result = await this.processEventResult(alias, event.result, timeValue, timeUnit);
          } else {
            console.warn('No NewSolution event found for', contestId, alias, event.solutionId, event.eventId);
          }
          break;
        }
      }
      formattedRes.push(this.encodeEventToClientEvent(event));
    }
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
}
