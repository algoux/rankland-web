import { Contract, Data, Get, InjectCtx, Post, RequestContext, UseGuards } from 'bwcx-ljsm';
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
  GetContestEventsReqDTO,
  GetContestEventsRespDTO,
  GetContestRespDTO,
  GetPublicContestReqDTO,
  GetPublicContestRespDTO,
  UpdateContestReqDTO,
  ResetContestEventsReqDTO,
  GetContestStreamStateReqDTO,
  GetContestStreamStateRespDTO,
  GetPublicContestUsersReqDTO,
  GetPublicContestUsersRespDTO,
  GetPublicContestUserReqDTO,
  GetPublicContestUserRespDTO,
  GetContestUsersReqDTO,
  GetContestUsersRespDTO,
  GetContestUserReqDTO,
  GetContestUserRespDTO,
  ReleaseContestProducerReqDTO,
  UpdateContestUserReqDTO,
  RawContestEventsReqDTO,
} from '@common/modules/contest/contest.dto';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import ContestService from './contest.service';
import ContestEventStreamService from './contest-event-stream.service';
import ContestSseHub from './contest-sse-hub';
import {
  getContestEventsResponseToJson,
  parseProducerBatchJson,
} from './contest-event-codec';
import { ProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { Sse } from '@server/decorators/sse.decorator';
import {
  rankland_live_contest_client,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';

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
    private readonly sseHub: ContestSseHub,
  ) {}

  @Api.Summary('创建实时比赛')
  @Post('/contests')
  @UseGuards(AuthGuard)
  @Contract(CreateContestReqDTO, CreateContestRespDTO)
  public async createContest(@Data() data: CreateContestReqDTO): Promise<CreateContestRespDTO> {
    return this.service.createContest(data as any);
  }

  @Api.Summary('更新实时比赛')
  @Post('/contests/:uk')
  @UseGuards(AuthGuard)
  @Contract(UpdateContestReqDTO, null)
  public async updateContest(@Data() data: UpdateContestReqDTO) {
    await this.service.updateContest(data as any);
  }

  @Api.Summary('重置实时比赛事件流')
  @Post('/contests/:uk/events/reset')
  @UseGuards(AuthGuard)
  @Contract(ResetContestEventsReqDTO, null)
  public async resetContestEvents(@Data() data: ResetContestEventsReqDTO) {
    const stream = await this.service.dropEvents(data.uk);
    this.sseHub.notify({
      uk: data.uk,
      latestEventId: stream.lastEventId,
      streamRevision: stream.streamRevision,
    });
  }

  @Api.Summary('追加实时比赛事件')
  @Post('/contests/:uk/events')
  @UseGuards(AuthGuard)
  @Contract(AppendContestEventsReqDTO, AppendContestEventsRespDTO)
  @ProtobufContract(rankland_live_contest_producer.BatchProducerEvent, null)
  public async appendContestEvents(
    @Data() data: AppendContestEventsReqDTO,
  ): Promise<AppendContestEventsRespDTO> {
    const producerId = this.ctx.headers['x-producer-id'] as string;
    const batch = parseProducerBatchJson({ events: data.events });
    const result = await this.eventStreamService.appendProducerEvents({
      uk: data.uk,
      producerId,
      batch,
    });
    this.sseHub.notify({
      uk: data.uk,
      latestEventId: result.lastEventId,
      streamRevision: result.streamRevision,
    });
    return result;
  }

  @Api.Summary('查询实时比赛事件')
  @Get('/contests/:uk/events')
  @Contract(GetContestEventsReqDTO, GetContestEventsRespDTO)
  @ProtobufContract(null, rankland_live_contest_client.GetContestEventsResponse)
  public async getContestEvents(@Data() data: GetContestEventsReqDTO): Promise<any> {
    const result = await this.eventStreamService.getClientEvents({
      uk: data.uk,
      afterEventId: data.afterEventId || 0,
      limit: data.limit || 1000,
      streamRevision: data.streamRevision,
      compactProgress: data.compactProgress,
    });
    // Return a single serialization-ready object. The default response handler
    // wraps it as JSON or encodes it to protobuf based on the negotiated type.
    return getContestEventsResponseToJson(result);
  }

  @Api.Summary('实时比赛事件流 SSE 通知')
  @Get('/contests/:uk/events/stream')
  @Sse()
  @Contract(RawContestEventsReqDTO, null)
  public async streamContestEvents(@Data() data: RawContestEventsReqDTO) {
    // ContentNegotiation + SSE middleware have already opened the event stream
    // (headers, ctx.respond = false). Here we only do the business hookup.
    const stream = await this.eventStreamService.getStreamState(data.uk);
    this.sseHub.addClient(data.uk, this.ctx.res, {
      uk: data.uk,
      latestEventId: stream.lastEventId,
      streamRevision: stream.streamRevision,
    });
  }

  @Api.Summary('查询实时比赛事件流状态')
  @Get('/contests/:uk/stream')
  @UseGuards(AuthGuard)
  @Contract(GetContestStreamStateReqDTO, GetContestStreamStateRespDTO)
  public async getContestStreamState(
    @Data() data: GetContestStreamStateReqDTO,
  ): Promise<GetContestStreamStateRespDTO> {
    return this.eventStreamService.getStreamState(data.uk);
  }

  @Api.Summary('释放实时比赛生产者锁')
  @Post('/contests/:uk/producer/release')
  @UseGuards(AuthGuard)
  @Contract(ReleaseContestProducerReqDTO, GetContestStreamStateRespDTO)
  public async releaseContestProducer(
    @Data() data: ReleaseContestProducerReqDTO,
  ): Promise<GetContestStreamStateRespDTO> {
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
  public async getContestUsers(
    @Data() data: GetContestUsersReqDTO,
  ): Promise<GetContestUsersRespDTO> {
    const users = await this.service.findContestUsers(data.uk);
    const filteredUsers = users.map((user) => this.service.filterUserForAdmin(user));
    return { users: filteredUsers as any };
  }

  @Api.Summary('查询实时比赛用户详情')
  @Get('/contests/:uk/users/:userId')
  @UseGuards(AuthGuard)
  @Contract(GetContestUserReqDTO, GetContestUserRespDTO)
  public async getContestUser(
    @Data() data: GetContestUserReqDTO,
  ): Promise<GetContestUserRespDTO> {
    const user = await this.service.findContestUserById(data.uk, data.userId);
    if (!user) {
      throw new LogicException(ErrCode.ContestUserNotFound);
    }
    return this.service.filterUserForAdmin(user) as GetContestUserRespDTO;
  }

  @Api.Summary('更新实时比赛用户')
  @Post('/contests/:uk/users/:userId')
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
