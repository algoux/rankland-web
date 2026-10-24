import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContestFinalization1792800000000 implements MigrationInterface {
  public name = 'ContestFinalization1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `contest` ADD `status` tinyint unsigned NOT NULL DEFAULT 0 AFTER `srk_file_id`',
    );
    await queryRunner.query(
      'UPDATE `contest` SET `status` = 99, `updated_at` = `updated_at` WHERE `srk_file_id` IS NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `contest` DROP COLUMN `status`');
  }
}
