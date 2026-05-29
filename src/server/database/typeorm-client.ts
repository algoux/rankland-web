import { Provide } from 'bwcx-core';
import { DataSource } from 'typeorm';
import { AppDataSource } from './typeorm-data-source';

@Provide()
export default class TypeOrmClient {
  private dataSource: DataSource = AppDataSource;

  public async init(): Promise<DataSource> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
    return this.dataSource;
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }
}
