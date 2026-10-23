const prisma = require("../config/prisma");
const { successCode, failCode, errorCode } = require("../config/response");

/**
 * [GET] /api/comments/image/:imageId hoặc /api/binh-luan/theo-hinh/:hinh_id
 * Trang chi tiết: GET thông tin bình luận theo id ảnh
 */
const getCommentsByImageId = async (req, res) => {
  try {
    const { imageId, hinh_id } = req.params;
    const targetImageId = parseInt(imageId || hinh_id);

    if (isNaN(targetImageId)) {
      return failCode(res, null, "ID hình ảnh không hợp lệ!", 400);
    }

    const comments = await prisma.binhLuan.findMany({
      where: { hinh_id: targetImageId },
      include: {
        nguoi_dung: {
          select: {
            nguoi_dung_id: true,
            ho_ten: true,
            email: true,
            anh_dai_dien: true,
          },
        },
      },
      orderBy: {
        ngay_binh_luan: "desc",
      },
    });

    return successCode(res, comments, "Lấy danh sách bình luận thành công!");
  } catch (error) {
    console.error("Lỗi getCommentsByImageId:", error);
    return errorCode(res, "Lỗi khi lấy thông tin bình luận");
  }
};

/**
 * [POST] /api/comments hoặc /api/binh-luan
 * Trang chi tiết: POST để lưu thông tin bình luận của người dùng với hình ảnh
 */
const createComment = async (req, res) => {
  try {
    const userId = req.user.nguoi_dung_id;
    const { hinh_id, image_id, noi_dung } = req.body;
    const targetImageId = parseInt(hinh_id || image_id);

    if (isNaN(targetImageId) || !noi_dung || !noi_dung.trim()) {
      return failCode(res, null, "Vui lòng nhập ID ảnh và nội dung bình luận!", 400);
    }

    // Kiểm tra ảnh có tồn tại hay không
    const checkImage = await prisma.hinhAnh.findUnique({
      where: { hinh_id: targetImageId },
    });

    if (!checkImage) {
      return failCode(res, null, "Hình ảnh được bình luận không tồn tại!", 404);
    }

    const newComment = await prisma.binhLuan.create({
      data: {
        nguoi_dung_id: userId,
        hinh_id: targetImageId,
        noi_dung: noi_dung.trim(),
      },
      include: {
        nguoi_dung: {
          select: {
            nguoi_dung_id: true,
            ho_ten: true,
            email: true,
            anh_dai_dien: true,
          },
        },
      },
    });

    return successCode(res, newComment, "Đăng bình luận thành công!", 201);
  } catch (error) {
    console.error("Lỗi createComment:", error);
    return errorCode(res, "Lỗi khi lưu bình luận của người dùng");
  }
};

module.exports = {
  getCommentsByImageId,
  createComment,
};
