import { Config } from 'bwcx-ljsm';
import { DEFAULT_MYSQL_CONNECTION_LIMIT } from './mysql.connection-limit';

@Config()
export default class MysqlConfig {
  public readonly host: string = '127.0.0.1';
  public readonly port: number = 3306;
  public readonly username: string = 'blue';
  public readonly password: string = 'test';
  public readonly database: string = 'rankland';
  public readonly connectionLimit: number = DEFAULT_MYSQL_CONNECTION_LIMIT;
}
