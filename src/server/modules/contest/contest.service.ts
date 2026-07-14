import { Inject, Provide } from 'bwcx-core';
import { DataSource, EntityManager, FindOptionsWhere, In } from 'typeorm';
import type { User } from '@algoux/standard-ranklist';
import type * as srk from '@algoux/standard-ranklist';
import TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import IdGeneratorService, { IdGenerator } from '@server/services/id-generator.service';

export type ContestUserInput = srk.User & {
  banned?: boolean;
  broadcasterToken?: string;
};

type ContestCreateInput = Pick<
  ContestEntity,
  'uk' | 'name' | 'contest' | 'problems' | 'markers' | 'series' | 'sorter' | 'contributors'
> & {
  users?: ContestUserInput[];
};

type ContestUpdateInput = Partial<
  Pick<ContestEntity, 'name' | 'contest' | 'problems' | 'markers' | 'series' | 'sorter' | 'contributors'>
> & {
  uk: string;
  users?: ContestUserInput[] | null;
};

@Provide()
export default class ContestService {
  public constructor(
    @Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient,
    @Inject(IdGeneratorService) private readonly idGenerator: IdGenerator,
  ) {}

  private contestIdCacheMap = new Map<string, string>();

  private get dataSource(): DataSource {
    return this.typeOrmClient.getDataSource();
  }

  public async findContestIdByUk(uk: string): Promise<string> {
    let contestId = this.contestIdCacheMap.get(uk);
    if (contestId) {
      return contestId;
    }
    const contest = await this.dataSource.getRepository(ContestEntity).findOne({ where: { uk } });
    if (!contest) {
      throw new LogicException(ErrCode.ContestNotFound);
    }
    contestId = contest.id;
    this.contestIdCacheMap.set(uk, contestId);
    return contestId;
  }

  private async findContestIdByUkWithManager(manager: EntityManager, uk: string): Promise<string> {
    const contest = await manager.getRepository(ContestEntity).findOne({ where: { uk } });
    if (!contest) {
      throw new LogicException(ErrCode.ContestNotFound);
    }
    this.contestIdCacheMap.set(uk, contest.id);
    return contest.id;
  }

  public async createContest(data: ContestCreateInput): Promise<{ _id: string }> {
    return this.dataSource.transaction(async (manager) => {
      const existed = await manager.getRepository(ContestEntity).findOne({ where: { uk: data.uk } });
      if (existed) {
        throw new LogicException(ErrCode.ContestExisted);
      }

      const contest = manager.getRepository(ContestEntity).create({
        id: this.idGenerator.nextId(),
        uk: data.uk,
        name: data.name,
        contest: data.contest,
        problems: data.problems || [],
        markers: data.markers || [],
        series: data.series || [],
        sorter: data.sorter || null,
        contributors: data.contributors || null,
      });
      const savedContest = await manager.getRepository(ContestEntity).save(contest);

      await manager.getRepository(ContestEventStreamEntity).save(
        manager.getRepository(ContestEventStreamEntity).create({
          contestId: savedContest.id,
          lastEventId: 0,
          streamRevision: 1,
          producerId: null,
          producerLockedAt: null,
        }),
      );

      if (data.users?.length) {
        await this.upsertContestUsersWithManager(manager, savedContest.id, data.users);
      }

      this.contestIdCacheMap.set(savedContest.uk, savedContest.id);
      return { _id: savedContest.id };
    });
  }

  public async updateContest(data: ContestUpdateInput): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const contest = await manager.getRepository(ContestEntity).findOne({ where: { uk: data.uk } });
      if (!contest) {
        throw new LogicException(ErrCode.ContestNotFound);
      }

      const updateData: Partial<ContestEntity> = {};
      for (const key of ['name', 'contest', 'problems', 'markers', 'series', 'sorter', 'contributors'] as const) {
        if (data[key] !== undefined) {
          (updateData as any)[key] = data[key];
        }
      }

      if (Object.keys(updateData).length > 0) {
        await manager.getRepository(ContestEntity).update({ id: contest.id }, updateData);
      }

      if (data.users !== undefined) {
        if (Array.isArray(data.users)) {
          await this.replaceContestUsersWithManager(manager, contest.id, data.users);
        } else {
          await manager.getRepository(ContestUserEntity).delete({ contestId: contest.id });
        }
      }
    });
  }

  public async dropEvents(uk: string): Promise<ContestEventStreamEntity> {
    return this.dataSource.transaction(async (manager) => {
      const contestId = await this.findContestIdByUkWithManager(manager, uk);
      const stream = await manager.getRepository(ContestEventStreamEntity).findOne({
        where: { contestId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!stream) {
        throw new LogicException(ErrCode.ContestNotFound);
      }
      stream.lastEventId = 0;
      stream.streamRevision += 1;
      stream.producerId = null;
      stream.producerLockedAt = null;
      return manager.getRepository(ContestEventStreamEntity).save(stream);
    });
  }

  public async getContest(uk: string): Promise<ContestEntity> {
    const contest = await this.dataSource.getRepository(ContestEntity).findOne({ where: { uk } });
    if (!contest) {
      throw new LogicException(ErrCode.ContestNotFound);
    }
    return contest;
  }

  public async getContestWithUsers(uk: string, admin: boolean) {
    const contest = await this.getContest(uk);
    const users = await this.findContestUsers(uk);
    return {
      _id: contest.id,
      uk: contest.uk,
      name: contest.name,
      contest: contest.contest,
      problems: contest.problems,
      users: users.map((user) => (admin ? this.filterUserForAdmin(user) : this.filterUserForPublic(user))),
      markers: contest.markers,
      series: contest.series,
      sorter: contest.sorter,
      contributors: contest.contributors,
    };
  }

  public filterUserForPublic(user: ContestUserEntity | any): User {
    const userObj = this.userEntityToPlain(user);
    const { contestId, banned, broadcasterToken, sortIndex, createdAt, updatedAt, ...publicUser } = userObj as any;
    return publicUser as User;
  }

  public filterUserForAdmin(
    user: ContestUserEntity | any,
  ): Omit<ContestUserInput, 'contestId' | 'createdAt' | 'updatedAt' | '_id' | 'index'> {
    const userObj = this.userEntityToPlain(user);
    const { contestId, createdAt, updatedAt, sortIndex, ...adminUser } = userObj as any;
    return adminUser;
  }

  public async findContestUsers(
    uk: string,
    filters?: {
      userId?: string;
      name?: string;
      organization?: string;
      markerId?: string;
      official?: boolean;
      teamMemberName?: string;
      banned?: boolean;
    },
  ): Promise<ContestUserEntity[]> {
    const contestId = await this.findContestIdByUk(uk);
    const where: FindOptionsWhere<ContestUserEntity> = { contestId };
    if (filters?.userId !== undefined) {
      where.userId = filters.userId;
    }
    if (filters?.official !== undefined) {
      where.official = filters.official;
    }
    if (filters?.banned !== undefined) {
      where.banned = filters.banned;
    }

    const users = await this.dataSource.getRepository(ContestUserEntity).find({
      where,
      order: { sortIndex: 'ASC' },
    });

    return users.filter((user) => this.userMatchesFilters(user, filters));
  }

  public async findContestUserById(uk: string, userId: string): Promise<ContestUserEntity | null> {
    const contestId = await this.findContestIdByUk(uk);
    return this.dataSource.getRepository(ContestUserEntity).findOne({
      where: {
        contestId,
        userId,
      },
    });
  }

  public async upsertContestUsers(contestId: string, users: ContestUserInput[]): Promise<void> {
    await this.dataSource.transaction((manager) => this.upsertContestUsersWithManager(manager, contestId, users));
  }

  public async replaceContestUsers(contestId: string, users: ContestUserInput[]): Promise<void> {
    await this.dataSource.transaction((manager) => this.replaceContestUsersWithManager(manager, contestId, users));
  }

  public async updateContestUser(
    uk: string,
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
    const user = await this.findContestUserById(uk, userId);
    if (!user) {
      throw new LogicException(ErrCode.ContestUserNotFound);
    }

    const updateData: Partial<ContestUserEntity> = {};
    const assignNullable = <K extends keyof ContestUserEntity>(key: K, value: any) => {
      if (value !== undefined) {
        (updateData as any)[key] = value === null ? null : value;
      }
    };

    assignNullable('name', data.name);
    assignNullable('official', data.official);
    assignNullable('avatar', data.avatar);
    assignNullable('photo', data.photo);
    assignNullable('organization', data.organization);
    assignNullable('location', data.location);
    assignNullable('teamMembers', data.teamMembers);
    assignNullable('markers', data.markers);
    assignNullable('banned', data.banned);
    assignNullable('broadcasterToken', data.broadcasterToken);
    if (data.index !== undefined && data.index !== null) {
      updateData.sortIndex = data.index;
    }

    if (Object.keys(updateData).length > 0) {
      await this.dataSource.getRepository(ContestUserEntity).update({ id: user.id }, updateData);
    }
  }

  private async upsertContestUsersWithManager(
    manager: EntityManager,
    contestId: string,
    users: ContestUserInput[],
  ): Promise<void> {
    if (!users?.length) {
      return;
    }

    for (const [index, user] of users.entries()) {
      const existed = await manager.getRepository(ContestUserEntity).findOne({
        where: { contestId, userId: user.id },
      });
      const entity = manager.getRepository(ContestUserEntity).create({
        ...(existed || {}),
        id: existed?.id ?? this.idGenerator.nextId(),
        contestId,
        userId: user.id,
        name: user.name,
        official: user.official === undefined ? true : user.official,
        avatar: user.avatar || null,
        photo: user.photo || null,
        organization: user.organization || null,
        location: user.location || null,
        teamMembers: user.teamMembers || null,
        markers: user.markers || null,
        banned: user.banned === undefined ? false : user.banned,
        broadcasterToken: user.broadcasterToken || null,
        sortIndex: index,
      });
      await manager.getRepository(ContestUserEntity).save(entity);
    }
  }

  private async replaceContestUsersWithManager(
    manager: EntityManager,
    contestId: string,
    users: ContestUserInput[],
  ): Promise<void> {
    const requestedUserIds = new Set(users.map((user) => user.id));
    const existingUsers = await manager.getRepository(ContestUserEntity).find({ where: { contestId } });
    const idsToDelete = existingUsers.filter((user) => !requestedUserIds.has(user.userId)).map((user) => user.userId);
    if (idsToDelete.length > 0) {
      await manager.getRepository(ContestUserEntity).delete({ contestId, userId: In(idsToDelete) });
    }
    await this.upsertContestUsersWithManager(manager, contestId, users);
  }

  private userEntityToPlain(user: ContestUserEntity | any) {
    return {
      id: user.userId || user.id,
      name: user.name,
      official: user.official,
      avatar: user.avatar,
      photo: user.photo,
      organization: user.organization,
      location: user.location,
      teamMembers: user.teamMembers,
      markers: user.markers,
      banned: user.banned,
      broadcasterToken: user.broadcasterToken,
      contestId: user.contestId,
      sortIndex: user.sortIndex,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private userMatchesFilters(
    user: ContestUserEntity,
    filters?: {
      userId?: string;
      name?: string;
      organization?: string;
      markerId?: string;
      official?: boolean;
      teamMemberName?: string;
      banned?: boolean;
    },
  ) {
    if (!filters) {
      return true;
    }
    if (filters.markerId !== undefined && !(user.markers || []).includes(filters.markerId)) {
      return false;
    }
    if (filters.name !== undefined && !jsonTextIncludes(user.name, filters.name)) {
      return false;
    }
    if (filters.organization !== undefined && !jsonTextIncludes(user.organization, filters.organization)) {
      return false;
    }
    if (
      filters.teamMemberName !== undefined &&
      !(user.teamMembers || []).some((teamMember) => jsonTextIncludes(teamMember.name, filters.teamMemberName))
    ) {
      return false;
    }
    return true;
  }
}

function jsonTextIncludes(value: unknown, query: string): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  return JSON.stringify(value).toLowerCase().includes(query.toLowerCase());
}
