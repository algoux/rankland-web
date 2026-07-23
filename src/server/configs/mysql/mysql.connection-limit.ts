export const DEFAULT_MYSQL_CONNECTION_LIMIT = 20;

export function parseMysqlConnectionLimit(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_MYSQL_CONNECTION_LIMIT;
  }
  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new RangeError('MYSQL_CONNECTION_LIMIT must be an integer between 1 and 65535');
  }
  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) {
    throw new RangeError('MYSQL_CONNECTION_LIMIT must be an integer between 1 and 65535');
  }
  return value;
}
