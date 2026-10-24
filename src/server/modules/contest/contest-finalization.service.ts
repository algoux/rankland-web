import { ContestStatus } from '@common/modules/contest/contest-status';
import { Inject, Provide } from 'bwcx-core';
import type { EntityManager } from 'typeorm';
import type { FinalizeContestRespDTO } from '@common/modules/contest/contest.dto';
import { contestSecondsToDuration } from '@common/modules/contest/contest-metadata';
import { ErrCode } from '@common/enums/err-code.enum';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { FileEntity } from '@server/entities/file.entity';
import LogicException from '@server/exceptions/logic.exception';
import FileService from '@server/modules/file/file.service';
import { formatDatabaseDateTimeForApi } from '@server/utils/datetime.util';
import ContestService from './contest.service';
import { FinalContestRanklistBuilder } from './contest-final-ranklist';
import type { ContestEventCacheControl } from './contest-event-cache-control';
import { getContestVisibility } from './contest-event-visibility';

export interface FinalizeContestResult {
  response: FinalizeContestRespDTO;
  control?: ContestEventCacheControl;
}

@Provide()
export default class ContestFinalizationService {
  public constructor(
    @Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient,
    @Inject(ContestService) private readonly contests: ContestService,
    @Inject(FileService) private readonly files: FileService,
  ) {}

  public async finalize(uk: string): Promise<FinalizeContestResult> {
    let uploadedFile: FileEntity | undefined;
    try {
      return await this.runTransaction(uk, async (manager) => {
        const { contest, stream } = await this.contests.findLockedContestAndStream(manager, uk);
        if (contest.status === ContestStatus.Finalized) {
          if (!contest.srkFileId) {
            throw new LogicException(ErrCode.ContestFinalizationInvalidData, 'Finalized contest has no SRK file');
          }
          return { response: finalizationResponse(contest) };
        }
        const ranklist = await this.generateRanklist(manager, contest, stream.streamRevision, stream.lastEventId);
        const buffer = Buffer.from(JSON.stringify(ranklist));
        uploadedFile = this.files.prepareUpload({
          contestId: contest.id,
          category: 'RankMain',
          file: {
            // UK is an API identifier, not a validated filename. Preserve existing valid UKs.
            originalname: `${contest.uk.replace(/[\p{Cc}/\\]/gu, '_')}.srk.json`,
            mimetype: 'application/json',
            buffer,
            size: buffer.length,
          },
        });
        // Track the unique object before uploading: a transport timeout may still have written it.
        await this.files.uploadPrepared(uploadedFile, buffer, 'application/json');
        await manager.getRepository(FileEntity).save(uploadedFile);
        await manager
          .getRepository(ContestEntity)
          .update({ id: contest.id }, { srkFileId: uploadedFile.id, status: ContestStatus.Finalized });
        contest.srkFileId = uploadedFile.id;
        contest.status = ContestStatus.Finalized;
        return { response: finalizationResponse(contest), control: finalizationControl(contest) };
      });
    } catch (error) {
      if (uploadedFile) {
        const recovered = await this.reconcileUpload(uploadedFile);
        if (recovered) return recovered;
      }
      throw error;
    }
  }

  private async runTransaction<T>(operation: string, work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const runner = this.typeOrmClient.getDataSource().createQueryRunner();
    let connection: { destroy?: () => void } | undefined;
    const discardConnection = () => {
      try {
        connection?.destroy?.();
      } catch (error) {
        console.error('[ContestFinalization] failed to discard uncertain session', { operation, error });
      }
    };
    try {
      connection = await runner.connect();
      await runner.startTransaction('REPEATABLE READ');
      const result = await work(runner.manager);
      await runner.commitTransaction();
      return result;
    } catch (error) {
      if (runner.isTransactionActive) {
        try {
          await runner.rollbackTransaction();
        } catch (rollbackError) {
          discardConnection();
          console.error('[ContestFinalization] rollback outcome uncertain', { operation, rollbackError });
        }
      }
      throw error;
    } finally {
      // TypeORM release only returns a session to the pool; it does not roll back.
      // Never let reconciliation (or another request) reuse an unproven transaction.
      if (runner.isTransactionActive) discardConnection();
      try {
        await runner.release();
      } catch (releaseError) {
        discardConnection();
        console.error('[ContestFinalization] connection release failed', { operation, releaseError });
      }
    }
  }

  private async generateRanklist(
    manager: EntityManager,
    contest: ContestEntity,
    streamRevision: number,
    lastEventId: number,
  ) {
    const users = await manager.getRepository(ContestUserEntity).find({
      where: { contestId: contest.id },
      order: { sortIndex: 'ASC', id: 'ASC' },
    });
    const builder = new FinalContestRanklistBuilder({
      uk: contest.uk,
      name: contest.name,
      contest: {
        title: contest.title,
        startAt: formatDatabaseDateTimeForApi(contest.startAt)!,
        duration: contestSecondsToDuration(contest.durationS),
        ...(contest.frozenDurationS !== null
          ? { frozenDuration: contestSecondsToDuration(contest.frozenDurationS) }
          : {}),
        ...(contest.banner ? { banner: contest.banner } : {}),
        ...(contest.refLinks ? { refLinks: contest.refLinks } : {}),
      },
      users: users.map((user) => this.contests.filterUserForPublic(user)),
      problems: contest.problems ?? [],
      markers: contest.markers ?? [],
      series: contest.series ?? [],
      ...(contest.sorter ? { sorter: contest.sorter } : {}),
      ...(contest.contributors ? { contributors: contest.contributors } : {}),
    });
    let afterEventId = 0;
    while (afterEventId < lastEventId) {
      const events = await manager
        .getRepository(ContestEventEntity)
        .createQueryBuilder('event')
        .where('event.contestId = :contestId', { contestId: contest.id })
        .andWhere('event.streamRevision = :streamRevision', { streamRevision })
        .andWhere('event.eventId > :afterEventId', { afterEventId })
        .andWhere('event.eventId <= :lastEventId', { lastEventId })
        .orderBy('event.eventId', 'ASC')
        .limit(1000)
        .getMany();
      if (events.length === 0) {
        throw new LogicException(ErrCode.ContestFinalizationInvalidData, 'Event stream ends before its watermark');
      }
      builder.ingest(events);
      afterEventId = events[events.length - 1].eventId;
    }
    return builder.finish();
  }

  private async reconcileUpload(file: FileEntity): Promise<FinalizeContestResult | undefined> {
    try {
      // Acquire the original contest lock on a new connection. This also waits for an
      // uncertain original COMMIT/ROLLBACK to finish before deciding whether deletion is safe.
      const outcome = await this.runTransaction(`reconcile:${file.id}`, async (manager) => {
        const contest = await manager.getRepository(ContestEntity).findOne({
          where: { id: file.contestId },
          withDeleted: true,
          lock: { mode: 'pessimistic_write' },
        });
        const persistedFile = await manager.getRepository(FileEntity).findOne({
          where: { id: file.id },
          withDeleted: true,
          lock: { mode: 'pessimistic_write' },
        });
        if (
          contest?.status === ContestStatus.Finalized &&
          contest.srkFileId === file.id &&
          persistedFile &&
          !persistedFile.deletedAt
        ) {
          return { recovered: { response: finalizationResponse(contest), control: finalizationControl(contest) } };
        }
        return { removable: !persistedFile && contest?.srkFileId !== file.id };
      });
      if ('recovered' in outcome) {
        return outcome.recovered;
      }
      if (outcome.removable) {
        await this.files.removeUploaded(file);
      } else {
        console.error('[ContestFinalization] uploaded object retained because database still references it', {
          fileId: file.id,
          contestId: file.contestId,
          path: file.path,
        });
      }
    } catch (error) {
      console.error('[ContestFinalization] uploaded object requires reconciliation', {
        fileId: file.id,
        contestId: file.contestId,
        path: file.path,
        error,
      });
    }
    return undefined;
  }
}

function finalizationResponse(contest: ContestEntity): FinalizeContestRespDTO {
  return { uk: contest.uk, status: ContestStatus.Finalized, srkFileID: contest.srkFileId! };
}

function finalizationControl(contest: ContestEntity): ContestEventCacheControl {
  return {
    type: 'metadata',
    contestId: contest.id,
    canonicalUk: contest.uk,
    visibilityFingerprint: getContestVisibility(contest.durationS, contest.frozenDurationS, ContestStatus.Finalized)
      .visibilityFingerprint,
  };
}
