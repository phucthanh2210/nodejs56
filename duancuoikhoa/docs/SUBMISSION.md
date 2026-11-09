# Checklist nộp dự án Movie

Theo PDF, bài nộp gồm source GitHub, API đã deploy, tài liệu API và link YouTube demo. Source và tài liệu được chuẩn bị trong repo. Link hosting và YouTube cần được bổ sung sau khi triển khai và quay video.

| Hạng mục | Kết quả |
| --- | --- |
| Source | Branch `duancuoikhoa` của https://github.com/phucthanh2210/nodejs56 |
| Swagger | `/swagger` trên server, đặc tả trong [swagger.json](./swagger.json) |
| Postman | [movie.postman_collection.json](./movie.postman_collection.json) |
| SQL | [db_duancuoikhoa.sql](../db_duancuoikhoa.sql) |
| Prisma | [Schema](../prisma/schema.prisma), [migration](../prisma/migrations/0_init/migration.sql), [seed](../prisma/seed.js), [hướng dẫn chạy lại database](./PRISMA.md) |
| API deploy | Cần địa chỉ MySQL truy cập từ hosting và tài khoản hosting |
| Video YouTube | Học viên quay demo và bổ sung link |

## Công việc đã chia theo chức năng

- [x] Phân tích yêu cầu và thiết kế cơ sở dữ liệu.
- [x] Người dùng, xác thực JWT, hash mật khẩu và phân quyền.
- [x] Phim, tìm kiếm/phân trang, upload hình, banner.
- [x] Hệ thống rạp, cụm rạp, phòng và lịch chiếu.
- [x] Đặt vé, sơ đồ ghế, lịch sử và xử lý tranh chấp ghế.
- [x] Swagger, Postman, hướng dẫn khởi chạy và kiểm thử.
- [ ] Deploy API lên hosting với MySQL có thể truy cập từ hosting.
- [ ] Quay demo và nộp link YouTube.

## Kịch bản demo khoảng 5–8 phút

1. Giới thiệu mục tiêu, sơ đồ quan hệ trong README và cấu trúc thư mục.
2. Mở Swagger và kiểm tra `/health`.
3. Đăng ký khách hàng, đăng nhập lấy token, xem danh sách/phân trang phim.
4. Đăng nhập quản trị, thêm phim kèm hình và cập nhật thông tin phim.
5. Đọc hệ thống/cụm rạp, tạo lịch chiếu tương lai, thử lịch bị trùng để thấy lỗi 409.
6. Đăng nhập khách hàng, xem ghế, đặt vé, xem lịch sử. Thử đặt lại ghế để thấy lỗi 409.
7. Cho thấy khách hàng không có quyền tạo phim/lịch chiếu (403).
8. Chạy `npm test`, giới thiệu source GitHub, Swagger/Postman và địa chỉ API deploy.

Không quay hoặc đưa mật khẩu database, JWT secret hay token thật vào video.
