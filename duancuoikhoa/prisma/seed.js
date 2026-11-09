import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pathToFileURL } from 'node:url';
import { prisma } from '../src/db.js';

export async function seedDatabase() {
  const email = z.email().parse(process.env.ADMIN_EMAIL);
  const password = z.string().min(12).max(72).parse(process.env.ADMIN_PASSWORD);
  const admin = await prisma.nguoi_dung.findUnique({ where: { taiKhoan: 'admin' } });
  if (!admin) await prisma.nguoi_dung.create({ data: { taiKhoan: 'admin', matKhau: await bcrypt.hash(password, 12), email, soDt: '0900000000', hoTen: 'Quản trị viên', maLoaiNguoiDung: 'QuanTri' } });
  await prisma.he_thong_rap.createMany({ skipDuplicates: true, data: [
    { maHeThongRap: 'BHDStar', tenHeThongRap: 'BHD Star Cineplex', biDanh: 'bhd-star-cineplex' },
    { maHeThongRap: 'CGV', tenHeThongRap: 'CGV Cinemas', biDanh: 'cgv-cinemas' },
  ] });
  await prisma.cum_rap.createMany({ skipDuplicates: true, data: [
    { maCumRap: 'bhd-star-bitexco', maHeThongRap: 'BHDStar', tenCumRap: 'BHD Star Bitexco', diaChi: '2 Hải Triều, Quận 1, TP. Hồ Chí Minh' },
    { maCumRap: 'cgv-vincom-dong-khoi', maHeThongRap: 'CGV', tenCumRap: 'CGV Vincom Đồng Khởi', diaChi: '72 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh' },
  ] });
  await prisma.rap.createMany({ skipDuplicates: true, data: [
    { maRap: 1, maCumRap: 'bhd-star-bitexco', tenRap: 'Rạp 1' },
    { maRap: 2, maCumRap: 'bhd-star-bitexco', tenRap: 'Rạp 2' },
    { maRap: 3, maCumRap: 'cgv-vincom-dong-khoi', tenRap: 'Rạp 1' },
  ] });
  const release = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  await prisma.phim.createMany({ skipDuplicates: true, data: [
    { maPhim: 1, tenPhim: 'Hành trình vũ trụ', biDanh: 'hanh-trinh-vu-tru', moTa: 'Phim mẫu phục vụ demo đặt vé.', ngayKhoiChieu: release, danhGia: 8, hot: true, thoiLuong: 120 },
    { maPhim: 2, tenPhim: 'Thành phố ánh sáng', biDanh: 'thanh-pho-anh-sang', moTa: 'Phim mẫu phục vụ demo quản lý lịch chiếu.', ngayKhoiChieu: release, danhGia: 7, thoiLuong: 100 },
  ] });
  await prisma.banner.createMany({ skipDuplicates: true, data: [{ maBanner: 1, maPhim: 1, hinhAnh: '/assets/movie-banner.svg' }] });
  for (const maRap of [1, 2, 3]) {
    await prisma.ghe.createMany({ skipDuplicates: true, data: Array.from({ length: 80 }, (_, index) => ({
      maRap, tenGhe: `${String.fromCharCode(65 + Math.floor(index / 10))}${String(index % 10 + 1).padStart(2, '0')}`,
      loaiGhe: index >= 30 && index < 60 ? 'Vip' : 'Thuong', stt: index + 1,
    })) });
  }
  if (!await prisma.lich_chieu.count()) {
    const start = new Date(Math.floor((Date.now() + 7 * 86400000) / 1000) * 1000);
    await prisma.lich_chieu.createMany({ data: [
      { maPhim: 1, maRap: 1, ngayChieuGioChieu: start, ketThuc: new Date(start.getTime() + 120 * 60000), giaVe: 75000 },
      { maPhim: 2, maRap: 3, ngayChieuGioChieu: start, ketThuc: new Date(start.getTime() + 100 * 60000), giaVe: 90000 },
    ] });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase().then(() => console.log('Đã seed dữ liệu bằng Prisma.')).catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
