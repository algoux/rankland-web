import type { MysqlDataSourceConfig } from './typeorm-data-source';
import { createMysqlDataSource } from './typeorm-data-source';

function getMysqlDataSourceConfigFromEnv(): MysqlDataSourceConfig {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    username: process.env.MYSQL_USER || 'blue',
    password: process.env.MYSQL_PASS ?? 'test',
    database: process.env.MYSQL_DB || 'rankland',
  };
}

export default createMysqlDataSource(getMysqlDataSourceConfigFromEnv());
