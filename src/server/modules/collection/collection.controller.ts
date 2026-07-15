import { Api } from 'bwcx-api';
import { Inject } from 'bwcx-core';
import { Contract, Data, Delete, Get, Patch, Post, UseGuards } from 'bwcx-ljsm';

import {
  CreateCollectionReqDTO,
  CreateCollectionRespDTO,
  DeleteCollectionReqDTO,
  GetCollectionReqDTO,
  GetCollectionRespDTO,
  GetCollectionsRespDTO,
  GetPublicCollectionReqDTO,
  GetPublicCollectionRespDTO,
  GetPublicCollectionsRespDTO,
  UpdateCollectionReqDTO,
} from '@common/modules/collection/collection.dto';
import { ApiController } from '@server/decorators';
import AuthGuard from '@server/guards/auth.guard';
import CollectionService from './collection.service';

@ApiController('/v2')
export default class CollectionController {
  public constructor(@Inject(CollectionService) private readonly service: CollectionService) {}

  @Api.Summary('创建合集')
  @Post('/collections')
  @UseGuards(AuthGuard)
  @Contract(CreateCollectionReqDTO, CreateCollectionRespDTO)
  public async createCollection(@Data() data: CreateCollectionReqDTO): Promise<CreateCollectionRespDTO> {
    return this.service.createCollection(data);
  }

  @Api.Summary('更新合集')
  @Patch('/collections/:uk')
  @UseGuards(AuthGuard)
  @Contract(UpdateCollectionReqDTO, null)
  public async updateCollection(@Data() data: UpdateCollectionReqDTO): Promise<void> {
    await this.service.updateCollection(data.uk, data.content);
  }

  @Api.Summary('查询全部合集')
  @Get('/collections')
  @UseGuards(AuthGuard)
  @Contract(null, GetCollectionsRespDTO)
  public async getCollections(): Promise<GetCollectionsRespDTO> {
    return this.service.getCollections(true);
  }

  @Api.Summary('公开查询全部合集')
  @Get('/public/collections')
  @Contract(null, GetPublicCollectionsRespDTO)
  public async getPublicCollections(): Promise<GetPublicCollectionsRespDTO> {
    return this.service.getCollections(false);
  }

  @Api.Summary('查询合集')
  @Get('/collections/:uk')
  @UseGuards(AuthGuard)
  @Contract(GetCollectionReqDTO, GetCollectionRespDTO)
  public async getCollection(@Data() data: GetCollectionReqDTO): Promise<GetCollectionRespDTO> {
    return this.service.getCollection(data.uk, true);
  }

  @Api.Summary('公开查询合集')
  @Get('/public/collections/:uk')
  @Contract(GetPublicCollectionReqDTO, GetPublicCollectionRespDTO)
  public async getPublicCollection(@Data() data: GetPublicCollectionReqDTO): Promise<GetPublicCollectionRespDTO> {
    return this.service.getCollection(data.uk, false);
  }

  @Api.Summary('删除合集')
  @Delete('/collections/:uk')
  @UseGuards(AuthGuard)
  @Contract(DeleteCollectionReqDTO, null)
  public async deleteCollection(@Data() data: DeleteCollectionReqDTO): Promise<void> {
    await this.service.deleteCollection(data.uk);
  }
}
