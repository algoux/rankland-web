import { Contract, Data, Get, InjectCtx, Post, RequestContext, UseGuards } from 'bwcx-ljsm';
import { ApiController } from '@server/decorators';
import AuthGuard from '@server/guards/auth.guard';
import {
  CreateLiveContestReqDTO,
  CreateLiveContestRespDTO,
  GetLiveContestReqDTO,
  GetLiveContestRespDTO,
  UpdateLiveContestReqDTO,
} from '@common/modules/live-contest/live-contest.dto';
import { LiveContestModel } from '@server/models/live-contest.model';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';

@ApiController()
export default class LiveContestController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @Contract(CreateLiveContestReqDTO, CreateLiveContestRespDTO)
  public async createLiveContest(@Data() data: CreateLiveContestReqDTO): Promise<CreateLiveContestRespDTO> {
    const existed = await LiveContestModel.findOne({ alias: data.alias });
    if (existed) {
      throw new LogicException(ErrCode.LiveContestExisted);
    }
    const res = await LiveContestModel.create(data);
    return {
      _id: res._id.toString(),
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  @Contract(UpdateLiveContestReqDTO, null)
  public async updateLiveContest(@Data() data: UpdateLiveContestReqDTO) {
    await LiveContestModel.updateOne({ alias: data.alias }, data);
  }

  @Get()
  @Contract(GetLiveContestReqDTO, GetLiveContestRespDTO)
  public async getLiveContest(@Data() data: GetLiveContestReqDTO): Promise<GetLiveContestRespDTO> {
    const res = await LiveContestModel.findOne({ alias: data.alias });
    if (!res) {
      throw new LogicException(ErrCode.LiveContestNotFound);
    }
    return res.toObject() as GetLiveContestRespDTO;
  }
}
