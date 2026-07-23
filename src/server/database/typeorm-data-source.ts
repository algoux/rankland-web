import 'reflect-metadata';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { IdWorkerRegistryEntity } from '@server/entities/id-worker-registry.entity';
import { FileEntity } from '@server/entities/file.entity';
import { CollectionEntity } from '@server/entities/collection.entity';
import MysqlConfig from '@server/configs/mysql/mysql.config';
import { mysql2UtcConnector } from './mysql2-utc-connector';

export type MysqlDataSourceConfig = Pick<
  MysqlConfig,
  'host' | 'port' | 'username' | 'password' | 'database' | 'connectionLimit'
>;

export function getMysqlDataSourceOptions(mysqlConfig: MysqlDataSourceConfig): DataSourceOptions {
  return {
    type: 'mysql',
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    username: mysqlConfig.username,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    connectorPackage: 'mysql2',
    driver: mysql2UtcConnector,
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: true,
    extra: {
      connectionLimit: mysqlConfig.connectionLimit,
    },
    synchronize: false,
    migrationsRun: false,
    entities: [
      ContestEntity,
      ContestUserEntity,
      ContestEventStreamEntity,
      ContestEventEntity,
      FileEntity,
      CollectionEntity,
      IdWorkerRegistryEntity,
    ],
    migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
  };
}

export function createMysqlDataSource(mysqlConfig: MysqlDataSourceConfig): DataSource {
  return new DataSource(getMysqlDataSourceOptions(mysqlConfig));
}
