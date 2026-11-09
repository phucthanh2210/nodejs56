import { ZodError } from 'zod';
import multer from 'multer';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function respond(res, content, status = 200) {
  return res.status(status).json({ statusCode: status, message: 'Thành công', content, dateTime: new Date().toISOString() });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message = error.message;
  if (error instanceof ZodError) {
    status = 400;
    message = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  } else if (error instanceof multer.MulterError) {
    status = 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh tối đa 5 MB' : 'File tải lên không hợp lệ';
  } else if (error.code === 'ER_DUP_ENTRY' || error.code === 'P2002' || (error.code === 'P2010' && error.meta?.code === '1062')) {
    status = 409;
    message = 'Dữ liệu đã tồn tại';
  } else if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2', 'P2003'].includes(error.code) || (error.code === 'P2010' && ['1451', '1452'].includes(error.meta?.code))) {
    status = 409;
    message = 'Dữ liệu đang được sử dụng hoặc tham chiếu không tồn tại';
  } else if (error.code === 'P2025') {
    status = 404;
    message = 'Không tìm thấy dữ liệu';
  } else if (error.code === 'P2034') {
    status = 409;
    message = 'Dữ liệu vừa thay đổi bởi yêu cầu khác, vui lòng thử lại';
  }
  if (status >= 500) {
    console.error(error);
    message = 'Lỗi máy chủ';
  }
  return res.status(status).json({ statusCode: status, message, content: null, dateTime: new Date().toISOString() });
}
