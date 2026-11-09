import { z } from 'zod';
import { pool, query } from '../db.js';
import { HttpError, respond } from '../lib/http.js';
import { id, parseDate, sqlDate } from '../lib/validation.js';
import { getMovie } from './movies.js';

const scheduleSchema = z.object({
  maPhim: id,
  maRap: id,
  ngayChieuGioChieu: z.string().transform(value => parseDate(value)),
  giaVe: z.coerce.number().int().min(1000).max(10000000),
}).strict();

export async function createSchedule(req, res) {
  const data = scheduleSchema.parse(req.body);
  if (data.ngayChieuGioChieu <= new Date()) throw new HttpError(400, 'Lịch chiếu phải ở tương lai');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [room] = await query('SELECT maRap FROM rap WHERE maRap=? FOR UPDATE', [data.maRap], connection);
    if (!room) throw new HttpError(404, 'Không tìm thấy rạp');
    // Lock order is always room, movie, then showtime for schedule creation.
    await query('SELECT maPhim FROM phim WHERE maPhim=? FOR UPDATE', [data.maPhim], connection);
    const movie = await getMovie(data.maPhim, connection);
    const start = sqlDate(data.ngayChieuGioChieu);
    const end = sqlDate(new Date(data.ngayChieuGioChieu.getTime() + movie.thoiLuong * 60000));
    const conflicts = await query('SELECT maLichChieu FROM lich_chieu WHERE maRap=? AND ngayChieuGioChieu<? AND ketThuc>? FOR UPDATE', [data.maRap, end, start], connection);
    if (conflicts.length) throw new HttpError(409, 'Lịch chiếu bị trùng thời gian trong rạp');
    const result = await query('INSERT INTO lich_chieu (maPhim,maRap,ngayChieuGioChieu,ketThuc,giaVe) VALUES (?,?,?,?,?)', [data.maPhim, data.maRap, start, end, data.giaVe], connection);
    await connection.commit();
    return respond(res, { maLichChieu: result.insertId, ...data, ngayChieuGioChieu: data.ngayChieuGioChieu.toISOString() }, 201);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

const bookingSchema = z.object({
  maLichChieu: id,
  danhSachVe: z.array(z.object({ maGhe: id, giaVe: z.number().positive().optional() }).strict()).min(1).max(10),
}).strict();

export async function bookTickets(req, res) {
  const data = bookingSchema.parse(req.body);
  const seats = data.danhSachVe.map(ticket => ticket.maGhe).sort((a, b) => a - b);
  if (new Set(seats).size !== seats.length) throw new HttpError(400, 'Danh sách ghế bị lặp');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Serialize reservations for a showtime; all seats commit or roll back together.
    const [showtime] = await query('SELECT * FROM lich_chieu WHERE maLichChieu=? FOR UPDATE', [data.maLichChieu], connection);
    if (!showtime) throw new HttpError(404, 'Không tìm thấy lịch chiếu');
    if (new Date(`${showtime.ngayChieuGioChieu.replace(' ', 'T')}Z`) <= new Date()) throw new HttpError(409, 'Suất chiếu đã bắt đầu');
    const placeholders = seats.map(() => '?').join(',');
    const validSeats = await query(`SELECT maGhe FROM ghe WHERE maRap=? AND maGhe IN (${placeholders})`, [showtime.maRap, ...seats], connection);
    if (validSeats.length !== seats.length) throw new HttpError(400, 'Ghế không thuộc rạp của lịch chiếu');
    if (data.danhSachVe.some(ticket => ticket.giaVe !== undefined && ticket.giaVe !== showtime.giaVe)) throw new HttpError(400, 'Giá vé không khớp giá của lịch chiếu');
    const booked = await query(`SELECT maGhe FROM ve WHERE maLichChieu=? AND maGhe IN (${placeholders}) FOR UPDATE`, [data.maLichChieu, ...seats], connection);
    if (booked.length) throw new HttpError(409, 'Một hoặc nhiều ghế đã được đặt');
    for (const seat of seats) await query('INSERT INTO ve (taiKhoan,maLichChieu,maGhe,giaVe) VALUES (?,?,?,?)', [req.user.taiKhoan, data.maLichChieu, seat, showtime.giaVe], connection);
    await connection.commit();
    return respond(res, { maLichChieu: data.maLichChieu, danhSachVe: seats.map(maGhe => ({ maGhe, giaVe: showtime.giaVe })), tongTien: seats.length * showtime.giaVe }, 201);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function seating(req, res) {
  const maLichChieu = id.parse(req.query.MaLichChieu);
  const [info] = await query(`SELECT l.*,p.tenPhim,p.hinhAnh,r.tenRap,c.tenCumRap,c.diaChi
    FROM lich_chieu l JOIN phim p ON p.maPhim=l.maPhim JOIN rap r ON r.maRap=l.maRap
    JOIN cum_rap c ON c.maCumRap=r.maCumRap WHERE l.maLichChieu=?`, [maLichChieu]);
  if (!info) throw new HttpError(404, 'Không tìm thấy lịch chiếu');
  const seats = await query(`SELECT g.*,v.maVe FROM ghe g LEFT JOIN ve v ON v.maGhe=g.maGhe AND v.maLichChieu=? WHERE g.maRap=? ORDER BY g.stt`, [maLichChieu, info.maRap]);
  const local = new Date(`${info.ngayChieuGioChieu.replace(' ', 'T')}Z`);
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).format(local);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(local);
  return respond(res, {
    thongTinPhim: { maLichChieu, maPhim: info.maPhim, tenPhim: info.tenPhim, hinhAnh: info.hinhAnh, tenCumRap: info.tenCumRap, tenRap: info.tenRap, diaChi: info.diaChi, ngayChieu: date, gioChieu: time, ngayChieuGioChieu: local.toISOString() },
    danhSachGhe: seats.map(({ maVe, ...seat }) => ({ ...seat, giaVe: info.giaVe, daDat: Boolean(maVe), taiKhoanNguoiDat: null })),
  });
}
