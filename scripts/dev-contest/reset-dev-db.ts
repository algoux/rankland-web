#!/usr/bin/env -S npx tsx

import mysql from 'mysql2/promise';
import { createMysqlDataSource } from '@server/database/typeorm-data-source';
import { MYSQL_DB, MYSQL_HOST, MYSQL_PASS, MYSQL_PORT, MYSQL_USER } from './config';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  assertLocalDatabaseTarget();

  console.log(`dropping and recreating mysql://${MYSQL_USER}:<hidden>@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}`);
  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASS,
  });
  try {
    await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(MYSQL_DB)}`);
    await connection.query(`CREATE DATABASE ${quoteIdentifier(MYSQL_DB)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }

  const dataSource = createMysqlDataSource({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    username: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DB,
  });
  await dataSource.initialize();
  try {
    const migrations = await dataSource.runMigrations();
    console.log(`database rebuilt; migrations executed: ${migrations.map((item) => item.name).join(', ') || '<none>'}`);
  } finally {
    await dataSource.destroy();
  }
}

function assertLocalDatabaseTarget(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset database while NODE_ENV=production');
  }
  const localHosts = new Set(['127.0.0.1', 'localhost', '::1']);
  if (!localHosts.has(MYSQL_HOST) && process.env.ALLOW_NONLOCAL_DB_RESET !== 'true') {
    throw new Error(`Refusing to reset non-local database host ${MYSQL_HOST}; set ALLOW_NONLOCAL_DB_RESET=true to override`);
  }
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z0-9_$]+$/.test(value)) {
    throw new Error(`Unsafe MySQL identifier: ${value}`);
  }
  return `\`${value}\``;
}

function printUsage(): void {
  console.log(`Usage:
  scripts/dev-contest/reset-dev-db.ts

Environment:
  MYSQL_HOST=${MYSQL_HOST}
  MYSQL_PORT=${MYSQL_PORT}
  MYSQL_USER=${MYSQL_USER}
  MYSQL_PASS=<hidden>
  MYSQL_DB=${MYSQL_DB}

Behavior:
  Drops and recreates the configured local development database, then runs TypeORM migrations.
  The script refuses NODE_ENV=production and non-local hosts unless ALLOW_NONLOCAL_DB_RESET=true.`);
}
