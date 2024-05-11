import { Provide } from 'bwcx-core';
import { LiveContestModel } from '@server/models/live-contest.model';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
  rankland_live_contest_client,
} from '@common/proto/rankland_live_contest';
import { LiveContestEventModel } from '@server/models/live-contest-event.model';

@Provide()
export default class LiveContestService {
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
    const res = await LiveContestEventModel.create({
      contestId,
      eventId,
      type: rankland_live_contest_common.EventType.NEW_SOLUTION,
      solutionId: data.solutionId,
      userId: data.userId,
      problemAlias: data.problemAlias,
      timeValue: data.time.value,
      timeUnit: data.time.unit,
    });
    return {
      _id: res._id.toString(),
    };
  }

  public async insertSolutionOnProgressEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.ISolutionOnProgressEvent,
  ): Promise<void> {
    const contestId = await this.findContestIdByAlias(alias);
    await LiveContestEventModel.create({
      contestId,
      eventId,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
      solutionId: data.solutionId,
      percentageProgress: data.percentageProgress,
    });
  }

  public async insertSolutionOnResultSettleEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.ISolutionOnResultSettleEvent,
  ): Promise<void> {
    const contestId = await this.findContestIdByAlias(alias);
    await LiveContestEventModel.create({
      contestId,
      eventId,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionId: data.solutionId,
      result: data.result,
      timeValue: data.time.value,
      timeUnit: data.time.unit,
    });
  }

  public async insertSolutionOnResultChangeEvent(
    alias: string,
    eventId: number,
    data: rankland_live_contest_common.ISolutionOnResultChangeEvent,
  ): Promise<void> {
    const contestId = await this.findContestIdByAlias(alias);
    await LiveContestEventModel.create({
      contestId,
      eventId,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE,
      solutionId: data.solutionId,
      previousResult: data.previousResult,
      result: data.result,
      timeValue: data.time.value,
      timeUnit: data.time.unit,
    });
  }

  public async handleProducerEvent(alias: string, req: rankland_live_contest_producer.IProducerEvent) {
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
    const res = await LiveContestEventModel.find({ contestId }).sort({ eventId: 1 });
    return res.map((event) => this.encodeEventToClientEvent(event));
  }
}
