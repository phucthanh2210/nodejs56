import { query, pool } from '../db.js';
import { HttpError, respond } from '../lib/http.js';
import { movieSchema, id, group, keyword, pagination, paginated, parseDate, slug } from '../lib/validation.js';
import { saveImage } from '../middleware/upload.js';

export function movieDto(movie) {
  return { ...movie, hot: Boolean(movie.hot), dangChieu: Boolean(movie.dangChieu), sapChieu: Boolean(movie.sapChieu) };
}

export async function getMovie(maPhim, connection = pool) {
  const [movie] = await query('SELECT * FROM phim WHERE maPhim=?', [id.parse(maPhim)], connection);
  if (!movie) throw new HttpError(404, 'Không tìm thấy phim');
  return movieDto(movie);
}

export async function listMovies(req, res) {
  const params = [group.parse(req.query.maNhom), `%${keyword(req.query.tenPhim)}%`];
  let where = 'WHERE maNhom=? AND tenPhim LIKE ?';
  if (req.path.endsWith('TheoNgay')) {
    const from = req.query.tuNgay ? parseDate(req.query.tuNgay, true) : null;
    const to = req.query.denNgay ? parseDate(req.query.denNgay, true) : null;
    if (from && to && from > to) throw new HttpError(400, 'tuNgay phải trước denNgay');
    if (from) { where += ' AND ngayKhoiChieu>=?'; params.push(from); }
    if (to) { where += ' AND ngayKhoiChieu<=?'; params.push(to); }
  }
  if (req.path.endsWith('/LayDanhSachPhim')) return respond(res, (await query(`SELECT * FROM phim ${where} ORDER BY maPhim`, params)).map(movieDto));
  const page = pagination(req.query);
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM phim ${where}`, params);
  const movies = await query(`SELECT * FROM phim ${where} ORDER BY maPhim LIMIT ${page.soPhanTuTrenTrang} OFFSET ${(page.soTrang - 1) * page.soPhanTuTrenTrang}`, params);
  return respond(res, paginated(movies.map(movieDto), total, page));
}

export async function addMovie(req, res) {
  const data = movieSchema.parse(req.body);
  const image = await saveImage(req.file);
  const fields = { ...data, biDanh: slug(data.tenPhim), hinhAnh: image || '' };
  const keys = Object.keys(fields);
  const result = await query(`INSERT INTO phim (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(fields));
  return respond(res, await getMovie(result.insertId), 201);
}

export async function updateMovie(req, res) {
  const { maPhim: rawId, ...body } = req.body || {};
  const maPhim = id.parse(rawId);
  const data = movieSchema.partial().parse(body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [movie] = await query('SELECT maPhim,thoiLuong FROM phim WHERE maPhim=? FOR UPDATE', [maPhim], connection);
    if (!movie) throw new HttpError(404, 'Không tìm thấy phim');
    if (data.thoiLuong !== undefined && data.thoiLuong !== movie.thoiLuong) {
      // Share the movie lock with schedule creation so a new schedule cannot race this check.
      const schedules = await query('SELECT maLichChieu FROM lich_chieu WHERE maPhim=? LIMIT 1 FOR UPDATE', [maPhim], connection);
      if (schedules.length) throw new HttpError(409, 'Không thay đổi thời lượng phim đã có lịch chiếu');
    }
    const image = await saveImage(req.file);
    if (data.tenPhim) data.biDanh = slug(data.tenPhim);
    if (image) data.hinhAnh = image;
    const keys = Object.keys(data);
    if (!keys.length) throw new HttpError(400, 'Cần dữ liệu cập nhật');
    await query(`UPDATE phim SET ${keys.map(key => `${key}=?`).join(',')} WHERE maPhim=?`, [...Object.values(data), maPhim], connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return respond(res, await getMovie(maPhim));
}

export async function deleteMovie(req, res) {
  const maPhim = id.parse(req.query.MaPhim);
  await getMovie(maPhim);
  await query('DELETE FROM phim WHERE maPhim=?', [maPhim]);
  return respond(res, 'Xóa phim thành công');
}

export async function uploadMovieImage(req, res) {
  const tenPhim = keyword(req.query.tenPhim);
  const maNhom = group.parse(req.query.maNhom);
  if (!tenPhim) throw new HttpError(400, 'Thiếu tenPhim');
  const rows = await query('SELECT maPhim FROM phim WHERE tenPhim=? AND maNhom=?', [tenPhim, maNhom]);
  if (!rows.length) throw new HttpError(404, 'Không tìm thấy phim');
  if (rows.length > 1) throw new HttpError(409, 'Tên phim trùng; dùng CapNhatPhimUpload với maPhim');
  const image = await saveImage(req.file);
  if (!image) throw new HttpError(400, 'Thiếu file ảnh');
  await query('UPDATE phim SET hinhAnh=? WHERE maPhim=?', [image, rows[0].maPhim]);
  return respond(res, await getMovie(rows[0].maPhim));
}
