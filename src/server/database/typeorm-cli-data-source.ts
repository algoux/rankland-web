import type { MysqlDataSourceConfig } from './typeorm-data-source';
import { createMysqlDataSource } from './typeorm-data-source';
import { parseMysqlConnectionLimit } from '@server/configs/mysql/mysql.connection-limit';

type MysqlEnvName = 'MYSQL_HOST' | 'MYSQL_USER' | 'MYSQL_PASS' | 'MYSQL_DB';

function getMysqlDataSourceConfigFromEnv(): MysqlDataSourceConfig {
  return {
    host: readMysqlEnv('MYSQL_HOST', '127.0.0.1'),
    port: readMysqlPort(),
    username: readMysqlEnv('MYSQL_USER', 'blue'),
    password: readMysqlEnv('MYSQL_PASS', 'test'),
    database: readMysqlEnv('MYSQL_DB', 'rankland'),
    connectionLimit: parseMysqlConnectionLimit(process.env.MYSQL_CONNECTION_LIMIT),
  };
}

function readMysqlEnv(name: MysqlEnvName, developmentDefault: string): string {
  const value = process.env[name];
  if (value !== undefined && value !== '') {
    return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required for production database migrations`);
  }
  return developmentDefault;
}

function readMysqlPort(): number {
  const rawPort = process.env.MYSQL_PORT || '3306';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError('MYSQL_PORT must be an integer between 1 and 65535');
  }
  return port;
}

export default createMysqlDataSource(getMysqlDataSourceConfigFromEnv());
