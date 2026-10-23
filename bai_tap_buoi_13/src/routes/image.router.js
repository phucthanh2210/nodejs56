const express = require("express");
const {
  getImages,
  searchImages,
  getImageDetail,
  checkImageSaved,
  toggleSaveImage,
  getSavedImagesByUserId,
  getCreatedImagesByUserId,
  deleteImage,
  createImage,
} = require("../controllers/image.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const imageRouter = express.Router();

// ----------------------------------------------------
// 1. TRANG CHỦ
// ----------------------------------------------------
// GET danh sách ảnh về
imageRouter.get("/", getImages);

// GET tìm kiếm danh sách ảnh theo tên
imageRouter.get("/search", searchImages);
imageRouter.get("/tim-kiem", searchImages);

// ----------------------------------------------------
// 2. TRANG CHI TIẾT
// ----------------------------------------------------
// GET kiểm tra ảnh đã lưu chưa theo id ảnh (Nút Save) - Cần login
imageRouter.get("/check-saved/:id", verifyToken, checkImageSaved);
imageRouter.get("/da-luu/:id", verifyToken, checkImageSaved);

// GET thông tin ảnh và người tạo ảnh bằng id ảnh
imageRouter.get("/detail/:id", getImageDetail);
imageRouter.get("/chi-tiet/:id", getImageDetail);
imageRouter.get("/:id", getImageDetail);

// POST lưu hoặc bỏ lưu ảnh (Toggle Save/Unsave) - Mở rộng
imageRouter.post("/save/:id", verifyToken, toggleSaveImage);
imageRouter.post("/luu-anh/:id", verifyToken, toggleSaveImage);

// ----------------------------------------------------
// 3. TRANG QUẢN LÝ ẢNH
// ----------------------------------------------------
// GET danh sách ảnh đã lưu theo user id
imageRouter.get("/saved-by-user/:userId", getSavedImagesByUserId);
imageRouter.get("/da-luu-theo-user/:userId", getSavedImagesByUserId);

// GET danh sách ảnh đã tạo theo user id
imageRouter.get("/created-by-user/:userId", getCreatedImagesByUserId);
imageRouter.get("/da-tao-theo-user/:userId", getCreatedImagesByUserId);

// DELETE xóa ảnh đã tạo theo id ảnh - Cần login (chỉ người tạo mới được xóa)
imageRouter.delete("/:id", verifyToken, deleteImage);
imageRouter.delete("/xoa-anh/:id", verifyToken, deleteImage);

// ----------------------------------------------------
// 4. MỞ RỘNG (TẠO / THÊM ẢNH MỚI)
// ----------------------------------------------------
imageRouter.post("/", verifyToken, createImage);
imageRouter.post("/tao-anh", verifyToken, createImage);

module.exports = imageRouter;
