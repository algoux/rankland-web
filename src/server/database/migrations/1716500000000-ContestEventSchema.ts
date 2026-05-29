import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContestEventSchema1716500000000 implements MigrationInterface {
  public name = 'ContestEventSchema1716500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`contest\` (
        \`id\` varchar(36) NOT NULL,
        \`uk\` varchar(64) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`contest\` json NOT NULL,
        \`problems\` json NOT NULL,
        \`markers\` json NOT NULL,
        \`series\` json NOT NULL,
        \`sorter\` json NULL,
        \`contributors\` json NULL,
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE INDEX \`IDX_contest_uk\` (\`uk\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`contest_user\` (
        \`id\` varchar(36) NOT NULL,
        \`contest_id\` varchar(36) NOT NULL,
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
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE INDEX \`IDX_contest_user_contest_user\` (\`contest_id\`, \`user_id\`),
        INDEX \`IDX_contest_user_sort\` (\`contest_id\`, \`sort_index\`),
        INDEX \`IDX_contest_user_official\` (\`contest_id\`, \`official\`),
        INDEX \`IDX_contest_user_banned\` (\`contest_id\`, \`banned\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`contest_event_stream\` (
        \`contest_id\` varchar(36) NOT NULL,
        \`last_event_id\` int unsigned NOT NULL DEFAULT 0,
        \`stream_revision\` int unsigned NOT NULL DEFAULT 1,
        \`producer_id\` varchar(128) NULL,
        \`producer_locked_at\` datetime(3) NULL,
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`contest_id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`contest_event\` (
        \`id\` varchar(36) NOT NULL,
        \`contest_id\` varchar(36) NOT NULL,
        \`event_id\` int unsigned NOT NULL,
        \`stream_revision\` int unsigned NOT NULL,
        \`type\` tinyint unsigned NOT NULL,
        \`payload_hash\` char(64) NOT NULL,
        \`payload_bytes\` longblob NOT NULL,
        \`producer_id\` varchar(128) NOT NULL,
        \`solution_id\` int unsigned NULL,
        \`user_id\` varchar(128) NULL,
        \`problem_alias\` varchar(64) NULL,
        \`percentage_progress\` int unsigned NULL,
        \`previous_result\` tinyint unsigned NULL,
        \`result\` tinyint unsigned NULL,
        \`time_ns\` bigint NULL,
        \`solution_submit_time_ns\` bigint NULL,
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE INDEX \`IDX_contest_event_contest_event\` (\`contest_id\`, \`event_id\`),
        INDEX \`IDX_contest_event_revision_event\` (\`contest_id\`, \`stream_revision\`, \`event_id\`),
        INDEX \`IDX_contest_event_solution\` (\`contest_id\`, \`solution_id\`),
        INDEX \`IDX_contest_event_type\` (\`contest_id\`, \`type\`),
        INDEX \`IDX_contest_event_solution_type_lookup\` (\`contest_id\`, \`stream_revision\`, \`type\`, \`solution_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `contest_event`');
    await queryRunner.query('DROP TABLE `contest_event_stream`');
    await queryRunner.query('DROP TABLE `contest_user`');
    await queryRunner.query('DROP TABLE `contest`');
  }
}
