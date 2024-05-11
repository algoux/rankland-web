import { Inject, Provide } from 'bwcx-core';
import mongoose from 'mongoose';
import MongoConfig from '@server/configs/mongo/mongo.config';

@Provide()
export default class MongoClient {
  public constructor(
    @Inject()
    private readonly mongoConfig: MongoConfig,
  ) {}

  async init() {
    return await mongoose.connect(this.mongoConfig.url, {
      autoCreate: true,
      autoIndex: true,
    });
  }
}
