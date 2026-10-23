const express = require("express");
const { register, login } = require("../controllers/auth.controller");

const authRouter = express.Router();

// [POST] Trang đăng ký
authRouter.post("/register", register);
authRouter.post("/dang-ky", register);

// [POST] Trang đăng nhập
authRouter.post("/login", login);
authRouter.post("/dang-nhap", login);

module.exports = authRouter;
