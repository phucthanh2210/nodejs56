# Movie API

REST API quản lý phim, rạp chiếu, lịch chiếu và đặt vé. Sử dụng Node.js, ExpressJS, Prisma và MySQL.

## Cài đặt

Yêu cầu Node.js >= 22 và MySQL >= 8.0.16.

1. Sao chép `.env.example` thành `.env`.
2. Cấu hình kết nối MySQL, `JWT_SECRET`, `ADMIN_EMAIL` và `ADMIN_PASSWORD`.
3. Chạy các lệnh trong thư mục dự án:

```bash
npm ci
npm run db:init
npm start
```

`npm ci` tự tạo Prisma Client. `db:init` áp dụng migration và thêm dữ liệu ban đầu: tài khoản `admin`, 2 phim, 2 hệ thống rạp, 2 cụm rạp, 3 phòng, 240 ghế và 2 lịch chiếu sau 7 ngày. Mật khẩu admin lấy từ `ADMIN_PASSWORD` khi tài khoản được tạo lần đầu. Chạy lại lệnh không ghi đè dữ liệu đã tồn tại.

| Biến môi trường | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng API, mặc định `3000` |
| `DB_HOST`, `DB_PORT` | Địa chỉ và cổng MySQL |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Tài khoản, mật khẩu và tên database |
| `DATABASE_URL` | URL MySQL, nếu có sẽ thay thế cấu hình kết nối `DB_*` |
| `JWT_SECRET` | Khóa ký token, ít nhất 32 ký tự |
| `JWT_EXPIRES_IN` | Thời hạn token, mặc định `1d` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Thông tin tạo admin; mật khẩu dài 12–72 ký tự |

Không đưa `.env` lên Git. Dùng `npm run dev` để tự khởi động lại khi thay đổi code.

## API

- Swagger: http://localhost:3000/swagger
- Kiểm tra kết nối: http://localhost:3000/health
- Đặc tả: [docs/swagger.json](./docs/swagger.json)
- Postman: [docs/movie.postman_collection.json](./docs/movie.postman_collection.json)

| Nhóm | Chức năng |
| --- | --- |
| `QuanLyNguoiDung` | Đăng ký, đăng nhập, quản lý tài khoản, tìm kiếm và lịch sử đặt vé |
| `QuanLyPhim` | Quản lý phim, banner, tìm kiếm, phân trang và upload ảnh |
| `QuanLyRap` | Hệ thống rạp, cụm rạp và lịch chiếu theo phim/hệ thống |
| `QuanLyDatVe` | Tạo lịch chiếu, sơ đồ ghế và đặt vé |

Đăng nhập qua `POST /api/QuanLyNguoiDung/DangNhap` với `taiKhoan`, `matKhau`. Các API bảo vệ nhận header `Authorization: Bearer <accessToken>`. Trên Swagger, nhập đầy đủ giá trị này vào Authorize. Collection Postman tự lưu token sau khi đăng nhập; đổi biến `baseUrl` để gọi server khác.

Tài khoản đăng ký có quyền `KhachHang`. Quyền `QuanTri` được dùng để quản lý phim, tạo lịch chiếu và thêm/xóa người dùng. Chủ tài khoản hoặc quản trị viên được xem lịch sử và cập nhật thông tin tài khoản.

Response có cấu trúc `{ statusCode, message, content, dateTime }`. Phân trang trả `currentPage`, `count`, `totalPages`, `totalCount`, `items`.

## Quy tắc dữ liệu

- Tài khoản gồm 3–50 ký tự chữ, số hoặc `_`; mật khẩu người dùng dài 8–72 ký tự.
- Nhóm có dạng `GP01`; phân trang bắt đầu từ 1 và tối đa 100 phần tử mỗi trang.
- Ngày nhận `dd/MM/yyyy` hoặc ISO. Giờ không có offset được hiểu theo UTC+7; lịch chiếu lưu ở UTC.
- Ảnh PNG/JPEG/WebP tối đa 5 MB. Thêm/cập nhật phim dùng multipart field `File`; endpoint upload riêng dùng `file`.
- Giá vé tính bằng VND, lấy từ lịch chiếu. Một lượt đặt tối đa 10 ghế; tất cả ghế phải thuộc đúng phòng và chưa được đặt.
- Lịch chiếu phải ở tương lai và không giao nhau trong cùng phòng.
- Transaction và khóa `(maLichChieu, maGhe)` ngăn đặt trùng ghế. Một lượt đặt thất bại sẽ rollback toàn bộ.

## Database

Schema nằm trong [prisma/schema.prisma](./prisma/schema.prisma), migration trong [prisma/migrations/](./prisma/migrations/) và dữ liệu khởi tạo trong [prisma/seed.js](./prisma/seed.js).

| Lệnh | Chức năng |
| --- | --- |
| `npm run db:init` | Khởi tạo database, áp dụng migration và seed |
| `npm run prisma:pull` | Đọc cấu trúc database vào Prisma schema |
| `npm run prisma:generate` | Tạo Prisma Client |
| `npm run prisma:validate` | Kiểm tra schema |
| `npm run prisma:deploy` | Áp dụng migration |
| `npm run prisma:status` | Kiểm tra trạng thái migration |
| `npm run prisma:seed` | Thêm dữ liệu ban đầu |
| `npm run prisma:studio` | Mở giao diện dữ liệu |

API truy cập database qua Prisma Client. Các truy vấn JOIN và `FOR UPDATE` dùng SQL có bind parameter. CHECK constraint được khai báo trong SQL migration. Tài khoản MySQL cần quyền DDL/DML và quyền tạo database nếu database chưa tồn tại.

## Kiểm thử

```bash
npm test
```

Kiểm thử sử dụng database tạm riêng và tự dọn sau khi chạy. Bao gồm xác thực, phân quyền, CRUD, upload, migration và xử lý đặt ghế/lịch chiếu đồng thời. Chạy `npm run docs:build` để tạo lại collection Postman từ Swagger khi cập nhật đặc tả.

## Triển khai

- Thư mục chạy: `duancuoikhoa` nếu deploy từ repo chứa thư mục này.
- Build: `npm ci --omit=dev`.
- Khởi tạo database: `npm run db:init`.
- Start: `npm start`.
- Healthcheck: `/health`.

Cấu hình biến môi trường trên hosting và dùng MySQL truy cập được từ server. Gắn persistent volume vào thư mục `uploads` để giữ ảnh qua các lần deploy. Có thể dùng [render.yaml](./render.yaml) để cấu hình service trên Render.
