import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';
import request from 'supertest';
import { readFile, rm } from 'node:fs/promises';
import { databaseUrl } from '../src/database-url.js';

// Test data lives only in a database created by this process.
const testDatabase = `duancuoikhoa_test_${process.pid}_${randomBytes(4).toString('hex')}`;
const testUrl = new URL(databaseUrl());
testUrl.pathname = `/${testDatabase}`;
process.env.DATABASE_URL = testUrl.toString();
process.env.DB_NAME = testDatabase;
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'test-admin@example.com';
process.env.ADMIN_PASSWORD = 'TestAdmin@123456';
const { initializeDatabase } = await import('../scripts/init-db.js');
const { prisma, query, connectionOptions, serialize } = await import('../src/db.js');
const { default: app } = await import('../src/app.js');
const { parseDate } = await import('../src/lib/validation.js');
const uploadedFiles = new Set();

after(async () => {
  for (const path of uploadedFiles) {
    assert.match(path, /^\/uploads\/[a-f0-9-]+\.(png|jpg|webp)$/);
    await rm(new URL(`..${path}`, import.meta.url), { force: true });
  }
  await prisma.$disconnect();
  assert.match(testDatabase, /^duancuoikhoa_test_\d+_[a-f0-9]{8}$/);
  const connection = await mysql.createConnection({ ...connectionOptions, database: undefined });
  try { await connection.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``); }
  finally { await connection.end(); }
});

const baseUser = { taiKhoan: 'movie_user', matKhau: 'Customer@123456', email: 'customer@example.com', soDt: '0901234567', hoTen: 'Khách xem phim', maNhom: 'GP01' };
let adminToken, userToken, otherToken;
const adminRequest = (method, path) => request(app)[method](path).auth(adminToken, { type: 'bearer' });
const userRequest = (method, path) => request(app)[method](path).auth(userToken, { type: 'bearer' });

await test('Movie API integration with real MySQL', async t => {
  await initializeDatabase();

  await t.test('initialization is repeatable and keeps seed data', async () => {
    await initializeDatabase();
    const [{ total }] = await query('SELECT COUNT(*) total FROM ghe');
    assert.equal(total, 240);
    const [{ total: shows }] = await query('SELECT COUNT(*) total FROM lich_chieu');
    assert.equal(shows, 2);
  });

  await t.test('register, hash passwords, ignore privilege escalation and authenticate', async () => {
    const result = await request(app).post('/api/QuanLyNguoiDung/DangKy').send({ ...baseUser, maLoaiNguoiDung: 'QuanTri' }).expect(201);
    assert.equal(result.body.content.maLoaiNguoiDung, 'KhachHang');
    assert.equal(result.body.content.matKhau, undefined);
    const [stored] = await query('SELECT matKhau FROM nguoi_dung WHERE taiKhoan=?', [baseUser.taiKhoan]);
    assert.notEqual(stored.matKhau, baseUser.matKhau);
    await request(app).post('/api/QuanLyNguoiDung/DangKy').send(baseUser).expect(409);
    await request(app).post('/api/QuanLyNguoiDung/DangNhap').send({ taiKhoan: baseUser.taiKhoan, matKhau: 'wrong' }).expect(401);
    const login = await request(app).post('/api/QuanLyNguoiDung/DangNhap').send({ taiKhoan: baseUser.taiKhoan, matKhau: baseUser.matKhau }).expect(200);
    userToken = login.body.content.accessToken;
    const adminLogin = await request(app).post('/api/QuanLyNguoiDung/DangNhap').send({ taiKhoan: 'admin', matKhau: process.env.ADMIN_PASSWORD }).expect(200);
    adminToken = adminLogin.body.content.accessToken;
    await request(app).post('/api/QuanLyNguoiDung/DangKy').send({ ...baseUser, taiKhoan: 'movie_other', email: 'other@example.com' }).expect(201);
    const otherLogin = await request(app).post('/api/QuanLyNguoiDung/DangNhap').send({ taiKhoan: 'movie_other', matKhau: baseUser.matKhau }).expect(200);
    otherToken = otherLogin.body.content.accessToken;
  });

  await t.test('all public read endpoints and nested cinema responses', async () => {
    for (const path of [
      '/health', '/api/QuanLyNguoiDung/LayDanhSachLoaiNguoiDung',
      '/api/QuanLyNguoiDung/LayDanhSachNguoiDung', '/api/QuanLyNguoiDung/LayDanhSachNguoiDungPhanTrang',
      '/api/QuanLyNguoiDung/TimKiemNguoiDung?tuKhoa=movie', '/api/QuanLyNguoiDung/TimKiemNguoiDungPhanTrang',
      '/api/QuanLyPhim/LayDanhSachBanner', '/api/QuanLyPhim/LayDanhSachPhim',
      '/api/QuanLyPhim/LayDanhSachPhimPhanTrang', '/api/QuanLyPhim/LayDanhSachPhimTheoNgay?tuNgay=01/01/2020&denNgay=01/01/2099',
      '/api/QuanLyPhim/LayThongTinPhim?MaPhim=1', '/api/QuanLyRap/LayThongTinHeThongRap',
      '/api/QuanLyRap/LayThongTinCumRapTheoHeThong?maHeThongRap=BHDStar',
      '/api/QuanLyRap/LayThongTinLichChieuHeThongRap', '/api/QuanLyRap/LayThongTinLichChieuPhim?MaPhim=1',
      '/api/QuanLyDatVe/LayDanhSachPhongVe?MaLichChieu=1',
    ]) {
      const result = await request(app).get(path).expect(200);
      assert.equal(result.body.statusCode, 200, path);
      assert.equal(JSON.stringify(result.body).includes('matKhau'), false);
    }
    const movie = await request(app).get('/api/QuanLyRap/LayThongTinLichChieuPhim?MaPhim=1');
    assert.equal(movie.body.content.heThongRapChieu[0].lstCumRap[0].lichChieuPhim.length, 1);
    const seats = await request(app).get('/api/QuanLyDatVe/LayDanhSachPhongVe?MaLichChieu=1');
    assert.equal(seats.body.content.danhSachGhe.length, 80);
    assert.equal(seats.body.content.danhSachGhe[0].daDat, false);
  });

  await t.test('validation rejects invalid IDs, pagination, dates and malformed JSON', async () => {
    for (const path of ['/api/QuanLyPhim/LayThongTinPhim?MaPhim=abc', '/api/QuanLyPhim/LayDanhSachPhimPhanTrang?soTrang=0', '/api/QuanLyPhim/LayDanhSachPhimPhanTrang?soPhanTuTrenTrang=101', '/api/QuanLyPhim/LayDanhSachPhimTheoNgay?tuNgay=31/02/2030']) await request(app).get(path).expect(400);
    await request(app).post('/api/QuanLyNguoiDung/DangNhap').set('Content-Type', 'application/json').send('{').expect(400);
    assert.throws(() => parseDate('31/02/2030'));
    assert.equal(parseDate('20/12/2030 19:00:00').toISOString(), '2030-12-20T12:00:00.000Z');
    const result = await request(app).get('/api/QuanLyPhim/LayDanhSachPhim?tenPhim=%27%20OR%201=1--').expect(200);
    assert.equal(result.body.content.length, 0);
    await request(app).get('/api/QuanLyPhim/LayThongTinPhim?MaPhim=999999').expect(404);
  });

  await t.test('enforce JWT, admin rights and account ownership', async () => {
    await request(app).post('/api/QuanLyDatVe/DatVe').send({}).expect(401);
    await request(app).post('/api/QuanLyNguoiDung/ThongTinTaiKhoan').auth('broken', { type: 'bearer' }).expect(401);
    await userRequest('post', '/api/QuanLyDatVe/TaoLichChieu').send({}).expect(403);
    await userRequest('post', '/api/QuanLyPhim/ThemPhimUploadHinh').send({}).expect(403);
    await userRequest('post', '/api/QuanLyNguoiDung/LayThongTinNguoiDung?taiKhoan=admin').expect(403);
    await userRequest('put', '/api/QuanLyNguoiDung/CapNhatThongTinNguoiDung').send({ ...baseUser, maLoaiNguoiDung: 'QuanTri' }).expect(403);
    await adminRequest('post', '/api/QuanLyNguoiDung/LayThongTinNguoiDung?taiKhoan=movie_user').expect(200);
    await adminRequest('delete', '/api/QuanLyNguoiDung/XoaNguoiDung?TaiKhoan=admin').expect(409);
    await adminRequest('post', '/api/QuanLyPhim/CapNhatPhimUpload').expect(400);
    await userRequest('put', '/api/QuanLyNguoiDung/CapNhatThongTinNguoiDung').expect(400);
  });

  await t.test('create, update and delete users through all write methods', async () => {
    const data = { ...baseUser, taiKhoan: 'temporary_user', email: 'temporary@example.com' };
    await adminRequest('post', '/api/QuanLyNguoiDung/ThemNguoiDung').send(data).expect(201);
    await adminRequest('put', '/api/QuanLyNguoiDung/CapNhatThongTinNguoiDung').send({ ...data, hoTen: 'Đã cập nhật' }).expect(200);
    await adminRequest('post', '/api/QuanLyNguoiDung/CapNhatThongTinNguoiDung').send({ ...data, hoTen: 'Cập nhật lần hai' }).expect(200);
    await adminRequest('delete', '/api/QuanLyNguoiDung/XoaNguoiDung?TaiKhoan=temporary_user').expect(200);
  });

  await t.test('movie CRUD and image uploads match Swagger multipart fields', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
    const result = await adminRequest('post', '/api/QuanLyPhim/ThemPhimUploadHinh').field('tenPhim', 'Phim kiểm thử').field('moTa', 'Mô tả').field('ngayKhoiChieu', '20/12/2030').field('hot', 'true').attach('File', png, 'movie.png').expect(201);
    const movie = result.body.content;
    uploadedFiles.add(movie.hinhAnh);
    assert.equal(movie.hot, true);
    await request(app).get(movie.hinhAnh).expect(200).expect('Content-Type', /image\/png/);
    await adminRequest('post', '/api/QuanLyPhim/CapNhatPhimUpload').field('maPhim', movie.maPhim).field('tenPhim', 'Phim đã sửa').expect(200);
    const replacement = await adminRequest('post', '/api/QuanLyPhim?tenPhim=Phim%20%C4%91%C3%A3%20s%E1%BB%ADa&maNhom=GP01').attach('file', png, 'replacement.png').expect(200);
    uploadedFiles.add(replacement.body.content.hinhAnh);
    await adminRequest('post', '/api/QuanLyPhim/CapNhatPhimUpload').field('maPhim', movie.maPhim).attach('File', Buffer.from('not an image'), 'fake.png').expect(400);
    await adminRequest('delete', `/api/QuanLyPhim/XoaPhim?MaPhim=${movie.maPhim}`).expect(200);
    await adminRequest('delete', '/api/QuanLyPhim/XP?MaPhim=999999').expect(404);
    await adminRequest('delete', '/api/QuanLyPhim/XoaPhim?MaPhim=1').expect(409);
  });

  await t.test('create schedules, reject overlapping concurrent schedules and past times', async () => {
    const start = new Date(Date.now() + 20 * 86400000).toISOString();
    const data = { maPhim: 1, maRap: '2', ngayChieuGioChieu: start, giaVe: 80000 };
    const results = await Promise.all([adminRequest('post', '/api/QuanLyDatVe/TaoLichChieu').send(data), adminRequest('post', '/api/QuanLyDatVe/TaoLichChieu').send(data)]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    await adminRequest('post', '/api/QuanLyDatVe/TaoLichChieu').send({ ...data, ngayChieuGioChieu: '01/01/2000 12:00:00' }).expect(400);
    await adminRequest('post', '/api/QuanLyDatVe/TaoLichChieu').send({ ...data, maRap: 999999 }).expect(404);
    await adminRequest('post', '/api/QuanLyPhim/CapNhatPhimUpload').send({ maPhim: 1, thoiLuong: 10 }).expect(409);
    await adminRequest('post', '/api/QuanLyPhim/CapNhatPhimUpload').send({ maPhim: 1, thoiLuong: 120 }).expect(200);
  });

  await t.test('booking rejects duplicate seats, wrong auditorium and price tampering', async () => {
    for (const danhSachVe of [[{ maGhe: 1 }, { maGhe: 1 }], [{ maGhe: 81 }], [{ maGhe: 1, giaVe: 1 }], []]) await userRequest('post', '/api/QuanLyDatVe/DatVe').send({ maLichChieu: 1, danhSachVe }).expect(400);
    const [{ total }] = await query('SELECT COUNT(*) total FROM ve');
    assert.equal(total, 0);
  });

  await t.test('concurrent customers cannot book the same seat', async () => {
    const body = { maLichChieu: 1, danhSachVe: [{ maGhe: 1, giaVe: 75000 }] };
    const results = await Promise.all([userRequest('post', '/api/QuanLyDatVe/DatVe').send(body), request(app).post('/api/QuanLyDatVe/DatVe').auth(otherToken, { type: 'bearer' }).send(body)]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const [{ total }] = await query('SELECT COUNT(*) total FROM ve WHERE maLichChieu=1 AND maGhe=1');
    assert.equal(total, 1);
    const seats = await request(app).get('/api/QuanLyDatVe/LayDanhSachPhongVe?MaLichChieu=1');
    assert.equal(seats.body.content.danhSachGhe[0].daDat, true);
  });

  await t.test('multi-seat booking is atomic and history is private', async () => {
    await userRequest('post', '/api/QuanLyDatVe/DatVe').send({ maLichChieu: 1, danhSachVe: [{ maGhe: 2 }, { maGhe: 1 }] }).expect(409);
    const [{ total }] = await query('SELECT COUNT(*) total FROM ve WHERE maGhe=2');
    assert.equal(total, 0);
    const result = await userRequest('post', '/api/QuanLyDatVe/DatVe').send({ maLichChieu: 1, danhSachVe: [{ maGhe: 2 }, { maGhe: 3 }] }).expect(201);
    assert.equal(result.body.content.tongTien, 150000);
    const history = await userRequest('post', '/api/QuanLyNguoiDung/ThongTinTaiKhoan').expect(200);
    assert.ok(history.body.content.thongTinDatVe[0].danhSachGhe.length >= 2);
    await adminRequest('delete', '/api/QuanLyNguoiDung/XoaNguoiDung?TaiKhoan=movie_user').expect(409);
    await query('UPDATE lich_chieu SET ngayChieuGioChieu=?,ketThuc=? WHERE maLichChieu=1', ['2000-01-01 00:00:00', '2000-01-01 02:00:00']);
    await userRequest('post', '/api/QuanLyDatVe/DatVe').send({ maLichChieu: 1, danhSachVe: [{ maGhe: 4 }] }).expect(409);
  });

  await t.test('baseline preserves existing data and password without recreating tables', async () => {
    const models = ['banner', 'cum_rap', 'ghe', 'he_thong_rap', 'lich_chieu', 'nguoi_dung', 'phim', 'rap', 've'];
    const before = await Promise.all(models.map(model => prisma[model].count()));
    const adminBefore = await prisma.nguoi_dung.findUnique({ where: { taiKhoan: 'admin' } });
    const ticketsBefore = serialize(await prisma.ve.findMany({ orderBy: { maVe: 'asc' } }));
    assert.equal(connectionOptions.database, testDatabase);
    await prisma.$executeRawUnsafe('DROP TABLE `_prisma_migrations`');
    await initializeDatabase();
    assert.deepEqual(await Promise.all(models.map(model => prisma[model].count())), before);
    assert.equal((await prisma.nguoi_dung.findUnique({ where: { taiKhoan: 'admin' } })).matKhau, adminBefore.matKhau);
    assert.deepEqual(serialize(await prisma.ve.findMany({ orderBy: { maVe: 'asc' } })), ticketsBefore);
    const [baseline] = await query('SELECT migration_name FROM _prisma_migrations WHERE migration_name=? AND finished_at IS NOT NULL', ['0_init']);
    assert.equal(baseline.migration_name, '0_init');
  });

  await t.test('Swagger and Postman document all HTTP operations', async () => {
    const swagger = await request(app).get('/swagger.json').expect(200);
    assert.equal(Object.values(swagger.body.paths).reduce((n, methods) => n + Object.keys(methods).length, 0), 30);
    const postman = JSON.parse(await readFile(new URL('../docs/movie.postman_collection.json', import.meta.url), 'utf8'));
    assert.equal(postman.item.length, 30);
    await request(app).get('/swagger/').expect(200);
  });
});
