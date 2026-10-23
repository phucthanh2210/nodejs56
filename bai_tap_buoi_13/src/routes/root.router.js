const express = require("express");
const authRouter = require("./auth.router");
const imageRouter = require("./image.router");
const commentRouter = require("./comment.router");
const userRouter = require("./user.router");

const rootRouter = express.Router();

// Định tuyến API theo chuẩn RESTful tiếng Anh
rootRouter.use("/auth", authRouter);
rootRouter.use("/images", imageRouter);
rootRouter.use("/comments", commentRouter);
rootRouter.use("/users", userRouter);

// Hỗ trợ alias tiếng Việt theo đúng nguyên văn đề bài Cybersoft
rootRouter.use("/hinh-anh", imageRouter);
rootRouter.use("/binh-luan", commentRouter);
rootRouter.use("/nguoi-dung", userRouter);

module.exports = rootRouter;
