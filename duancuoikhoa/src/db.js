import mysql from 'mysql2/promise';
import env from './config.js';

export const connectionOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  timezone: 'Z',
  dateStrings: true,
  decimalNumbers: true,
};

export const pool = mysql.createPool({ ...connectionOptions, connectionLimit: 10 });

export async function query(sql, params = [], connection = pool) {
  const [rows] = await connection.execute(sql, params);
  return rows;
}
