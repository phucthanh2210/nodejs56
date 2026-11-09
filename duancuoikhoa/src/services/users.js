import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import env from '../config.js';
import { query } from '../db.js';
import { userColumns, requireOwner } from '../middleware/auth.js';
import { HttpError, respond } from '../lib/http.js';
import { userSchema, account, group, keyword, pagination, paginated } from '../lib/validation.js';

export async function register(req, res) {
  const data = userSchema.parse({ ...req.body, maLoaiNguoiDung: 'KhachHang' });
  return create(data, res);
}

export async function addUser(req, res) {
  return create(userSchema.parse(req.body), res);
}

async function create(data, res) {
  const hash = await bcrypt.hash(data.matKhau, 12);
  await query('INSERT INTO nguoi_dung (taiKhoan,matKhau,email,soDt,hoTen,maNhom,maLoaiNguoiDung) VALUES (?,?,?,?,?,?,?)',
    [data.taiKhoan, hash, data.email, data.soDt, data.hoTen, data.maNhom, data.maLoaiNguoiDung]);
  const { matKhau, ...user } = data;
  return respond(res, user, 201);
}

export async function login(req, res) {
  const data = z.object({ taiKhoan: account, matKhau: z.string().min(1).max(72) }).parse(req.body);
  const [user] = await query('SELECT * FROM nguoi_dung WHERE taiKhoan=?', [data.taiKhoan]);
  if (!user || !await bcrypt.compare(data.matKhau, user.matKhau)) throw new HttpError(401, 'Tài khoản hoặc mật khẩu không đúng');
  const { matKhau, createdAt, ...publicUser } = user;
  const accessToken = jwt.sign({}, env.JWT_SECRET, { subject: user.taiKhoan, algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN });
  return respond(res, { ...publicUser, accessToken });
}

export async function listUsers(req, res) {
  const maNhom = group.parse(req.query.MaNhom ?? req.query.maNhom);
  const term = `%${keyword(req.query.tuKhoa)}%`;
  const where = 'WHERE maNhom=? AND (taiKhoan LIKE ? OR hoTen LIKE ? OR email LIKE ?)';
  const params = [maNhom, term, term, term];
  if (!req.path.endsWith('PhanTrang')) return respond(res, await query(`SELECT ${userColumns} FROM nguoi_dung ${where} ORDER BY taiKhoan`, params));
  const page = pagination(req.query);
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM nguoi_dung ${where}`, params);
  const items = await query(`SELECT ${userColumns} FROM nguoi_dung ${where} ORDER BY taiKhoan LIMIT ${page.soPhanTuTrenTrang} OFFSET ${(page.soTrang - 1) * page.soPhanTuTrenTrang}`, params);
  return respond(res, paginated(items, total, page));
}

export async function accountInfo(req, res) {
  const target = req.path.endsWith('/ThongTinTaiKhoan') ? req.user.taiKhoan : account.parse(req.query.taiKhoan);
  requireOwner(req, target);
  const [user] = await query(`SELECT ${userColumns} FROM nguoi_dung WHERE taiKhoan=?`, [target]);
  if (!user) throw new HttpError(404, 'Không tìm thấy người dùng');
  const tickets = await query(`SELECT v.maVe,v.maLichChieu,v.ngayDat,v.giaVe,g.maGhe,g.tenGhe,
    p.tenPhim,p.hinhAnh,r.maRap,r.tenRap,c.maCumRap,c.tenCumRap,h.maHeThongRap,h.tenHeThongRap
    FROM ve v JOIN ghe g ON g.maGhe=v.maGhe JOIN lich_chieu l ON l.maLichChieu=v.maLichChieu
    JOIN phim p ON p.maPhim=l.maPhim JOIN rap r ON r.maRap=l.maRap JOIN cum_rap c ON c.maCumRap=r.maCumRap
    JOIN he_thong_rap h ON h.maHeThongRap=c.maHeThongRap WHERE v.taiKhoan=? ORDER BY v.maVe DESC`, [target]);
  const grouped = new Map();
  for (const ticket of tickets) {
    if (!grouped.has(ticket.maLichChieu)) grouped.set(ticket.maLichChieu, { maVe: ticket.maVe, maLichChieu: ticket.maLichChieu, ngayDat: ticket.ngayDat, tenPhim: ticket.tenPhim, hinhAnh: ticket.hinhAnh, giaVe: ticket.giaVe, danhSachGhe: [] });
    const { maGhe, tenGhe, maRap, tenRap, maHeThongRap, tenHeThongRap, maCumRap, tenCumRap } = ticket;
    grouped.get(ticket.maLichChieu).danhSachGhe.push({ maGhe, tenGhe, maRap, tenRap, maHeThongRap, tenHeThongRap, maCumRap, tenCumRap });
  }
  return respond(res, { ...user, loaiNguoiDung: { maLoaiNguoiDung: user.maLoaiNguoiDung, tenLoai: user.maLoaiNguoiDung === 'QuanTri' ? 'Quản trị' : 'Khách hàng' }, thongTinDatVe: [...grouped.values()] });
}

export async function updateUser(req, res) {
  const target = account.parse(req.body?.taiKhoan);
  requireOwner(req, target);
  const [existing] = await query('SELECT * FROM nguoi_dung WHERE taiKhoan=?', [target]);
  if (!existing) throw new HttpError(404, 'Không tìm thấy người dùng');
  const data = userSchema.omit({ matKhau: true }).extend({ matKhau: userSchema.shape.matKhau.optional() }).parse(req.body);
  if (req.user.maLoaiNguoiDung !== 'QuanTri' && (data.maLoaiNguoiDung !== existing.maLoaiNguoiDung || data.maNhom !== existing.maNhom)) throw new HttpError(403, 'Không được thay đổi quyền hoặc nhóm');
  if (existing.maLoaiNguoiDung === 'QuanTri' && data.maLoaiNguoiDung !== 'QuanTri') throw new HttpError(409, 'Không hạ quyền tài khoản quản trị qua API này');
  const hash = data.matKhau ? await bcrypt.hash(data.matKhau, 12) : existing.matKhau;
  await query('UPDATE nguoi_dung SET matKhau=?,email=?,soDt=?,hoTen=?,maNhom=?,maLoaiNguoiDung=? WHERE taiKhoan=?',
    [hash, data.email, data.soDt, data.hoTen, data.maNhom, data.maLoaiNguoiDung, target]);
  const { matKhau, ...user } = data;
  return respond(res, user);
}

export async function deleteUser(req, res) {
  const target = account.parse(req.query.TaiKhoan);
  const [user] = await query('SELECT maLoaiNguoiDung FROM nguoi_dung WHERE taiKhoan=?', [target]);
  if (!user) throw new HttpError(404, 'Không tìm thấy người dùng');
  if (user.maLoaiNguoiDung === 'QuanTri') throw new HttpError(409, 'Không xóa tài khoản quản trị qua API này');
  await query('DELETE FROM nguoi_dung WHERE taiKhoan=?', [target]);
  return respond(res, 'Xóa người dùng thành công');
}
