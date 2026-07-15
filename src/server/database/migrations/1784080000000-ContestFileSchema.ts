import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContestFileSchema1784080000000 implements MigrationInterface {
  public name = 'ContestFileSchema1784080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contest\`
        ADD \`title\` json NOT NULL AFTER \`name\`,
        ADD \`start_at\` datetime(0) NOT NULL AFTER \`title\`,
        ADD \`duration_s\` int unsigned NOT NULL AFTER \`start_at\`,
        ADD \`frozen_duration_s\` int unsigned NULL AFTER \`duration_s\`,
        ADD \`banner\` json NULL AFTER \`frozen_duration_s\`,
        ADD \`ref_links\` json NULL AFTER \`banner\`,
        MODIFY \`problems\` json NULL,
        MODIFY \`markers\` json NULL,
        MODIFY \`series\` json NULL,
        MODIFY \`sorter\` json NULL,
        ADD \`srk_file_id\` bigint unsigned NULL AFTER \`contributors\`,
        ADD \`view_count\` int unsigned NOT NULL DEFAULT 0 AFTER \`srk_file_id\`,
        ADD \`redirect_uk\` varchar(64) NULL AFTER \`view_count\`,
        ADD \`deleted_at\` datetime(6) NULL AFTER \`updated_at\`,
        DROP COLUMN \`contest\`
    `);

    await queryRunner.query(`
      CREATE TABLE \`file\` (
        \`id\` bigint unsigned NOT NULL,
        \`contest_id\` bigint unsigned NOT NULL,
        \`category\` varchar(32) NOT NULL DEFAULT '',
        \`name\` varchar(256) NOT NULL,
        \`path\` varchar(256) NOT NULL,
        \`size\` int unsigned NOT NULL,
        \`hash_type\` varchar(32) NOT NULL,
        \`hash_value\` varchar(128) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_file_contest_id\` (\`contest_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `file`');
    await queryRunner.query('ALTER TABLE `contest` ADD `contest` json NULL AFTER `name`');
    await queryRunner.query(`
      UPDATE \`contest\`
      SET
        \`contest\` = JSON_OBJECT(
          'title', \`title\`,
          'startAt', CONCAT(DATE_FORMAT(\`start_at\`, '%Y-%m-%dT%H:%i:%s'), 'Z'),
          'duration', JSON_ARRAY(\`duration_s\`, 's'),
          'frozenDuration', IF(\`frozen_duration_s\` IS NULL, NULL, JSON_ARRAY(\`frozen_duration_s\`, 's')),
          'banner', \`banner\`,
          'refLinks', \`ref_links\`
        ),
        \`problems\` = COALESCE(\`problems\`, JSON_ARRAY()),
        \`markers\` = COALESCE(\`markers\`, JSON_ARRAY()),
        \`series\` = COALESCE(\`series\`, JSON_ARRAY())
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest\`
        MODIFY \`contest\` json NOT NULL,
        MODIFY \`problems\` json NOT NULL,
        MODIFY \`markers\` json NOT NULL,
        MODIFY \`series\` json NOT NULL,
        DROP COLUMN \`title\`,
        DROP COLUMN \`start_at\`,
        DROP COLUMN \`duration_s\`,
        DROP COLUMN \`frozen_duration_s\`,
        DROP COLUMN \`banner\`,
        DROP COLUMN \`ref_links\`,
        DROP COLUMN \`srk_file_id\`,
        DROP COLUMN \`view_count\`,
        DROP COLUMN \`redirect_uk\`,
        DROP COLUMN \`deleted_at\`
    `);
  }
}
