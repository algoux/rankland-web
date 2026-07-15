import { MigrationInterface, QueryRunner } from 'typeorm';

export class CollectionSchema1784084400000 implements MigrationInterface {
  public name = 'CollectionSchema1784084400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`collection\` (
        \`id\` bigint unsigned NOT NULL,
        \`uk\` varchar(64) NOT NULL,
        \`content\` json NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        UNIQUE INDEX \`IDX_collection_uk\` (\`uk\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `collection`');
  }
}
