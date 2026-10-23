const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { successCode, failCode, errorCode } = require("../config/response");

/**
 * [POST] /api/auth/register hoặc /api/auth/dang-ky
 * Đăng ký tài khoản người dùng mới
 */
const register = async (req, res) => {
  try {
    const { email, mat_khau, ho_ten, tuoi, anh_dai_dien } = req.body;

    // Validate đầu vào
    if (!email || !mat_khau || !ho_ten) {
      return failCode(res, null, "Vui lòng nhập đầy đủ email, mật khẩu và họ tên!", 400);
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return failCode(res, null, "Email không đúng định dạng!", 400);
    }

    // Kiểm tra email đã tồn tại hay chưa
    const checkUser = await prisma.nguoiDung.findUnique({
      where: { email },
    });

    if (checkUser) {
      return failCode(res, null, "Email này đã được đăng ký, vui lòng chọn email khác!", 400);
    }

    // Hash mật khẩu
    const hashedPassword = bcrypt.hashSync(mat_khau, 10);

    // Tạo người dùng mới
    const newUser = await prisma.nguoiDung.create({
      data: {
        email,
        mat_khau: hashedPassword,
        ho_ten,
        tuoi: tuoi ? parseInt(tuoi) : 18,
        anh_dai_dien: anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      },
    });

    // Bỏ trường mật khẩu trước khi trả về
    const { mat_khau: _, ...userData } = newUser;

    return successCode(res, userData, "Đăng ký tài khoản thành công!", 201);
  } catch (error) {
    console.error("Lỗi register:", error);
    return errorCode(res, "Lỗi trong quá trình đăng ký tài khoản");
  }
};

/**
 * [POST] /api/auth/login hoặc /api/auth/dang-nhap
 * Đăng nhập tài khoản & cấp phát JWT token
 */
const login = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;

    if (!email || !mat_khau) {
      return failCode(res, null, "Vui lòng nhập email và mật khẩu!", 400);
    }

    // Tìm người dùng theo email
    const user = await prisma.nguoiDung.findUnique({
      where: { email },
    });

    if (!user) {
      return failCode(res, null, "Email hoặc mật khẩu không chính xác!", 400);
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = bcrypt.compareSync(mat_khau, user.mat_khau);
    if (!isPasswordValid) {
      return failCode(res, null, "Email hoặc mật khẩu không chính xác!", 400);
    }

    // Tạo JWT Token
    const payload = {
      nguoi_dung_id: user.nguoi_dung_id,
      email: user.email,
      ho_ten: user.ho_ten,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "CYBERSOFT_PINTEREST_SECRET_KEY_2026", {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const { mat_khau: _, ...userData } = user;

    return successCode(
      res,
      {
        user: userData,
        token,
      },
      "Đăng nhập thành công!"
    );
  } catch (error) {
    console.error("Lỗi login:", error);
    return errorCode(res, "Lỗi trong quá trình đăng nhập");
  }
};

module.exports = {
  register,
  login,
};
