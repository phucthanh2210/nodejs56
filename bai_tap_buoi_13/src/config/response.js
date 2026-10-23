/**
 * Chuẩn hóa cấu trúc phản hồi API (Response format chuẩn Cybersoft)
 */

const successCode = (res, data, message = "Xử lý thành công", statusCode = 200) => {
  return res.status(statusCode).json({
    statusCode,
    message,
    content: data,
    dateTime: new Date().toISOString(),
  });
};

const failCode = (res, data = null, message = "Yêu cầu không hợp lệ", statusCode = 400) => {
  return res.status(statusCode).json({
    statusCode,
    message,
    content: data,
    dateTime: new Date().toISOString(),
  });
};

const errorCode = (res, message = "Lỗi máy chủ nội bộ (Internal Server Error)") => {
  return res.status(500).json({
    statusCode: 500,
    message,
    content: null,
    dateTime: new Date().toISOString(),
  });
};

module.exports = {
  successCode,
  failCode,
  errorCode,
};
