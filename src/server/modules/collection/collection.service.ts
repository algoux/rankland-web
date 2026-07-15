import { Inject, Provide } from 'bwcx-core';
import { IsNull, type DataSource } from 'typeorm';

import { ErrCode } from '@common/enums/err-code.enum';
import type {
  GetCollectionRespDTO,
  GetCollectionsRespDTO,
  GetPublicCollectionRespDTO,
  GetPublicCollectionsRespDTO,
  JsonValue,
} from '@common/modules/collection/collection.dto';
import TypeOrmClient from '@server/database/typeorm-client';
import { CollectionEntity } from '@server/entities/collection.entity';
import LogicException from '@server/exceptions/logic.exception';
import IdGeneratorService, { type IdGenerator } from '@server/services/id-generator.service';
import { formatDatabaseDateTimeForApi } from '@server/utils/datetime.util';

interface CreateCollectionInput {
  uk: string;
  content: JsonValue;
}

@Provide()
export default class CollectionService {
  public constructor(
    @Inject(TypeOrmClient) private readonly typeOrmClient: TypeOrmClient,
    @Inject(IdGeneratorService) private readonly idGenerator: IdGenerator,
  ) {}

  private get dataSource(): DataSource {
    return this.typeOrmClient.getDataSource();
  }

  public async createCollection(data: CreateCollectionInput): Promise<{ _id: string }> {
    const repository = this.dataSource.getRepository(CollectionEntity);
    const existed = await repository.findOne({ where: { uk: data.uk }, withDeleted: true });
    if (existed) {
      throw new LogicException(ErrCode.CollectionExisted);
    }

    const collection = repository.create({
      id: this.idGenerator.nextId(),
      uk: data.uk,
      content: data.content,
    });
    const savedCollection = await repository.save(collection);
    return { _id: savedCollection.id };
  }

  public async getCollections(admin: true): Promise<GetCollectionsRespDTO>;
  public async getCollections(admin: false): Promise<GetPublicCollectionsRespDTO>;
  public async getCollections(admin: boolean): Promise<GetCollectionsRespDTO | GetPublicCollectionsRespDTO> {
    const collections = await this.dataSource.getRepository(CollectionEntity).find({
      select: {
        id: true,
        uk: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      withDeleted: admin,
      order: { id: 'DESC' },
    });

    if (admin) {
      const result: GetCollectionsRespDTO = {
        collections: collections.map((collection) => ({
          ...this.toSummary(collection),
          deletedAt: formatDatabaseDateTimeForApi(collection.deletedAt),
        })),
      };
      return result;
    }

    const result: GetPublicCollectionsRespDTO = {
      collections: collections.map((collection) => this.toSummary(collection)),
    };
    return result;
  }

  public async getCollection(uk: string, admin: true): Promise<GetCollectionRespDTO>;
  public async getCollection(uk: string, admin: false): Promise<GetPublicCollectionRespDTO>;
  public async getCollection(uk: string, admin: boolean): Promise<GetCollectionRespDTO | GetPublicCollectionRespDTO> {
    const collection = await this.findCollection(uk, admin);
    const publicCollection: GetPublicCollectionRespDTO = {
      ...this.toSummary(collection),
      content: collection.content as JsonValue,
    };
    if (!admin) {
      return publicCollection;
    }

    const adminCollection: GetCollectionRespDTO = {
      ...publicCollection,
      deletedAt: formatDatabaseDateTimeForApi(collection.deletedAt),
    };
    return adminCollection;
  }

  public async updateCollection(uk: string, content: JsonValue): Promise<void> {
    const collection = await this.findCollection(uk, false);
    const result = await this.dataSource
      .getRepository(CollectionEntity)
      .update({ id: collection.id, deletedAt: IsNull() }, { content });
    if (!result.affected) {
      throw new LogicException(ErrCode.CollectionNotFound);
    }
  }

  public async deleteCollection(uk: string): Promise<void> {
    const collection = await this.findCollection(uk, false);
    const result = await this.dataSource
      .getRepository(CollectionEntity)
      .softDelete({ id: collection.id, deletedAt: IsNull() });
    if (!result.affected) {
      throw new LogicException(ErrCode.CollectionNotFound);
    }
  }

  private async findCollection(uk: string, withDeleted: boolean): Promise<CollectionEntity> {
    const collection = await this.dataSource.getRepository(CollectionEntity).findOne({
      where: { uk },
      withDeleted,
    });
    if (!collection) {
      throw new LogicException(ErrCode.CollectionNotFound);
    }
    return collection;
  }

  private toSummary(collection: CollectionEntity) {
    return {
      _id: collection.id,
      uk: collection.uk,
      createdAt: formatDatabaseDateTimeForApi(collection.createdAt)!,
      updatedAt: formatDatabaseDateTimeForApi(collection.updatedAt)!,
    };
  }
}
