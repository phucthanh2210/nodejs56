import { z } from 'zod';
import { HttpError } from './http.js';

export const id = z.coerce.number().int().positive();
export const account = z.string().trim().regex(/^[a-zA-Z0-9_]{3,50}$/);
export const group = z.string().regex(/^GP\d{2}$/).default('GP01');
const text = (max) => z.string().trim().min(1).max(max);
export const userSchema = z.object({
  taiKhoan: account,
  matKhau: z.string().min(8).max(72),
  email: z.email().max(191),
  soDt: z.string().regex(/^\+?[0-9]{9,15}$/),
  hoTen: text(100),
  maNhom: group,
  maLoaiNguoiDung: z.enum(['KhachHang', 'QuanTri']).default('KhachHang'),
}).strict();

export function parseDate(value, dateOnly = false) {
  if (typeof value !== 'string') throw new HttpError(400, 'Ngày không hợp lệ');
  let normalized = value.trim();
  const vn = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(normalized);
  if (vn) normalized = `${vn[3]}-${vn[2]}-${vn[1]}${vn[4] ? `T${vn[4]}:${vn[5]}:${vn[6] || '00'}+07:00` : ''}`;
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(normalized);
  if (!parts) throw new HttpError(400, 'Ngày phải có dạng dd/MM/yyyy hoặc ISO 8601');
  const [, y, m, d, hour, minute, second, zone] = parts;
  const calendar = new Date(Date.UTC(+y, +m - 1, +d));
  if (calendar.getUTCFullYear() !== +y || calendar.getUTCMonth() !== +m - 1 || calendar.getUTCDate() !== +d || +(hour || 0) > 23 || +(minute || 0) > 59 || +(second || 0) > 59) throw new HttpError(400, 'Ngày giờ không tồn tại');
  if (dateOnly) return `${y}-${m}-${d}`;
  const date = new Date(`${y}-${m}-${d}T${hour || '00'}:${minute || '00'}:${second || '00'}${zone || '+07:00'}`);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Ngày giờ không hợp lệ');
  return date;
}

const bool = z.preprocess(v => v === 'true' ? true : v === 'false' ? false : v, z.boolean());
export const movieSchema = z.object({
  tenPhim: text(200),
  trailer: z.union([z.url({ protocol: /^https?$/ }), z.literal('')]).default(''),
  moTa: text(10000),
  maNhom: group,
  ngayKhoiChieu: z.string().transform(v => parseDate(v, true)),
  danhGia: z.coerce.number().int().min(0).max(10).default(0),
  hot: bool.default(false),
  dangChieu: bool.default(true),
  sapChieu: bool.default(false),
  thoiLuong: z.coerce.number().int().min(1).max(600).default(120),
}).strict();

export function pagination(query) {
  return z.object({
    soTrang: z.coerce.number().int().min(1).default(1),
    soPhanTuTrenTrang: z.coerce.number().int().min(1).max(100).default(20),
  }).parse(query);
}

export function paginated(items, totalCount, { soTrang, soPhanTuTrenTrang }) {
  return { currentPage: soTrang, count: items.length, totalPages: Math.ceil(totalCount / soPhanTuTrenTrang), totalCount, items };
}

export function keyword(value = '') {
  return z.string().max(200).parse(value);
}

export function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const sqlDate = date => date.toISOString().slice(0, 19).replace('T', ' ');
