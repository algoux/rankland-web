import { Api } from 'bwcx-api';
import { Inject } from 'bwcx-core';
import { Contract, Data, Delete, Get, Post, UseGuards } from 'bwcx-ljsm';

import {
  DeleteFileReqDTO,
  GetFileReqDTO,
  GetFileRespDTO,
  UploadFileReqDTO,
  UploadFileRespDTO,
} from '@common/modules/file/file.dto';
import { ApiController } from '@server/decorators';
import AuthGuard from '@server/guards/auth.guard';
import FileService from './file.service';

@ApiController('/v2')
export default class FileController {
  public constructor(@Inject(FileService) private readonly service: FileService) {}

  @Api.Summary('上传比赛文件')
  @Post('/files')
  @UseGuards(AuthGuard)
  @Contract(UploadFileReqDTO, UploadFileRespDTO)
  public async uploadFile(@Data() data: UploadFileReqDTO): Promise<UploadFileRespDTO> {
    return this.service.uploadFile(data);
  }

  @Api.Summary('查询比赛文件')
  @Get('/files/:id')
  @UseGuards(AuthGuard)
  @Contract(GetFileReqDTO, GetFileRespDTO)
  public async getFile(@Data() data: GetFileReqDTO): Promise<GetFileRespDTO> {
    return this.service.getFile(data.id);
  }

  @Api.Summary('删除比赛文件')
  @Delete('/files/:id')
  @UseGuards(AuthGuard)
  @Contract(DeleteFileReqDTO, null)
  public async deleteFile(@Data() data: DeleteFileReqDTO): Promise<void> {
    await this.service.deleteFile(data.id);
  }
}
