import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pathToFileURL } from 'node:url';
import env from '../src/config.js';
import { connectionOptions } from '../src/db.js';

export async function initializeDatabase() {
  const adminEmail = z.email().parse(process.env.ADMIN_EMAIL);
  const adminPassword = z.string().min(12).max(72).parse(process.env.ADMIN_PASSWORD);
  const connection = await mysql.createConnection({ ...connectionOptions, database: undefined, multipleStatements: true });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.changeUser({ database: env.DB_NAME });
    const schema = await readFile(new URL('../db_duancuoikhoa.sql', import.meta.url), 'utf8');
    await connection.query(schema.replace(/^CREATE DATABASE[^;]*;\s*USE[^;]*;/, ''));
    const [users] = await connection.execute('SELECT taiKhoan FROM nguoi_dung WHERE taiKhoan=?', ['admin']);
    if (!users.length) await connection.execute('INSERT INTO nguoi_dung (taiKhoan,matKhau,email,soDt,hoTen,maLoaiNguoiDung) VALUES (?,?,?,?,?,?)', ['admin', await bcrypt.hash(adminPassword, 12), adminEmail, '0900000000', 'Quản trị viên', 'QuanTri']);
    for (const room of [1, 2, 3]) {
      for (let seat = 1; seat <= 80; seat++) {
        const name = `${String.fromCharCode(65 + Math.floor((seat - 1) / 10))}${String((seat - 1) % 10 + 1).padStart(2, '0')}`;
        await connection.execute('INSERT IGNORE INTO ghe (maRap,tenGhe,loaiGhe,stt) VALUES (?,?,?,?)', [room, name, seat > 30 && seat <= 60 ? 'Vip' : 'Thuong', seat]);
      }
    }
    const [schedules] = await connection.execute('SELECT maLichChieu FROM lich_chieu LIMIT 1');
    if (!schedules.length) await connection.query(`INSERT INTO lich_chieu (maPhim,maRap,ngayChieuGioChieu,ketThuc,giaVe) VALUES
      (1,1,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY),DATE_ADD(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY), INTERVAL 120 MINUTE),75000),
      (2,3,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY),DATE_ADD(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY), INTERVAL 100 MINUTE),90000)`);
    console.log(`Đã khởi tạo ${env.DB_NAME}. Tài khoản quản trị: admin (mật khẩu trong biến ADMIN_PASSWORD).`);
  } finally { await connection.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  initializeDatabase().catch(error => { console.error(error.message); process.exitCode = 1; });
}
