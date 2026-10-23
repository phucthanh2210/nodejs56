const prisma = require("../config/prisma");
const { successCode, failCode, errorCode } = require("../config/response");

/**
 * [GET] /api/users/profile hoặc /api/nguoi-dung/thong-tin
 * Trang quản lý ảnh: GET thông tin user hiện tại đang đăng nhập
 */
const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.nguoi_dung_id;

    const user = await prisma.nguoiDung.findUnique({
      where: { nguoi_dung_id: userId },
      select: {
        nguoi_dung_id: true,
        email: true,
        ho_ten: true,
        tuoi: true,
        anh_dai_dien: true,
        ngay_tao: true,
      },
    });

    if (!user) {
      return failCode(res, null, "Không tìm thấy thông tin người dùng!", 404);
    }

    return successCode(res, user, "Lấy thông tin người dùng thành công!");
  } catch (error) {
    console.error("Lỗi getCurrentUserProfile:", error);
    return errorCode(res, "Lỗi khi lấy thông tin người dùng");
  }
};

/**
 * [GET] /api/users/:id hoặc /api/nguoi-dung/:id
 * Lấy thông tin người dùng theo ID cụ thể
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return failCode(res, null, "ID người dùng không hợp lệ!", 400);
    }

    const user = await prisma.nguoiDung.findUnique({
      where: { nguoi_dung_id: userId },
      select: {
        nguoi_dung_id: true,
        email: true,
        ho_ten: true,
        tuoi: true,
        anh_dai_dien: true,
        ngay_tao: true,
      },
    });

    if (!user) {
      return failCode(res, null, "Không tìm thấy người dùng này!", 404);
    }

    return successCode(res, user, "Lấy thông tin người dùng thành công!");
  } catch (error) {
    console.error("Lỗi getUserById:", error);
    return errorCode(res, "Lỗi khi lấy thông tin người dùng");
  }
};

/**
 * [PUT] /api/users/profile hoặc /api/nguoi-dung/cap-nhat
 * Mở rộng: Cập nhật thông tin tài khoản người dùng
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.nguoi_dung_id;
    const { ho_ten, tuoi, anh_dai_dien } = req.body;

    const updatedUser = await prisma.nguoiDung.update({
      where: { nguoi_dung_id: userId },
      data: {
        ...(ho_ten && { ho_ten }),
        ...(tuoi && { tuoi: parseInt(tuoi) }),
        ...(anh_dai_dien && { anh_dai_dien }),
      },
      select: {
        nguoi_dung_id: true,
        email: true,
        ho_ten: true,
        tuoi: true,
        anh_dai_dien: true,
        ngay_tao: true,
      },
    });

    return successCode(res, updatedUser, "Cập nhật thông tin thành công!");
  } catch (error) {
    console.error("Lỗi updateProfile:", error);
    return errorCode(res, "Lỗi khi cập nhật thông tin cá nhân");
  }
};

module.exports = {
  getCurrentUserProfile,
  getUserById,
  updateProfile,
};
