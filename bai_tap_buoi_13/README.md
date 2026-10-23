# BÀI TẬP BUỔI 13 - CYBERSOFT NODEJS: XÂY DỰNG RESTFUL API PINTEREST CLONE

Dự án Back End hoàn chỉnh cho ứng dụng chia sẻ hình ảnh Pinterest, xây dựng bằng **NodeJS (Express)**, **Prisma ORM**, **MySQL Docker**, **JWT**, **Bcrypt** và **Swagger UI**.

---

## 📁 1. Cấu Trúc Thư Mục Dự Án

```
bai_tap_buoi_13/
├── .env                          # File cấu hình kết nối MySQL Docker & JWT
├── .gitignore                    # Cấu hình bỏ qua node_modules và .env
├── README.md                     # Hướng dẫn chi tiết
├── baitap.sql                    # File tạo Database db_baitapbuoi13 & Dữ liệu mẫu
├── package.json                  # Quản lý thư viện dự án
├── prisma/
│   └── schema.prisma             # Định nghĩa các Model & Quan hệ ERD cho Prisma
├── public/                       # Giao diện Web Pinterest Front End
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
└── src/                          # Mã nguồn Back End API
    ├── config/
    │   ├── prisma.js             # Singleton Prisma Client
    │   └── response.js           # Chuẩn hóa cấu trúc phản hồi API (chuẩn Cybersoft)
    ├── controllers/
    │   ├── auth.controller.js    # Xử lý Đăng ký, Đăng nhập
    │   ├── image.controller.js   # Xử lý ảnh: Trang chủ, chi tiết, quản lý ảnh
    │   ├── comment.controller.js # Xử lý bình luận ảnh
    │   └── user.controller.js    # Xử lý thông tin người dùng
    ├── middlewares/
    │   └── auth.middleware.js    # Xác thực JWT Token
    ├── routes/
    │   ├── auth.router.js
    │   ├── image.router.js
    │   ├── comment.router.js
    │   ├── user.router.js
    │   └── root.router.js        # Tổng hợp định tuyến
    ├── docs/
    │   └── swagger.json          # Tài liệu API tương tác Swagger
    └── index.js                  # Entry point của ứng dụng
```

---

## 🗄️ 2. Mô Hình Cơ Sở Dữ Liệu (ERD)

Database: `db_baitapbuoi13`

1. **nguoi_dung** (User):
   - `nguoi_dung_id` (PK, INT, AUTO_INCREMENT)
   - `email` (VARCHAR, UNIQUE)
   - `mat_khau` (VARCHAR, Hash Bcrypt)
   - `ho_ten` (VARCHAR)
   - `tuoi` (INT)
   - `anh_dai_dien` (VARCHAR)
   - `ngay_tao` (DATETIME)

2. **hinh_anh** (Image):
   - `hinh_id` (PK, INT, AUTO_INCREMENT)
   - `ten_hinh` (VARCHAR)
   - `duong_dan` (VARCHAR)
   - `mo_ta` (TEXT)
   - `nguoi_dung_id` (FK -> nguoi_dung)
   - `ngay_tao` (DATETIME)

3. **binh_luan** (Comment):
   - `binh_luan_id` (PK, INT, AUTO_INCREMENT)
   - `nguoi_dung_id` (FK -> nguoi_dung)
   - `hinh_id` (FK -> hinh_anh)
   - `ngay_binh_luan` (DATETIME)
   - `noi_dung` (TEXT)

4. **luu_anh** (Saved Images):
   - `nguoi_dung_id` (PK, FK -> nguoi_dung)
   - `hinh_id` (PK, FK -> hinh_anh)
   - `ngay_luu` (DATETIME)

---

## 🚀 3. Hướng Dẫn Khởi Chạy

### Chạy ứng dụng:

```bash
# Khởi động server
npm run dev
```

- 🌐 **Giao diện Web Pinterest**: **[http://localhost:8080](http://localhost:8080)**
- 📖 **Swagger UI Documentation**: **[http://localhost:8080/api-docs](http://localhost:8080/api-docs)**

---

## 📋 4. Danh Sách Các API Theo Yêu Cầu Đề Bài

### A. Xác thực (Auth)

- **POST** `/api/auth/register` (alias `/api/auth/dang-ky`): Đăng ký tài khoản người dùng mới.
- **POST** `/api/auth/login` (alias `/api/auth/dang-nhap`): Đăng nhập, nhận JWT token.

### B. Trang chủ

- **GET** `/api/images` (alias `/api/hinh-anh`): Lấy danh sách ảnh (kèm thông tin người tạo ảnh).
- **GET** `/api/images/search?ten=...` (alias `/api/hinh-anh/tim-kiem?ten=...`): Tìm kiếm danh sách ảnh theo tên.

### C. Trang chi tiết

- **GET** `/api/images/:id` (alias `/api/hinh-anh/chi-tiet/:id`): Lấy thông tin chi tiết ảnh và người tạo ảnh bằng ID ảnh.
- **GET** `/api/comments/image/:imageId` (alias `/api/binh-luan/theo-hinh/:imageId`): Lấy thông tin các bình luận theo ID ảnh.
- **GET** `/api/images/check-saved/:id` (alias `/api/hinh-anh/da-luu/:id`): Kiểm tra xem người dùng hiện tại đã lưu ảnh này chưa theo ID ảnh (dùng cho trạng thái nút Save). _(Yêu cầu Bearer Token)_
- **POST** `/api/comments` (alias `/api/binh-luan`): Lưu bình luận của người dùng cho hình ảnh. _(Yêu cầu Bearer Token)_

### D. Trang quản lý ảnh

- **GET** `/api/users/profile` (alias `/api/nguoi-dung/thong-tin` / `/api/users/:id`): Lấy thông tin chi tiết của người dùng. _(Yêu cầu Bearer Token)_
- **GET** `/api/images/saved-by-user/:userId` (alias `/api/hinh-anh/da-luu-theo-user/:userId`): Lấy danh sách các hình ảnh đã lưu theo User ID.
- **GET** `/api/images/created-by-user/:userId` (alias `/api/hinh-anh/da-tao-theo-user/:userId`): Lấy danh sách các hình ảnh đã tạo theo User ID.
- **DELETE** `/api/images/:id` (alias `/api/hinh-anh/:id`): Xóa hình ảnh đã tạo theo ID ảnh (chỉ người tạo mới có quyền xóa). _(Yêu cầu Bearer Token)_

### E. Mở rộng

- **POST** `/api/images/save/:id` (alias `/api/hinh-anh/luu-anh/:id`): Toggle Lưu ảnh / Hủy lưu ảnh khi bấm nút Save.
- **POST** `/api/images` (alias `/api/hinh-anh/tao-anh`): Tạo mới hình ảnh.
- **PUT** `/api/users/profile`: Cập nhật thông tin cá nhân.
