import mysql from 'mysql2/promise';
import { z } from 'zod';
import { pathToFileURL } from 'node:url';
import { prisma, connectionOptions } from '../src/db.js';
import { seedDatabase } from '../prisma/seed.js';
import { runPrisma } from './prisma-cli.js';

const expectedTables = ['banner', 'cum_rap', 'ghe', 'he_thong_rap', 'lich_chieu', 'nguoi_dung', 'phim', 'rap', 've'];

export async function initializeDatabase() {
  z.email().parse(process.env.ADMIN_EMAIL);
  z.string().min(12).max(72).parse(process.env.ADMIN_PASSWORD);
  // mysql2 only provisions the database before Prisma has a schema to connect to.
  const connection = await mysql.createConnection({ ...connectionOptions, database: undefined });
  try {
    const name = connectionOptions.database;
    const [existing] = await connection.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?', [name]);
    if (!existing.length) await connection.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    const [tables] = await connection.execute("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'", [name]);
    const names = tables.map(table => table.name);
    if (names.length && !names.includes('_prisma_migrations')) {
      if (names.length !== expectedTables.length || !expectedTables.every(table => names.includes(table))) throw new Error('Database hiện có không khớp 9 bảng dự án; dừng để tránh thay đổi dữ liệu.');
      // Compare before baselining. No reset, DROP, or overwrite of existing data.
      runPrisma(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']);
      runPrisma(['migrate', 'resolve', '--applied', '0_init']);
    }
    runPrisma(['migrate', 'deploy']);
    await seedDatabase();
    console.log(`Đã khởi tạo ${name} bằng Prisma. Tài khoản quản trị: admin (mật khẩu trong biến ADMIN_PASSWORD).`);
  } finally { await connection.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  initializeDatabase().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
