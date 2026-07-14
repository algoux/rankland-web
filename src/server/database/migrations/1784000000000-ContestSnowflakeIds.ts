import { MigrationInterface, QueryRunner } from 'typeorm';

type ContestIdColumnType = 'bigint unsigned' | 'varchar(36)';

export class ContestSnowflakeIds1784000000000 implements MigrationInterface {
  public name = 'ContestSnowflakeIds1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropContestTables(queryRunner);
    await queryRunner.query(`
      CREATE TABLE \`id_worker_registry\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`worker_id\` smallint unsigned NULL,
        \`reserved_until_ms\` bigint unsigned NULL,
        \`host\` varchar(255) NOT NULL,
        \`pid\` int unsigned NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_id_worker_registry_worker_reserved\` (\`worker_id\`, \`reserved_until_ms\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await createContestTables(queryRunner, 'bigint unsigned');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropContestTables(queryRunner);
    await queryRunner.query('DROP TABLE `id_worker_registry`');
    await createContestTables(queryRunner, 'varchar(36)');
  }
}

async function dropContestTables(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query('DROP TABLE `contest_event`');
  await queryRunner.query('DROP TABLE `contest_event_stream`');
  await queryRunner.query('DROP TABLE `contest_user`');
  await queryRunner.query('DROP TABLE `contest`');
}

async function createContestTables(queryRunner: QueryRunner, idColumnType: ContestIdColumnType): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE \`contest\` (
      \`id\` ${idColumnType} NOT NULL,
      \`uk\` varchar(64) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`contest\` json NOT NULL,
      \`problems\` json NOT NULL,
      \`markers\` json NOT NULL,
      \`series\` json NOT NULL,
      \`sorter\` json NULL,
      \`contributors\` json NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      UNIQUE INDEX \`IDX_contest_uk\` (\`uk\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);

  await queryRunner.query(`
    CREATE TABLE \`contest_user\` (
      \`id\` ${idColumnType} NOT NULL,
      \`contest_id\` ${idColumnType} NOT NULL,
      \`user_id\` varchar(128) NOT NULL,
      \`name\` text NOT NULL,
      \`avatar\` text NULL,
      \`photo\` text NULL,
      \`organization\` text NULL,
      \`location\` varchar(255) NULL,
      \`team_members\` json NULL,
      \`markers\` json NULL,
      \`official\` tinyint NOT NULL DEFAULT 1,
      \`banned\` tinyint NOT NULL DEFAULT 0,
      \`broadcaster_token\` varchar(255) NULL,
      \`sort_index\` int unsigned NOT NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      UNIQUE INDEX \`IDX_contest_user_contest_user\` (\`contest_id\`, \`user_id\`),
      INDEX \`IDX_contest_user_sort\` (\`contest_id\`, \`sort_index\`),
      INDEX \`IDX_contest_user_official\` (\`contest_id\`, \`official\`),
      INDEX \`IDX_contest_user_banned\` (\`contest_id\`, \`banned\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);

  await queryRunner.query(`
    CREATE TABLE \`contest_event_stream\` (
      \`contest_id\` ${idColumnType} NOT NULL,
      \`last_event_id\` int unsigned NOT NULL DEFAULT 0,
      \`stream_revision\` int unsigned NOT NULL DEFAULT 1,
      \`producer_id\` varchar(128) NULL,
      \`producer_locked_at\` datetime(6) NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`contest_id\`)
    ) ENGINE=InnoDB
  `);

  await queryRunner.query(`
    CREATE TABLE \`contest_event\` (
      \`id\` ${idColumnType} NOT NULL,
      \`contest_id\` ${idColumnType} NOT NULL,
      \`event_id\` int unsigned NOT NULL,
      \`stream_revision\` int unsigned NOT NULL,
      \`type\` tinyint unsigned NOT NULL,
      \`producer_id\` varchar(128) NOT NULL,
      \`solution_id\` int unsigned NULL,
      \`user_id\` varchar(128) NULL,
      \`problem_alias\` varchar(64) NULL,
      \`percentage_progress\` int unsigned NULL,
      \`previous_result\` tinyint unsigned NULL,
      \`result\` tinyint unsigned NULL,
      \`time_ns\` bigint NULL,
      \`solution_submit_time_ns\` bigint NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`payload_hash\` char(64) NOT NULL,
      \`payload_bytes\` longblob NOT NULL,
      UNIQUE INDEX \`IDX_contest_event_contest_revision_event\` (\`contest_id\`, \`stream_revision\`, \`event_id\`),
      INDEX \`IDX_contest_event_solution\` (\`contest_id\`, \`solution_id\`),
      INDEX \`IDX_contest_event_type\` (\`contest_id\`, \`type\`),
      INDEX \`IDX_contest_event_solution_type_lookup\` (\`contest_id\`, \`stream_revision\`, \`type\`, \`solution_id\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);
}
