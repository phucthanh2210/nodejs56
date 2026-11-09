import 'dotenv/config';

// Keep DB_* configuration compatible with existing local and Railway setup.
export function databaseUrl(source = process.env) {
  if (source.DATABASE_URL) return source.DATABASE_URL;
  const user = encodeURIComponent(source.DB_USER || 'root');
  const password = encodeURIComponent(source.DB_PASSWORD || '');
  const host = source.DB_HOST || '127.0.0.1';
  const port = source.DB_PORT || '3307';
  const name = encodeURIComponent(source.DB_NAME || 'duancuoikhoa');
  return `mysql://${user}:${password}@${host}:${port}/${name}`;
}

export function mysqlOptions(source = process.env) {
  const url = new URL(databaseUrl(source));
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://');
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Invalid database name');
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    timezone: 'Z',
    dateStrings: true,
    decimalNumbers: true,
  };
}
