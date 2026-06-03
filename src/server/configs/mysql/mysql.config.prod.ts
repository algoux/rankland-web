import { Config } from 'bwcx-ljsm';
import MysqlConfig from './mysql.config';

@Config(MysqlConfig, { when: 'production', override: true })
export default class MysqlProdConfig extends MysqlConfig {
  public readonly host: string = process.env.MYSQL_HOST || '127.0.0.1';
  public readonly port: number = Number(process.env.MYSQL_PORT) || 3306;
  public readonly username: string = process.env.MYSQL_USER || 'blue';
  public readonly password: string = process.env.MYSQL_PASS || 'test';
  public readonly database: string = process.env.MYSQL_DB || 'rankland';
}
