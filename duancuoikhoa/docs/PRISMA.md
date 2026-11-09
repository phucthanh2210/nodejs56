# Prisma — chạy lại database và bàn giao cho giảng viên

Project dùng ExpressJS + Prisma Client + MySQL. Prisma CLI và Client cùng phiên bản 6.19.3 trong lockfile; dùng `npm ci` để cài đúng phiên bản. Các endpoint và cách gọi Postman giữ nguyên.

## Chạy trên máy hiện tại

Không phải thay `.env` nếu `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` đang kết nối được MySQL. Bật MySQL, mở Git Bash trong thư mục dự án và chạy:

```bash
npm.cmd ci
npm.cmd run db:init
npm.cmd start
```

`npm ci` tự generate Client. Nếu API đang chạy ở terminal khác, dừng bằng Ctrl+C rồi khởi động lại để dùng bản mới. Mở http://localhost:3000/swagger.

## Giảng viên tải source và tạo database riêng

1. Clone repo, chọn branch `duancuoikhoa` và vào thư mục con `duancuoikhoa`.
2. Bật MySQL >= 8.0.16. Tạo `.env` từ [.env.example](../.env.example), sửa thông tin kết nối và các biến JWT/admin. Không dùng mật khẩu hoặc JWT secret placeholder.
3. Chạy `npm ci`, `npm run db:init`, `npm start`.

Source có đầy đủ [schema](../prisma/schema.prisma), [migration](../prisma/migrations/0_init/migration.sql) và [seed](../prisma/seed.js). Không cần database online của học viên để tạo database demo riêng. Seed không sao chép các tài khoản/vé đã phát sinh trên máy học viên.

Database rỗng được tạo bảng bằng migration rồi seed dữ liệu mẫu. Database đã có từ SQL bản cũ được kiểm tra đủ 9 bảng và so sánh cấu trúc với schema trước khi đánh dấu migration `0_init` là đã áp dụng. Nếu khác cấu trúc, script dừng; không reset hay tự xóa bảng. Chạy lại giữ mật khẩu admin, vé, phim và lịch chiếu cũ. Nếu có database khác cùng tên, chọn tên mới trong `.env` thay vì xóa dữ liệu đó.

`db:init` chỉ cần quyền CREATE DATABASE nếu database chưa tồn tại; database đã tạo trước cần quyền đọc metadata, DDL/DML và tạo bảng `_prisma_migrations`.

## Pull có nghĩa là gì?

```bash
npm.cmd run prisma:pull
npm.cmd run prisma:generate
```

Lệnh pull chạy `prisma db pull`: đọc cấu trúc MySQL đang được cấu hình, cập nhật file schema trong source. Nó không tải toàn bộ dữ liệu hoặc tạo một database bản sao trên máy. Sau pull, generate lại Client nếu muốn dùng cấu trúc mới. Pull là thao tác cập nhật file schema; kiểm tra Git diff trước khi commit.

Muốn giảng viên kết nối database online, cần cung cấp riêng endpoint MySQL truy cập được từ máy giảng viên và thông tin kết nối. Private hostname của hosting thường chỉ hoạt động giữa các service cùng project. API online hoạt động không đồng nghĩa với MySQL có thể được kết nối từ bên ngoài. Không đưa mật khẩu database lên GitHub.

## URL kết nối

[prisma.config.ts](../prisma.config.ts) đọc `.env` thông qua [database-url.js](../src/database-url.js). Nếu không có `DATABASE_URL`, URL được tạo từ 5 biến `DB_*` như trước. Nếu có `DATABASE_URL`, cả API, bootstrap và Prisma CLI dùng URL đó, bỏ qua 5 biến kết nối `DB_*`.

Ví dụ cú pháp (thay các giá trị placeholder):

```env
DATABASE_URL=mysql://USER:URL_ENCODED_PASSWORD@HOST:3306/DATABASE
```

User/password có ký tự đặc biệt phải URL-encode. `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` vẫn cấu hình riêng; `ADMIN_PASSWORD` chỉ có tác dụng khi seed tạo tài khoản admin lần đầu.

## Migration, seed và dữ liệu

- `prisma:deploy` chạy migration đã lưu để tạo/cập nhật cấu trúc, không chạy seed.
- `prisma:seed` thêm dữ liệu demo, không ghi đè dữ liệu đã tồn tại.
- `db:init` là lệnh thuận tiện cho cả database mới và bản SQL cũ: kiểm tra/baseline, deploy, seed.
- `prisma:status` kiểm tra lịch sử; `prisma:studio` mở giao diện dữ liệu như một lựa chọn thay TablePlus.
- CHECK constraint được giữ trong SQL migration. `db pull` có thể cảnh báo về CHECK vì Prisma chưa biểu diễn đầy đủ trong model; không xóa constraint để bỏ cảnh báo.
- Không dùng lệnh reset để chuyển database hiện tại sang Prisma.

## Deploy

Các biến `DB_*` trên hosting giữ nguyên. Hoặc chỉ dùng `DATABASE_URL` cho kết nối, nếu hosting cung cấp URL MySQL phù hợp.

Railway: Root Directory `/duancuoikhoa`; build `npm ci --omit=dev`; pre-deploy `npm run db:init`; start `npm start`; healthcheck `/health`. CLI Prisma được cài trong dependencies để pre-deploy có thể chạy. Với Render, chạy `db:init` một lần trong môi trường truy cập được database trước khi demo. Prisma Client được generate trong `postinstall` khi build; quá trình generate không cần MySQL đang chạy.

Nếu cấu hình không đổi nhưng API cũ còn đang chạy local, khởi động lại API sau khi cài dependency để sử dụng Prisma. Không cần thay collection Postman. Database online và local có thể chứa dữ liệu khác nhau.

## Kiểm chứng

```bash
npm.cmd run prisma:validate
npm.cmd run prisma:status
npm.cmd test
```

Kiểm thử dùng database tạm riêng kể cả khi `.env` có `DATABASE_URL`. Kiểm tra tạo schema mới, baseline giữ dữ liệu/mật khẩu/vé, CRUD, quyền và tranh chấp ghế/lịch chiếu qua Prisma. Database tạm được dọn sau test.
