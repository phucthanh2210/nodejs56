import { z } from 'zod';
import { query } from '../db.js';
import { respond, HttpError } from '../lib/http.js';
import { group } from '../lib/validation.js';
import { getMovie, movieDto } from './movies.js';

export async function systems(req, res) {
  const code = z.string().max(50).parse(req.query.maHeThongRap || '');
  const data = await query(`SELECT * FROM he_thong_rap ${code ? 'WHERE maHeThongRap=?' : ''} ORDER BY maHeThongRap`, code ? [code] : []);
  if (code && !data.length) throw new HttpError(404, 'Không tìm thấy hệ thống rạp');
  return respond(res, data);
}

export async function complexes(req, res) {
  const code = z.string().min(1).max(50).parse(req.query.maHeThongRap);
  const [system] = await query('SELECT maHeThongRap FROM he_thong_rap WHERE maHeThongRap=?', [code]);
  if (!system) throw new HttpError(404, 'Không tìm thấy hệ thống rạp');
  const data = await query('SELECT * FROM cum_rap WHERE maHeThongRap=? ORDER BY maCumRap', [code]);
  const rooms = await query('SELECT r.* FROM rap r JOIN cum_rap c ON c.maCumRap=r.maCumRap WHERE c.maHeThongRap=? ORDER BY maRap', [code]);
  return respond(res, data.map(c => ({ ...c, danhSachRap: rooms.filter(r => r.maCumRap === c.maCumRap).map(({ maRap, tenRap }) => ({ maRap, tenRap })) })));
}

export async function systemSchedules(req, res) {
  const code = z.string().max(50).parse(req.query.maHeThongRap || '');
  const maNhom = group.parse(req.query.maNhom);
  const systems = await query(`SELECT * FROM he_thong_rap ${code ? 'WHERE maHeThongRap=?' : ''} ORDER BY maHeThongRap`, code ? [code] : []);
  if (code && !systems.length) throw new HttpError(404, 'Không tìm thấy hệ thống rạp');
  const complexes = await query('SELECT * FROM cum_rap ORDER BY maCumRap');
  const rows = await query(`SELECT p.*,l.maLichChieu,l.maRap,l.ngayChieuGioChieu,l.giaVe,r.tenRap,r.maCumRap
    FROM lich_chieu l JOIN phim p ON p.maPhim=l.maPhim JOIN rap r ON r.maRap=l.maRap WHERE p.maNhom=? ORDER BY l.ngayChieuGioChieu,l.maLichChieu`, [maNhom]);
  const result = systems.map(system => ({ ...system, lstCumRap: complexes.filter(c => c.maHeThongRap === system.maHeThongRap).map(c => {
    const movies = new Map();
    for (const row of rows.filter(row => row.maCumRap === c.maCumRap)) {
      if (!movies.has(row.maPhim)) movies.set(row.maPhim, { maPhim: row.maPhim, tenPhim: row.tenPhim, hinhAnh: row.hinhAnh, hot: Boolean(row.hot), dangChieu: Boolean(row.dangChieu), sapChieu: Boolean(row.sapChieu), lstLichChieuTheoPhim: [] });
      movies.get(row.maPhim).lstLichChieuTheoPhim.push(showtimeDto(row));
    }
    return { ...c, danhSachPhim: [...movies.values()] };
  }) }));
  return respond(res, result);
}

function showtimeDto(row) {
  return { maLichChieu: row.maLichChieu, maRap: row.maRap, tenRap: row.tenRap, ngayChieuGioChieu: `${row.ngayChieuGioChieu.replace(' ', 'T')}Z`, giaVe: row.giaVe, thoiLuong: row.thoiLuong };
}

export async function movieSchedules(req, res) {
  const movie = await getMovie(req.query.MaPhim);
  const rows = await query(`SELECT l.*,r.tenRap,c.*,h.tenHeThongRap,h.logo,h.biDanh
    FROM lich_chieu l JOIN rap r ON r.maRap=l.maRap JOIN cum_rap c ON c.maCumRap=r.maCumRap
    JOIN he_thong_rap h ON h.maHeThongRap=c.maHeThongRap WHERE l.maPhim=? ORDER BY l.ngayChieuGioChieu,l.maLichChieu`, [movie.maPhim]);
  const systems = new Map();
  for (const row of rows) {
    if (!systems.has(row.maHeThongRap)) systems.set(row.maHeThongRap, { maHeThongRap: row.maHeThongRap, tenHeThongRap: row.tenHeThongRap, logo: row.logo, lstCumRap: [] });
    const system = systems.get(row.maHeThongRap);
    let complex = system.lstCumRap.find(c => c.maCumRap === row.maCumRap);
    if (!complex) {
      complex = { maCumRap: row.maCumRap, tenCumRap: row.tenCumRap, diaChi: row.diaChi, hinhAnh: row.hinhAnh, lichChieuPhim: [] };
      system.lstCumRap.push(complex);
    }
    complex.lichChieuPhim.push(showtimeDto({ ...row, thoiLuong: movie.thoiLuong }));
  }
  return respond(res, { ...movieDto(movie), heThongRapChieu: [...systems.values()] });
}
