import { parseMysqlConnectionLimit } from './mysql.connection-limit';

describe('MySQL connection limit configuration', () => {
  it('defaults to the load-tested single-instance pool and accepts an explicit positive integer', () => {
    expect(parseMysqlConnectionLimit(undefined)).toBe(20);
    expect(parseMysqlConnectionLimit('')).toBe(20);
    expect(parseMysqlConnectionLimit('24')).toBe(24);
  });

  it.each(['0', '-1', '1.5', 'NaN', '65536'])('rejects invalid MYSQL_CONNECTION_LIMIT=%s', (value) => {
    expect(() => parseMysqlConnectionLimit(value)).toThrow(/MYSQL_CONNECTION_LIMIT/);
  });
});
