const express = require("express");
const {
  getCurrentUserProfile,
  getUserById,
  updateProfile,
} = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const userRouter = express.Router();

// [GET] Thông tin user hiện tại đang đăng nhập
userRouter.get("/profile", verifyToken, getCurrentUserProfile);
userRouter.get("/thong-tin", verifyToken, getCurrentUserProfile);

// [GET] Thông tin user theo ID
userRouter.get("/:id", getUserById);

// [PUT] Cập nhật thông tin user (Mở rộng)
userRouter.put("/profile", verifyToken, updateProfile);
userRouter.put("/cap-nhat", verifyToken, updateProfile);

module.exports = userRouter;
