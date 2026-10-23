const express = require("express");
const {
  getCommentsByImageId,
  createComment,
} = require("../controllers/comment.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const commentRouter = express.Router();

// [GET] Thông tin bình luận theo id ảnh
commentRouter.get("/image/:imageId", getCommentsByImageId);
commentRouter.get("/theo-hinh/:imageId", getCommentsByImageId);

// [POST] Lưu thông tin bình luận của người dùng với hình ảnh (Cần đăng nhập)
commentRouter.post("/", verifyToken, createComment);

module.exports = commentRouter;
