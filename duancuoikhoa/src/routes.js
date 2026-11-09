import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate, admin } from './middleware/auth.js';
import { upload, uploadFile } from './middleware/upload.js';
import { query } from './db.js';
import { respond } from './lib/http.js';
import * as users from './services/users.js';
import * as movies from './services/movies.js';
import * as cinemas from './services/cinemas.js';
import * as bookings from './services/bookings.js';

const router = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, handler: (req, res) => res.status(429).json({ statusCode: 429, message: 'Thử lại sau 15 phút', content: null }) });
const user = Router();
user.get('/LayDanhSachLoaiNguoiDung', (req, res) => respond(res, [{ maLoaiNguoiDung: 'KhachHang', tenLoai: 'Khách hàng' }, { maLoaiNguoiDung: 'QuanTri', tenLoai: 'Quản trị' }]));
user.post('/DangKy', authLimit, users.register);
user.post('/DangNhap', authLimit, users.login);
for (const path of ['LayDanhSachNguoiDung', 'LayDanhSachNguoiDungPhanTrang', 'TimKiemNguoiDung', 'TimKiemNguoiDungPhanTrang']) user.get(`/${path}`, users.listUsers);
user.post('/ThongTinTaiKhoan', authenticate, users.accountInfo);
user.post('/LayThongTinNguoiDung', authenticate, users.accountInfo);
user.post('/ThemNguoiDung', authenticate, admin, users.addUser);
user.route('/CapNhatThongTinNguoiDung').put(authenticate, users.updateUser).post(authenticate, users.updateUser);
user.delete('/XoaNguoiDung', authenticate, admin, users.deleteUser);
router.use('/QuanLyNguoiDung', user);

const movie = Router();
movie.get('/LayDanhSachBanner', async (req, res) => respond(res, await query('SELECT * FROM banner ORDER BY maBanner')));
for (const path of ['LayDanhSachPhim', 'LayDanhSachPhimPhanTrang', 'LayDanhSachPhimTheoNgay']) movie.get(`/${path}`, movies.listMovies);
movie.get('/LayThongTinPhim', async (req, res) => respond(res, await movies.getMovie(req.query.MaPhim)));
movie.post('/ThemPhimUploadHinh', authenticate, admin, upload, movies.addMovie);
movie.post('/CapNhatPhimUpload', authenticate, admin, upload, movies.updateMovie);
movie.post('/', authenticate, admin, uploadFile, movies.uploadMovieImage);
movie.delete('/XoaPhim', authenticate, admin, movies.deleteMovie);
movie.delete('/XP', authenticate, admin, movies.deleteMovie);
router.use('/QuanLyPhim', movie);

const cinema = Router();
cinema.get('/LayThongTinHeThongRap', cinemas.systems);
cinema.get('/LayThongTinCumRapTheoHeThong', cinemas.complexes);
cinema.get('/LayThongTinLichChieuHeThongRap', cinemas.systemSchedules);
cinema.get('/LayThongTinLichChieuPhim', cinemas.movieSchedules);
router.use('/QuanLyRap', cinema);

const booking = Router();
booking.get('/LayDanhSachPhongVe', bookings.seating);
booking.post('/TaoLichChieu', authenticate, admin, bookings.createSchedule);
booking.post('/DatVe', authenticate, bookings.bookTickets);
router.use('/QuanLyDatVe', booking);

export default router;
