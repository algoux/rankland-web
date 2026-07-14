import { Inject, Provide } from 'bwcx-core';
import { DataSource } from 'typeorm';
import MysqlConfig from '@server/configs/mysql/mysql.config';
import { createMysqlDataSource } from './typeorm-data-source';

@Provide()
export default class TypeOrmClient {
  private readonly dataSource: DataSource;

  public constructor(@Inject(MysqlConfig) mysqlConfig: MysqlConfig) {
    this.dataSource = createMysqlDataSource(mysqlConfig);
  }

  public async init(): Promise<DataSource> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
    return this.dataSource;
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }

  public async destroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
