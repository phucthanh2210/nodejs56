import { PrismaClient, Prisma } from '@prisma/client';
import { databaseUrl, mysqlOptions } from './database-url.js';

export const connectionOptions = mysqlOptions();
export const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl() } } });

export function serialize(value, key = '') {
  if (value instanceof Date) return value.toISOString().slice(0, key === 'ngayKhoiChieu' ? 10 : 19).replace('T', ' ');
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new RangeError('Database integer exceeds JSON safe range');
    return number;
  }
  if (Array.isArray(value)) return value.map(item => serialize(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, serialize(item, name)]));
  return value;
}

// SQL fragments are internal constants or validated identifiers/pagination.
// Every data value remains a bound parameter, including FOR UPDATE queries.
export async function query(sql, params = [], connection = prisma) {
  const parts = sql.split('?');
  if (parts.length !== params.length + 1) throw new Error('SQL parameter count mismatch');
  parts.raw = [...parts];
  const statement = Prisma.sql(parts, ...params);
  if (/^\s*SELECT\b/i.test(sql)) return serialize(await connection.$queryRaw(statement));
  return connection.$executeRaw(statement);
}

export function transaction(work) {
  return prisma.$transaction(work, { maxWait: 10000, timeout: 15000 });
}
