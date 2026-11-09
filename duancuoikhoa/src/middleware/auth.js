import jwt from 'jsonwebtoken';
import env from '../config.js';
import { query } from '../db.js';
import { HttpError } from '../lib/http.js';

export const userColumns = 'taiKhoan,email,soDt,hoTen,maNhom,maLoaiNguoiDung';

export async function authenticate(req, res, next) {
  const token = /^Bearer (\S+)$/i.exec(req.get('Authorization') || '')?.[1];
  if (!token) throw new HttpError(401, 'Cần đăng nhập bằng Bearer token');
  let payload;
  try { payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw new HttpError(401, 'Token không hợp lệ hoặc đã hết hạn'); }
  const [user] = await query(`SELECT ${userColumns} FROM nguoi_dung WHERE taiKhoan=?`, [payload.sub]);
  if (!user) throw new HttpError(401, 'Tài khoản không tồn tại');
  req.user = user;
  next();
}

export function admin(req, res, next) {
  if (req.user.maLoaiNguoiDung !== 'QuanTri') throw new HttpError(403, 'Chỉ quản trị viên được thực hiện');
  next();
}

export function requireOwner(req, taiKhoan) {
  if (req.user.taiKhoan !== taiKhoan && req.user.maLoaiNguoiDung !== 'QuanTri') throw new HttpError(403, 'Không có quyền truy cập tài khoản này');
}
