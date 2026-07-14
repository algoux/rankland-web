import { DataSource, EntitySchema } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import MysqlConfig from '@server/configs/mysql/mysql.config';
import { getMysqlDataSourceOptions } from './typeorm-data-source';

const runMysqlTests = process.env.RUN_MYSQL_TESTS === 'true';
const fixtureTableName = `vitest_datetime_utc_${process.pid}_${Date.now()}`;

interface DateTimeFixture {
  id?: number;
  caseName: string;
  payload: number;
  datetimeValue?: Date | string | null;
  timestampValue?: Date | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const DateTimeFixtureSchema = new EntitySchema<DateTimeFixture>({
  name: 'DateTimeUtcFixture',
  tableName: fixtureTableName,
  columns: {
    id: { type: Number, primary: true, generated: true },
    caseName: { name: 'case_name', type: String, length: 64 },
    payload: { type: Number, default: 0 },
    datetimeValue: { name: 'datetime_value', type: 'datetime', precision: 6, nullable: true },
    timestampValue: { name: 'timestamp_value', type: 'timestamp', precision: 6, nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      precision: 6,
      createDate: true,
      default: () => 'CURRENT_TIMESTAMP(6)',
    },
    updatedAt: {
      name: 'updated_at',
      type: 'datetime',
      precision: 6,
      updateDate: true,
      default: () => 'CURRENT_TIMESTAMP(6)',
      onUpdate: 'CURRENT_TIMESTAMP(6)',
    },
  },
});

describe.runIf(runMysqlTests)('MySQL DATETIME UTC contract', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      ...getMysqlDataSourceOptions(new MysqlConfig()),
      entities: [DateTimeFixtureSchema],
      migrations: [],
      migrationsRun: false,
      extra: { connectionLimit: 2 },
    });
    await dataSource.initialize();
    await dataSource.query(`
      CREATE TABLE \`${fixtureTableName}\` (
        id int unsigned NOT NULL AUTO_INCREMENT,
        case_name varchar(64) NOT NULL,
        payload int NOT NULL DEFAULT 0,
        datetime_value datetime(6) NULL,
        timestamp_value timestamp(6) NULL,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) {
      return;
    }
    try {
      await dataSource.query(`DROP TABLE IF EXISTS \`${fixtureTableName}\``);
    } finally {
      await dataSource.destroy();
    }
  });

  it('initializes every concurrently acquired physical connection with UTC session functions', async () => {
    const first = dataSource.createQueryRunner();
    const second = dataSource.createQueryRunner();

    try {
      await first.connect();
      await second.connect();
      const [[firstSession], [secondSession]] = await Promise.all([
        first.query(
          'SELECT CONNECTION_ID() AS connectionId, @@session.time_zone AS timeZone, TIMESTAMPDIFF(MICROSECOND, UTC_TIMESTAMP(6), NOW(6)) AS utcDifference',
        ),
        second.query(
          'SELECT CONNECTION_ID() AS connectionId, @@session.time_zone AS timeZone, TIMESTAMPDIFF(MICROSECOND, UTC_TIMESTAMP(6), NOW(6)) AS utcDifference',
        ),
      ]);

      expect(firstSession.connectionId).not.toBe(secondSession.connectionId);
      expect(firstSession).toMatchObject({ timeZone: '+00:00', utcDifference: '0' });
      expect(secondSession).toMatchObject({ timeZone: '+00:00', utcDifference: '0' });
    } finally {
      await Promise.all([first.release(), second.release()]);
    }
  });

  it('keeps MySQL defaults, ON UPDATE, and TypeORM automatic date columns in UTC', async () => {
    const rawInsert = await dataSource.query(`INSERT INTO \`${fixtureTableName}\` (case_name, payload) VALUES (?, ?)`, [
      'mysql-defaults',
      0,
    ]);
    const repository = dataSource.getRepository(DateTimeFixtureSchema);
    const typeOrmEntity = await repository.save(repository.create({ caseName: 'typeorm-automatic', payload: 0 }));
    const [initialRawRow] = await dataSource.query(
      `SELECT CAST(created_at AS CHAR(26)) AS createdAt, CAST(updated_at AS CHAR(26)) AS updatedAt,
              TIMESTAMPDIFF(SECOND, created_at, UTC_TIMESTAMP(6)) AS ageSeconds
       FROM \`${fixtureTableName}\` WHERE id = ?`,
      [rawInsert.insertId],
    );
    const [typeOrmRow] = await dataSource.query(
      `SELECT CAST(created_at AS CHAR(26)) AS createdAt, CAST(updated_at AS CHAR(26)) AS updatedAt,
              TIMESTAMPDIFF(SECOND, created_at, UTC_TIMESTAMP(6)) AS ageSeconds
       FROM \`${fixtureTableName}\` WHERE id = ?`,
      [typeOrmEntity.id],
    );
    const loadedTypeOrmEntity = await repository.findOneByOrFail({ id: typeOrmEntity.id });

    expect(initialRawRow.createdAt).toBe(initialRawRow.updatedAt);
    expect(Number(initialRawRow.ageSeconds)).toBeGreaterThanOrEqual(0);
    expect(Number(initialRawRow.ageSeconds)).toBeLessThanOrEqual(2);
    expect(typeOrmRow.createdAt).toBe(typeOrmRow.updatedAt);
    expect(Number(typeOrmRow.ageSeconds)).toBeGreaterThanOrEqual(0);
    expect(Number(typeOrmRow.ageSeconds)).toBeLessThanOrEqual(2);
    expect(loadedTypeOrmEntity.createdAt).toBeInstanceOf(Date);
    expect(loadedTypeOrmEntity.updatedAt).toBeInstanceOf(Date);

    await waitForMysqlTimestampAfter(dataSource, initialRawRow.updatedAt);
    await dataSource.query(`UPDATE \`${fixtureTableName}\` SET payload = payload + 1 WHERE id = ?`, [
      rawInsert.insertId,
    ]);
    const [updatedRawRow] = await dataSource.query(
      `SELECT CAST(created_at AS CHAR(26)) AS createdAt, CAST(updated_at AS CHAR(26)) AS updatedAt
       FROM \`${fixtureTableName}\` WHERE id = ?`,
      [rawInsert.insertId],
    );

    expect(updatedRawRow.createdAt).toBe(initialRawRow.createdAt);
    expect(updatedRawRow.updatedAt > initialRawRow.updatedAt).toBe(true);
  });

  it.each([
    {
      caseName: 'date',
      input: new Date('2026-01-01T00:00:00.123Z'),
      expected: new Date('2026-01-01T00:00:00.123Z'),
    },
    {
      caseName: 'z-string',
      input: '2026-01-01T00:00:00.456Z',
      expected: new Date('2026-01-01T00:00:00.456Z'),
    },
    {
      caseName: 'offset-string',
      input: '2026-01-01T08:00:00.789+08:00',
      expected: new Date('2026-01-01T00:00:00.789Z'),
    },
    {
      caseName: 'local-string',
      input: '2026-01-01 08:00:00.321',
      expected: new Date(2026, 0, 1, 8, 0, 0, 321),
    },
  ])(
    'stores $caseName input as the same UTC instant in DATETIME(6) and TIMESTAMP(6)',
    async ({ caseName, input, expected }) => {
      const repository = dataSource.getRepository(DateTimeFixtureSchema);
      const saved = await repository.save(
        repository.create({
          caseName,
          payload: 0,
          datetimeValue: input,
          timestampValue: input,
        }),
      );
      const [rawRow] = await dataSource.query(
        `SELECT CAST(datetime_value AS CHAR(26)) AS datetimeValue,
              CAST(timestamp_value AS CHAR(26)) AS timestampValue
       FROM \`${fixtureTableName}\` WHERE id = ?`,
        [saved.id],
      );
      const loaded = await repository.findOneByOrFail({ id: saved.id });
      const expectedMysqlValue = formatMysqlUtc(expected);

      expect(rawRow).toEqual({ datetimeValue: expectedMysqlValue, timestampValue: expectedMysqlValue });
      expect(loaded.datetimeValue).toBeInstanceOf(Date);
      expect(loaded.timestampValue).toBeInstanceOf(Date);
      expect((loaded.datetimeValue as Date).toISOString()).toBe(expected.toISOString());
      expect((loaded.timestampValue as Date).toISOString()).toBe(expected.toISOString());
    },
  );

  it('restores UTC after resetOnRelease resets a reused connection', async () => {
    const singleConnectionDataSource = new DataSource({
      ...getMysqlDataSourceOptions(new MysqlConfig()),
      entities: [],
      migrations: [],
      migrationsRun: false,
      extra: { connectionLimit: 1, resetOnRelease: true },
    });
    let first: QueryRunner | undefined;
    let second: QueryRunner | undefined;

    try {
      await singleConnectionDataSource.initialize();
      first = singleConnectionDataSource.createQueryRunner();
      await first.connect();
      const [before] = await first.query('SELECT CONNECTION_ID() AS connectionId, @@session.time_zone AS timeZone');
      await first.query("SET SESSION time_zone = '-07:00'");
      const [modified] = await first.query('SELECT @@session.time_zone AS timeZone');
      await first.release();

      second = singleConnectionDataSource.createQueryRunner();
      await second.connect();
      const [reacquired] = await second.query(
        'SELECT CONNECTION_ID() AS connectionId, @@session.time_zone AS timeZone',
      );

      expect(before.timeZone).toBe('+00:00');
      expect(modified.timeZone).toBe('-07:00');
      expect(reacquired.connectionId).toBe(before.connectionId);
      expect(reacquired.timeZone).toBe('+00:00');
    } finally {
      if (first && !first.isReleased) {
        await first.release();
      }
      if (second && !second.isReleased) {
        await second.release();
      }
      if (singleConnectionDataSource.isInitialized) {
        await singleConnectionDataSource.destroy();
      }
    }
  });
});

async function waitForMysqlTimestampAfter(dataSource: DataSource, timestamp: string): Promise<void> {
  for (;;) {
    const [row] = await dataSource.query('SELECT CAST(CURRENT_TIMESTAMP(6) AS CHAR(26)) AS currentTimestamp');
    if (row.currentTimestamp > timestamp) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
  }
}

function formatMysqlUtc(date: Date): string {
  return `${date.toISOString().slice(0, 23).replace('T', ' ')}000`;
}
