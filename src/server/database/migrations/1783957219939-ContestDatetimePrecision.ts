import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContestDatetimePrecision1783957219939 implements MigrationInterface {
  public name = 'ContestDatetimePrecision1783957219939';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contest\`
        MODIFY COLUMN \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        MODIFY COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest_user\`
        MODIFY COLUMN \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        MODIFY COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest_event_stream\`
        MODIFY COLUMN \`producer_locked_at\` datetime(6) NULL,
        MODIFY COLUMN \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        MODIFY COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest_event\`
        MODIFY COLUMN \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contest_event\`
        MODIFY COLUMN \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest_event_stream\`
        MODIFY COLUMN \`producer_locked_at\` datetime(3) NULL,
        MODIFY COLUMN \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        MODIFY COLUMN \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest_user\`
        MODIFY COLUMN \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        MODIFY COLUMN \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    `);
    await queryRunner.query(`
      ALTER TABLE \`contest\`
        MODIFY COLUMN \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        MODIFY COLUMN \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    `);
  }
}
