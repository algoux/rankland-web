import { Config } from 'bwcx-ljsm';

@Config()
export default class MongoConfig {
  public static readonly url: string = 'mongodb://127.0.0.1:27017/rankland';
}
