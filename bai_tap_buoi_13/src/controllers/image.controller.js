const prisma = require("../config/prisma");
const { successCode, failCode, errorCode } = require("../config/response");

/**
 * [GET] /api/images hoặc /api/hinh-anh
 * Trang chủ: GET danh sách ảnh về
 */
const getImages = async (req, res) => {
  try {
    const { page, size } = req.query;

    let queryOptions = {
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
        ngay_tao: "desc",
      },
    };

    // Phân trang nếu có truyền page & size
    if (page && size) {
      const pageIndex = parseInt(page);
      const pageSize = parseInt(size);
      queryOptions.skip = (pageIndex - 1) * pageSize;
      queryOptions.take = pageSize;

      const [totalItems, images] = await Promise.all([
        prisma.hinhAnh.count(),
        prisma.hinhAnh.findMany(queryOptions),
      ]);

      return successCode(
        res,
        {
          items: images,
          page: pageIndex,
          size: pageSize,
          totalPages: Math.ceil(totalItems / pageSize),
          totalItems,
        },
        "Lấy danh sách ảnh thành công!"
      );
    }

    const images = await prisma.hinhAnh.findMany(queryOptions);
    return successCode(res, images, "Lấy danh sách ảnh thành công!");
  } catch (error) {
    console.error("Lỗi getImages:", error);
    return errorCode(res, "Lỗi khi lấy danh sách hình ảnh");
  }
};

/**
 * [GET] /api/images/search hoặc /api/hinh-anh/tim-kiem
 * Trang chủ: GET tìm kiếm danh sách ảnh theo tên
 */
const searchImages = async (req, res) => {
  try {
    const { ten, name } = req.query;
    const searchKeyword = (ten || name || "").trim();

    const images = await prisma.hinhAnh.findMany({
      where: searchKeyword
        ? {
            ten_hinh: {
              contains: searchKeyword,
            },
          }
        : {},
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
        ngay_tao: "desc",
      },
    });

    return successCode(
      res,
      images,
      `Tìm thấy ${images.length} hình ảnh phù hợp với từ khóa: "${searchKeyword}"`
    );
  } catch (error) {
    console.error("Lỗi searchImages:", error);
    return errorCode(res, "Lỗi khi tìm kiếm hình ảnh");
  }
};

/**
 * [GET] /api/images/:id hoặc /api/hinh-anh/chi-tiet/:id
 * Trang chi tiết: GET thông tin ảnh và người tạo ảnh bằng id ảnh
 */
const getImageDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return failCode(res, null, "ID hình ảnh không hợp lệ!", 400);
    }

    const image = await prisma.hinhAnh.findUnique({
      where: { hinh_id: imageId },
      include: {
        nguoi_dung: {
          select: {
            nguoi_dung_id: true,
            ho_ten: true,
            email: true,
            tuoi: true,
            anh_dai_dien: true,
          },
        },
      },
    });

    if (!image) {
      return failCode(res, null, "Không tìm thấy hình ảnh này!", 404);
    }

    return successCode(res, image, "Lấy thông tin chi tiết hình ảnh thành công!");
  } catch (error) {
    console.error("Lỗi getImageDetail:", error);
    return errorCode(res, "Lỗi khi lấy chi tiết hình ảnh");
  }
};

/**
 * [GET] /api/images/check-saved/:id hoặc /api/hinh-anh/da-luu/:id
 * Trang chi tiết: GET thông tin đã lưu hình này chưa theo id ảnh (dùng để kiểm tra ảnh đã lưu hay chưa ở nút Save)
 */
const checkImageSaved = async (req, res) => {
  try {
    const { id } = req.params;
    const imageId = parseInt(id);
    const userId = req.user.nguoi_dung_id;

    if (isNaN(imageId)) {
      return failCode(res, null, "ID hình ảnh không hợp lệ!", 400);
    }

    const savedRecord = await prisma.luuAnh.findUnique({
      where: {
        nguoi_dung_id_hinh_id: {
          nguoi_dung_id: userId,
          hinh_id: imageId,
        },
      },
    });

    return successCode(
      res,
      {
        daLuu: Boolean(savedRecord),
        ngayLuu: savedRecord ? savedRecord.ngay_luu : null,
      },
      savedRecord ? "Hình ảnh này đã được lưu vào bộ sưu tập" : "Hình ảnh này chưa được lưu"
    );
  } catch (error) {
    console.error("Lỗi checkImageSaved:", error);
    return errorCode(res, "Lỗi khi kiểm tra trạng thái lưu hình ảnh");
  }
};

/**
 * [POST] /api/images/save/:id hoặc /api/hinh-anh/luu-anh/:id
 * Mở rộng: Cho phép người dùng Lưu hoặc Bỏ lưu hình ảnh (Toggle Save/Unsave)
 */
const toggleSaveImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imageId = parseInt(id);
    const userId = req.user.nguoi_dung_id;

    if (isNaN(imageId)) {
      return failCode(res, null, "ID hình ảnh không hợp lệ!", 400);
    }

    // Kiểm tra ảnh có tồn tại không
    const checkImage = await prisma.hinhAnh.findUnique({
      where: { hinh_id: imageId },
    });

    if (!checkImage) {
      return failCode(res, null, "Hình ảnh không tồn tại!", 404);
    }

    // Kiểm tra xem đã lưu chưa
    const existing = await prisma.luuAnh.findUnique({
      where: {
        nguoi_dung_id_hinh_id: {
          nguoi_dung_id: userId,
          hinh_id: imageId,
        },
      },
    });

    if (existing) {
      // Nếu đã lưu thì xóa bỏ lưu (Unsave)
      await prisma.luuAnh.delete({
        where: {
          nguoi_dung_id_hinh_id: {
            nguoi_dung_id: userId,
            hinh_id: imageId,
          },
        },
      });
      return successCode(res, { daLuu: false }, "Đã hủy lưu hình ảnh!");
    } else {
      // Nếu chưa lưu thì lưu vào
      const newSave = await prisma.luuAnh.create({
        data: {
          nguoi_dung_id: userId,
          hinh_id: imageId,
        },
      });
      return successCode(res, { daLuu: true, ...newSave }, "Lưu hình ảnh thành công!", 201);
    }
  } catch (error) {
    console.error("Lỗi toggleSaveImage:", error);
    return errorCode(res, "Lỗi khi thao tác lưu hình ảnh");
  }
};

/**
 * [GET] /api/images/saved-by-user/:userId hoặc /api/hinh-anh/da-luu-theo-user/:user_id
 * Trang quản lý ảnh: GET danh sách ảnh đã lưu theo user id
 */
const getSavedImagesByUserId = async (req, res) => {
  try {
    const { userId, user_id } = req.params;
    const targetUserId = parseInt(userId || user_id);

    if (isNaN(targetUserId)) {
      return failCode(res, null, "User ID không hợp lệ!", 400);
    }

    const savedList = await prisma.luuAnh.findMany({
      where: { nguoi_dung_id: targetUserId },
      include: {
        hinh_anh: {
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
        },
      },
      orderBy: {
        ngay_luu: "desc",
      },
    });

    // Định dạng danh sách ảnh trả về
    const result = savedList.map((item) => ({
      ngay_luu: item.ngay_luu,
      ...item.hinh_anh,
    }));

    return successCode(res, result, "Lấy danh sách ảnh đã lưu thành công!");
  } catch (error) {
    console.error("Lỗi getSavedImagesByUserId:", error);
    return errorCode(res, "Lỗi khi lấy danh sách ảnh đã lưu");
  }
};

/**
 * [GET] /api/images/created-by-user/:userId hoặc /api/hinh-anh/da-tao-theo-user/:user_id
 * Trang quản lý ảnh: GET danh sách ảnh đã tạo theo user id
 */
const getCreatedImagesByUserId = async (req, res) => {
  try {
    const { userId, user_id } = req.params;
    const targetUserId = parseInt(userId || user_id);

    if (isNaN(targetUserId)) {
      return failCode(res, null, "User ID không hợp lệ!", 400);
    }

    const createdImages = await prisma.hinhAnh.findMany({
      where: { nguoi_dung_id: targetUserId },
      orderBy: {
        ngay_tao: "desc",
      },
    });

    return successCode(res, createdImages, "Lấy danh sách ảnh đã tạo thành công!");
  } catch (error) {
    console.error("Lỗi getCreatedImagesByUserId:", error);
    return errorCode(res, "Lỗi khi lấy danh sách ảnh đã tạo");
  }
};

/**
 * [DELETE] /api/images/:id hoặc /api/hinh-anh/:id
 * Trang quản lý ảnh: DELETE xóa ảnh đã tạo theo id ảnh
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imageId = parseInt(id);
    const userId = req.user.nguoi_dung_id;

    if (isNaN(imageId)) {
      return failCode(res, null, "ID hình ảnh không hợp lệ!", 400);
    }

    // Kiểm tra ảnh tồn tại
    const image = await prisma.hinhAnh.findUnique({
      where: { hinh_id: imageId },
    });

    if (!image) {
      return failCode(res, null, "Hình ảnh không tồn tại!", 404);
    }

    // Kiểm tra quyền: chỉ người tạo ảnh mới có quyền xóa
    if (image.nguoi_dung_id !== userId) {
      return failCode(res, null, "Bạn không có quyền xóa hình ảnh này!", 403);
    }

    // Xóa ảnh (các bình luận và lưu ảnh liên quan sẽ tự động xóa nhờ CASCADE)
    await prisma.hinhAnh.delete({
      where: { hinh_id: imageId },
    });

    return successCode(res, null, "Xóa hình ảnh thành công!");
  } catch (error) {
    console.error("Lỗi deleteImage:", error);
    return errorCode(res, "Lỗi khi xóa hình ảnh");
  }
};

/**
 * [POST] /api/images hoặc /api/hinh-anh
 * Mở rộng: Tạo / tải lên hình ảnh mới
 */
const createImage = async (req, res) => {
  try {
    const userId = req.user.nguoi_dung_id;
    const { ten_hinh, duong_dan, mo_ta } = req.body;

    if (!ten_hinh || !duong_dan) {
      return failCode(res, null, "Vui lòng nhập đầy đủ tên hình và đường dẫn ảnh (URL)!", 400);
    }

    const newImage = await prisma.hinhAnh.create({
      data: {
        ten_hinh,
        duong_dan,
        mo_ta: mo_ta || "",
        nguoi_dung_id: userId,
      },
    });

    return successCode(res, newImage, "Tải lên hình ảnh mới thành công!", 201);
  } catch (error) {
    console.error("Lỗi createImage:", error);
    return errorCode(res, "Lỗi khi thêm hình ảnh mới");
  }
};

module.exports = {
  getImages,
  searchImages,
  getImageDetail,
  checkImageSaved,
  toggleSaveImage,
  getSavedImagesByUserId,
  getCreatedImagesByUserId,
  deleteImage,
  createImage,
};
