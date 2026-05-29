import 'reflect-metadata';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';

const defaultMysqlConfig = {
  host: '127.0.0.1',
  port: '3306',
  username: 'blue',
  password: 'test',
  database: 'rankland',
};

export function getMysqlDataSourceOptions(): DataSourceOptions {
  const requireProductionEnv = process.env.NODE_ENV === 'production';
  const host = readDbEnv('MYSQL_HOST', defaultMysqlConfig.host, requireProductionEnv);
  const username = readDbEnv('MYSQL_USER', defaultMysqlConfig.username, requireProductionEnv);
  const password = readDbEnv('MYSQL_PASS', defaultMysqlConfig.password, requireProductionEnv, true);
  const database = readDbEnv('MYSQL_DB', defaultMysqlConfig.database, requireProductionEnv);

  return {
    type: 'mysql',
    host,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username,
    password,
    database,
    supportBigNumbers: true,
    bigNumberStrings: true,
    synchronize: false,
    migrationsRun: false,
    entities: [ContestEntity, ContestUserEntity, ContestEventStreamEntity, ContestEventEntity],
    migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
  };
}

export const AppDataSource = new DataSource(getMysqlDataSourceOptions());

function readDbEnv(name: string, defaultValue: string, requireProductionEnv: boolean, allowEmpty = false): string {
  const value = process.env[name];
  if (value !== undefined && (allowEmpty || value !== '')) {
    return value;
  }
  if (requireProductionEnv) {
    throw new Error(`Missing required production database environment variable ${name}`);
  }
  return defaultValue;
}
