const jwt = require("jsonwebtoken");
const { failCode } = require("../config/response");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.token;
    if (!authHeader) {
      return failCode(res, null, "Vui lòng cung cấp token xác thực (Authorization header)", 401);
    }

    // Token format: "Bearer <token>" hoặc "<token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CYBERSOFT_PINTEREST_SECRET_KEY_2026");
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return failCode(res, null, "Token đã hết hạn, vui lòng đăng nhập lại", 401);
    }
    return failCode(res, null, "Token không hợp lệ", 401);
  }
};

module.exports = {
  verifyToken,
};
