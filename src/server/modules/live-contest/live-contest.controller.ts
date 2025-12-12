import { Contract, Data, Get, InjectCtx, Post, RequestContext, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';
import AuthGuard from '@server/guards/auth.guard';
import {
  CreateLiveContestReqDTO,
  CreateLiveContestRespDTO,
  GetLiveContestReqDTO,
  GetLiveContestRespDTO,
  UpdateLiveContestReqDTO,
  DropLiveContestEventsReqDTO,
  GetPublicContestMembersReqDTO,
  GetPublicContestMembersRespDTO,
  GetPublicContestMemberReqDTO,
  GetPublicContestMemberRespDTO,
  GetContestMembersReqDTO,
  GetContestMembersRespDTO,
  GetContestMemberReqDTO,
  GetContestMemberRespDTO,
  UpdateContestMemberReqDTO,
} from '@common/modules/live-contest/live-contest.dto';
import { LiveContestModel } from '@server/models/live-contest.model';
import { LiveContestMemberModel } from '@server/models/live-contest-member.model';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import LiveContestService from './live-contest.service';

@ApiController()
export default class LiveContestController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject()
    private readonly service: LiveContestService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @Contract(CreateLiveContestReqDTO, CreateLiveContestRespDTO)
  public async createLiveContest(@Data() data: CreateLiveContestReqDTO): Promise<CreateLiveContestRespDTO> {
    const existed = await LiveContestModel.findOne({ alias: data.alias });
    if (existed) {
      throw new LogicException(ErrCode.LiveContestExisted);
    }
    const { members, ...contestData } = data as any;
    const res = await LiveContestModel.create(contestData);
    const contestId = res._id.toString();

    if (members && Array.isArray(members) && members.length > 0) {
      await this.service.upsertContestMembers(contestId, members);
    }

    return {
      _id: contestId,
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  @Contract(UpdateLiveContestReqDTO, null)
  public async updateLiveContest(@Data() data: UpdateLiveContestReqDTO) {
    const { members, ...contestData } = data as any;
    const contest = await LiveContestModel.findOne({ alias: data.alias });
    if (!contest) {
      throw new LogicException(ErrCode.LiveContestNotFound);
    }
    await LiveContestModel.updateOne({ alias: data.alias }, contestData);

    if (members !== undefined) {
      const contestId = contest._id.toString();
      if (Array.isArray(members)) {
        await this.service.replaceContestMembers(contestId, members);
      } else {
        await LiveContestMemberModel.deleteMany({ contestId });
      }
    }
  }

  @Post()
  @UseGuards(AuthGuard)
  @Contract(DropLiveContestEventsReqDTO, null)
  public async dropLiveContestEvents(@Data() data: DropLiveContestEventsReqDTO) {
    await this.service.dropEvents(data.alias);
  }

  @Get()
  @Contract(GetLiveContestReqDTO, GetLiveContestRespDTO)
  public async getLiveContest(@Data() data: GetLiveContestReqDTO): Promise<GetLiveContestRespDTO> {
    const contest = await LiveContestModel.findOne({ alias: data.alias });
    if (!contest) {
      throw new LogicException(ErrCode.LiveContestNotFound);
    }

    const plain = contest.toObject() as GetLiveContestRespDTO;
    // const members = await LiveContestMemberModel.find({
    //   contestId: contest._id.toString(),
    // }).sort({ index: 1 });
    const members = await this.service.findContestMembers(data.alias);
    (plain as any).members = members.map((member) => this.service.filterMemberForPublic(member));
    return plain;
  }

  @Get()
  @Contract(GetPublicContestMembersReqDTO, GetPublicContestMembersRespDTO)
  public async getPublicContestMembers(@Data() data: GetPublicContestMembersReqDTO): Promise<GetPublicContestMembersRespDTO> {
    const members = await this.service.findContestMembers(data.alias, {
      userId: data.userId,
      name: data.name,
      organization: data.organization,
      markerId: data.markerId,
      official: data.official,
      teamMemberName: data.teamMemberName,
    });
    const filteredMembers = members.map((member) => this.service.filterMemberForPublic(member));
    return { members: filteredMembers };
  }

  @Get()
  @Contract(GetPublicContestMemberReqDTO, GetPublicContestMemberRespDTO)
  public async getPublicContestMember(@Data() data: GetPublicContestMemberReqDTO): Promise<GetPublicContestMemberRespDTO> {
    const member = await this.service.findContestMemberById(data.alias, data.userId);
    if (!member) {
      throw new LogicException(ErrCode.LiveContestMemberNotFound);
    }
    return this.service.filterMemberForPublic(member) as GetPublicContestMemberRespDTO;
  }

  @Get()
  @UseGuards(AuthGuard)
  @Contract(GetContestMembersReqDTO, GetContestMembersRespDTO)
  public async getContestMembers(
    @Data() data: GetContestMembersReqDTO,
  ): Promise<GetContestMembersRespDTO> {
    const members = await this.service.findContestMembers(data.alias);
    const filteredMembers = members.map((member) => this.service.filterMemberForAdmin(member));
    return { members: filteredMembers };
  }

  @Get()
  @UseGuards(AuthGuard)
  @Contract(GetContestMemberReqDTO, GetContestMemberRespDTO)
  public async getContestMember(
    @Data() data: GetContestMemberReqDTO,
  ): Promise<GetContestMemberRespDTO> {
    const member = await this.service.findContestMemberById(data.alias, data.userId);
    if (!member) {
      throw new LogicException(ErrCode.LiveContestMemberNotFound);
    }
    return this.service.filterMemberForAdmin(member) as GetContestMemberRespDTO;
  }

  @Post()
  @UseGuards(AuthGuard)
  @Contract(UpdateContestMemberReqDTO, null)
  public async updateContestMember(@Data() data: UpdateContestMemberReqDTO) {
    await this.service.updateContestMember(data.alias, data.userId, {
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
