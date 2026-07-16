import { Contract, Data, Delete, Get, InjectCtx, Patch, Post, RequestContext, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { ApiController } from '@server/decorators';
import AuthGuard from '@server/guards/auth.guard';
import {
  AppendContestEventsReqDTO,
  AppendContestEventsRespDTO,
  CreateContestReqDTO,
  CreateContestRespDTO,
  GetContestReqDTO,
  GetPublicContestEventsReqDTO,
  GetPublicContestEventsRespDTO,
  GetContestRespDTO,
  GetPublicContestReqDTO,
  GetPublicContestRespDTO,
  UpdateContestReqDTO,
  ResetContestEventsReqDTO,
  GetContestEventStreamReqDTO,
  GetContestEventStreamRespDTO,
  GetPublicContestEventStreamReqDTO,
  GetPublicContestEventStreamRespDTO,
  GetPublicContestUsersReqDTO,
  GetPublicContestUsersRespDTO,
  GetPublicContestUserReqDTO,
  GetPublicContestUserRespDTO,
  GetContestUsersReqDTO,
  GetContestUsersRespDTO,
  GetContestUserReqDTO,
  GetContestUserRespDTO,
  DeleteContestEventStreamProducerLockReqDTO,
  UpdateContestUserReqDTO,
  StreamPublicContestEventStreamNotificationsReqDTO,
  GetPublicContestsRespDTO,
  GetPublicStatisticsRespDTO,
  GetContestsRespDTO,
  ReportPublicContestViewReqDTO,
  DeleteContestReqDTO,
} from '@common/modules/contest/contest.dto';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import ContestService from './contest.service';
import ContestEventStreamService from './contest-event-stream.service';
import ContestEventNotificationCoordinator from './contest-event-notification';
import { getContestEventsResponseToJson, parseProducerBatchJson } from './contest-event-codec';
import { ProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { Sse } from '@server/decorators/sse.decorator';
import { rankland_live_contest_client, rankland_live_contest_producer } from '@common/proto/rankland_live_contest';

@ApiController('/v2')
export default class ContestController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject()
    private readonly service: ContestService,

    @Inject()
    private readonly eventStreamService: ContestEventStreamService,

    @Inject()
    private readonly notificationCoordinator: ContestEventNotificationCoordinator,
  ) {}

  @Api.Summary('创建实时比赛')
  @Post('/contests')
  @UseGuards(AuthGuard)
  @Contract(CreateContestReqDTO, CreateContestRespDTO)
  public async createContest(@Data() data: CreateContestReqDTO): Promise<CreateContestRespDTO> {
    return this.service.createContest(data as any);
  }

  @Api.Summary('更新实时比赛')
  @Patch('/contests/:uk')
  @UseGuards(AuthGuard)
  @Contract(UpdateContestReqDTO, null)
  public async updateContest(@Data() data: UpdateContestReqDTO) {
    await this.service.updateContest(data as any);
  }

  @Api.Summary('查询全部实时比赛')
  @Get('/contests')
  @UseGuards(AuthGuard)
  @Contract(null, GetContestsRespDTO)
  public async getContests(): Promise<GetContestsRespDTO> {
    return this.service.listContests(true) as Promise<GetContestsRespDTO>;
  }

  @Api.Summary('公开查询全部实时比赛')
  @Get('/public/contests')
  @Contract(null, GetPublicContestsRespDTO)
  public async getPublicContests(): Promise<GetPublicContestsRespDTO> {
    return this.service.listContests(false) as Promise<GetPublicContestsRespDTO>;
  }

  @Api.Summary('公开查询榜单统计')
  @Get('/public/statistics')
  @Contract(null, GetPublicStatisticsRespDTO)
  public async getPublicStatistics(): Promise<GetPublicStatisticsRespDTO> {
    return this.service.getPublicStatistics();
  }

  @Api.Summary('上报一次实时比赛浏览')
  @Post('/public/contests/:uk/views')
  @Contract(ReportPublicContestViewReqDTO, null)
  public async reportPublicContestView(@Data() data: ReportPublicContestViewReqDTO) {
    await this.service.reportView(data.uk);
  }

  @Api.Summary('删除实时比赛')
  @Delete('/contests/:uk')
  @UseGuards(AuthGuard)
  @Contract(DeleteContestReqDTO, null)
  public async deleteContest(@Data() data: DeleteContestReqDTO) {
    await this.service.deleteContest(data.uk);
  }

  @Api.Summary('重置实时比赛事件流')
  @Post('/contests/:uk/events/reset')
  @UseGuards(AuthGuard)
  @Contract(ResetContestEventsReqDTO, null)
  public async resetContestEvents(@Data() data: ResetContestEventsReqDTO) {
    const watermark = await this.service.dropEvents(data.uk);
    await this.notificationCoordinator.announceCommitted(watermark);
  }

  @Api.Summary('追加实时比赛事件')
  @Post('/contests/:uk/events')
  @UseGuards(AuthGuard)
  @Contract(AppendContestEventsReqDTO, AppendContestEventsRespDTO)
  @ProtobufContract(rankland_live_contest_producer.BatchProducerEvent, null)
  public async appendContestEvents(@Data() data: AppendContestEventsReqDTO): Promise<AppendContestEventsRespDTO> {
    const producerId = this.ctx.headers['x-producer-id'] as string;
    const batch = parseProducerBatchJson({ streamRevision: data.streamRevision, events: data.events });
    const result = await this.eventStreamService.appendProducerEvents({
      uk: data.uk,
      producerId,
      batch,
    });
    await this.notificationCoordinator.announceCommitted({
      contestId: result.contestId,
      canonicalUk: result.canonicalUk,
      latestEventId: result.lastEventId,
      streamRevision: result.streamRevision,
    });
    return {
      acceptedEventIds: result.acceptedEventIds,
      duplicateEventIds: result.duplicateEventIds,
      lastEventId: result.lastEventId,
      expectedNextEventId: result.expectedNextEventId,
      streamRevision: result.streamRevision,
    };
  }

  @Api.Summary('公开查询实时比赛事件')
  @Get('/public/contests/:uk/events')
  @Contract(GetPublicContestEventsReqDTO, GetPublicContestEventsRespDTO)
  @ProtobufContract(null, rankland_live_contest_client.GetContestEventsResponse)
  public async getPublicContestEvents(@Data() data: GetPublicContestEventsReqDTO): Promise<any> {
    const result = await this.eventStreamService.getClientEvents({
      uk: data.uk,
      afterEventId: data.afterEventId ?? 0,
      limit: data.limit ?? 1000,
      streamRevision: data.streamRevision,
      compactProgress: data.compactProgress,
    });
    // Return a single serialization-ready object. The default response handler
    // wraps it as JSON or encodes it to protobuf based on the negotiated type.
    return getContestEventsResponseToJson(result);
  }

  @Api.Summary('公开实时比赛事件流通知')
  @Get('/public/contests/:uk/event-stream/notifications')
  @Sse()
  @Contract(StreamPublicContestEventStreamNotificationsReqDTO, null)
  public async streamPublicContestEventStreamNotifications(
    @Data() data: StreamPublicContestEventStreamNotificationsReqDTO,
  ) {
    // ContentNegotiation + SSE middleware have already opened the event stream
    // (headers, ctx.respond = false). Here we only do the business hookup.
    await this.notificationCoordinator.attachClient(data.uk, this.ctx.res);
  }

  @Api.Summary('查询实时比赛事件流')
  @Get('/contests/:uk/event-stream')
  @UseGuards(AuthGuard)
  @Contract(GetContestEventStreamReqDTO, GetContestEventStreamRespDTO)
  public async getContestEventStream(@Data() data: GetContestEventStreamReqDTO): Promise<GetContestEventStreamRespDTO> {
    return this.eventStreamService.getStreamState(data.uk);
  }

  @Api.Summary('公开查询实时比赛事件流')
  @Get('/public/contests/:uk/event-stream')
  @Contract(GetPublicContestEventStreamReqDTO, GetPublicContestEventStreamRespDTO)
  public async getPublicContestEventStream(
    @Data() data: GetPublicContestEventStreamReqDTO,
  ): Promise<GetPublicContestEventStreamRespDTO> {
    const stream = await this.eventStreamService.getStreamState(data.uk);
    return {
      uk: stream.uk,
      lastEventId: stream.lastEventId,
      streamRevision: stream.streamRevision,
    };
  }

  @Api.Summary('释放实时比赛事件流生产者锁')
  @Delete('/contests/:uk/event-stream/producer-lock')
  @UseGuards(AuthGuard)
  @Contract(DeleteContestEventStreamProducerLockReqDTO, GetContestEventStreamRespDTO)
  public async deleteContestEventStreamProducerLock(
    @Data() data: DeleteContestEventStreamProducerLockReqDTO,
  ): Promise<GetContestEventStreamRespDTO> {
    return this.eventStreamService.releaseProducerLock(data.uk);
  }

  @Api.Summary('查询实时比赛')
  @Get('/contests/:uk')
  @UseGuards(AuthGuard)
  @Contract(GetContestReqDTO, GetContestRespDTO)
  public async getContest(@Data() data: GetContestReqDTO): Promise<GetContestRespDTO> {
    return this.service.getContestWithUsers(data.uk, true) as any;
  }

  @Api.Summary('公开查询实时比赛')
  @Get('/public/contests/:uk')
  @Contract(GetPublicContestReqDTO, GetPublicContestRespDTO)
  public async getPublicContest(@Data() data: GetPublicContestReqDTO): Promise<GetPublicContestRespDTO> {
    return this.service.getContestWithUsers(data.uk, false) as any;
  }

  @Api.Summary('公开查询实时比赛用户')
  @Get('/public/contests/:uk/users')
  @Contract(GetPublicContestUsersReqDTO, GetPublicContestUsersRespDTO)
  public async getPublicContestUsers(@Data() data: GetPublicContestUsersReqDTO): Promise<GetPublicContestUsersRespDTO> {
    const users = await this.service.findContestUsers(data.uk, {
      userId: data.userId,
      name: data.name,
      organization: data.organization,
      markerId: data.markerId,
      official: data.official,
      teamMemberName: data.teamMemberName,
    });
    const filteredUsers = users.map((user) => this.service.filterUserForPublic(user));
    return { users: filteredUsers as any };
  }

  @Api.Summary('公开查询实时比赛用户详情')
  @Get('/public/contests/:uk/users/:userId')
  @Contract(GetPublicContestUserReqDTO, GetPublicContestUserRespDTO)
  public async getPublicContestUser(@Data() data: GetPublicContestUserReqDTO): Promise<GetPublicContestUserRespDTO> {
    const user = await this.service.findContestUserById(data.uk, data.userId);
    if (!user) {
      throw new LogicException(ErrCode.ContestUserNotFound);
    }
    return this.service.filterUserForPublic(user) as GetPublicContestUserRespDTO;
  }

  @Api.Summary('查询实时比赛用户')
  @Get('/contests/:uk/users')
  @UseGuards(AuthGuard)
  @Contract(GetContestUsersReqDTO, GetContestUsersRespDTO)
  public async getContestUsers(@Data() data: GetContestUsersReqDTO): Promise<GetContestUsersRespDTO> {
    const users = await this.service.findContestUsers(data.uk);
    const filteredUsers = users.map((user) => this.service.filterUserForAdmin(user));
    return { users: filteredUsers as any };
  }

  @Api.Summary('查询实时比赛用户详情')
  @Get('/contests/:uk/users/:userId')
  @UseGuards(AuthGuard)
  @Contract(GetContestUserReqDTO, GetContestUserRespDTO)
  public async getContestUser(@Data() data: GetContestUserReqDTO): Promise<GetContestUserRespDTO> {
    const user = await this.service.findContestUserById(data.uk, data.userId);
    if (!user) {
      throw new LogicException(ErrCode.ContestUserNotFound);
    }
    return this.service.filterUserForAdmin(user) as GetContestUserRespDTO;
  }

  @Api.Summary('更新实时比赛用户')
  @Patch('/contests/:uk/users/:userId')
  @UseGuards(AuthGuard)
  @Contract(UpdateContestUserReqDTO, null)
  public async updateContestUser(@Data() data: UpdateContestUserReqDTO) {
    await this.service.updateContestUser(data.uk, data.userId, {
      name: data.name,
      official: data.official,
      avatar: data.avatar,
      photo: data.photo,
      organization: data.organization,
      location: data.location,
      teamMembers: data.teamMembers,
      markers: data.markers,
      banned: data.banned,
      broadcasterToken: data.broadcasterToken,
    });
  }
}
