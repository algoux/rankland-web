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
      timezone: 'Z',
      extra: { connectionLimit: 20 },
    });
    expect(options.driver).toBe(mysql2UtcConnector);
    expect(options).not.toHaveProperty('dateStrings', true);
  });

  it('passes an explicit pool connection limit to mysql2', () => {
    const options = getMysqlDataSourceOptions({
      ...new MysqlConfig(),
      connectionLimit: 24,
    });

    expect(options).toMatchObject({ extra: { connectionLimit: 24 } });
  });
});
