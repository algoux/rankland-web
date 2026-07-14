import { describe, expect, it } from 'vitest';

import MysqlConfig from '@server/configs/mysql/mysql.config';
import { mysql2UtcConnector } from './mysql2-utc-connector';
import { getMysqlDataSourceOptions } from './typeorm-data-source';

describe('MySQL DataSource UTC configuration', () => {
  it('uses mysql2 with UTC Date encoding and the UTC session connector', () => {
    const options = getMysqlDataSourceOptions(new MysqlConfig());

    expect(options).toMatchObject({
      type: 'mysql',
      connectorPackage: 'mysql2',
      driver: mysql2UtcConnector,
      timezone: 'Z',
    });
    expect(options).not.toHaveProperty('dateStrings', true);
  });
});
