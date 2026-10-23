-- ========================================================
-- CYBERSOFT NODEJS - BÀI TẬP BUỔI 13 (PINTEREST CLONE API)
-- DATABASE: db_baitapbuoi13
-- ========================================================

CREATE DATABASE IF NOT EXISTS `db_baitapbuoi13` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_baitapbuoi13`;

-- 1. XÓA BẢNG NẾU ĐÃ TỒN TẠI (THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI)
DROP TABLE IF EXISTS `luu_anh`;
DROP TABLE IF EXISTS `binh_luan`;
DROP TABLE IF EXISTS `hinh_anh`;
DROP TABLE IF EXISTS `nguoi_dung`;

-- 2. TẠO BẢNG `nguoi_dung`
CREATE TABLE `nguoi_dung` (
    `nguoi_dung_id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `mat_khau` VARCHAR(255) NOT NULL,
    `ho_ten` VARCHAR(255) NOT NULL,
    `tuoi` INT DEFAULT 18,
    `anh_dai_dien` VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TẠO BẢNG `hinh_anh`
CREATE TABLE `hinh_anh` (
    `hinh_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ten_hinh` VARCHAR(255) NOT NULL,
    `duong_dan` VARCHAR(500) NOT NULL,
    `mo_ta` TEXT,
    `nguoi_dung_id` INT NOT NULL,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hinh_anh_nguoi_dung` 
        FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`nguoi_dung_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TẠO BẢNG `binh_luan`
CREATE TABLE `binh_luan` (
    `binh_luan_id` INT AUTO_INCREMENT PRIMARY KEY,
    `nguoi_dung_id` INT NOT NULL,
    `hinh_id` INT NOT NULL,
    `ngay_binh_luan` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `noi_dung` TEXT NOT NULL,
    CONSTRAINT `fk_binh_luan_nguoi_dung` 
        FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`nguoi_dung_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_binh_luan_hinh_anh` 
        FOREIGN KEY (`hinh_id`) REFERENCES `hinh_anh`(`hinh_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TẠO BẢNG `luu_anh`
CREATE TABLE `luu_anh` (
    `nguoi_dung_id` INT NOT NULL,
    `hinh_id` INT NOT NULL,
    `ngay_luu` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`nguoi_dung_id`, `hinh_id`),
    CONSTRAINT `fk_luu_anh_nguoi_dung` 
        FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`nguoi_dung_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_luu_anh_hinh_anh` 
        FOREIGN KEY (`hinh_id`) REFERENCES `hinh_anh`(`hinh_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- CHÈN DỮ LIỆU MẪU (Mật khẩu mặc định là: 1234)
-- Hash bcrypt của "1234": $2b$10$aNPtvEgKAHAC7NKQvALikeOQnTGHUKjBwC.JAkTbBIQHriH9NbjNa
-- ========================================================

-- Chèn người dùng mẫu
INSERT INTO `nguoi_dung` (`nguoi_dung_id`, `email`, `mat_khau`, `ho_ten`, `tuoi`, `anh_dai_dien`) VALUES
(1, 'phucthanh@gmail.com', '$2b$10$aNPtvEgKAHAC7NKQvALikeOQnTGHUKjBwC.JAkTbBIQHriH9NbjNa', 'Huỳnh Phúc Thành', 23, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'),
(2, 'admin@cybersoft.edu.vn', '$2b$10$aNPtvEgKAHAC7NKQvALikeOQnTGHUKjBwC.JAkTbBIQHriH9NbjNa', 'Admin CyberSoft', 28, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80'),
(3, 'linhdan@gmail.com', '$2b$10$aNPtvEgKAHAC7NKQvALikeOQnTGHUKjBwC.JAkTbBIQHriH9NbjNa', 'Trần Linh Đan', 21, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'),
(4, 'hoangnam@gmail.com', '$2b$10$aNPtvEgKAHAC7NKQvALikeOQnTGHUKjBwC.JAkTbBIQHriH9NbjNa', 'Lê Hoàng Nam', 25, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');

-- Chèn hình ảnh mẫu
INSERT INTO `hinh_anh` (`hinh_id`, `ten_hinh`, `duong_dan`, `mo_ta`, `nguoi_dung_id`) VALUES
(1, 'Cyberpunk Tokyo Night', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', 'Đường phố Tokyo rực rỡ ánh đèn neon về đêm.', 1),
(2, 'Bình minh trên đỉnh Fansipan', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 'Khung cảnh thiên nhiên hùng vĩ mờ ảo trong mây.', 1),
(3, 'Cà phê sáng góc phố cổ', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', 'Một góc nhỏ bình yên bên tách cà phê sáng ấm áp.', 2),
(4, 'Minimalist Modern Workspace', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', 'Góc làm việc tối giản với Macbook và đèn bàn phong cách Bắc Âu.', 2),
(5, 'Hoàng hôn trên biển Phú Quốc', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80', 'Ánh hoàng hôn nhuộm đỏ cả mặt biển êm đềm.', 3),
(6, 'Mèo con British Shorthair đáng yêu', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', 'Chú mèo con lông xám mắt tròn xoe ngộ nghĩnh.', 3),
(7, 'Kiến trúc hiện đại Landmark', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', 'Tòa nhà chọc trời phản chiếu bầu trời xanh trong vắt.', 4),
(8, 'Thác nước rừng nguyên sinh', 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80', 'Dòng nước trong mát đổ xuống hồ giữa rừng rậm.', 4);

-- Chèn bình luận mẫu
INSERT INTO `binh_luan` (`binh_luan_id`, `nguoi_dung_id`, `hinh_id`, `noi_dung`) VALUES
(1, 2, 1, 'Bức ảnh màu sắc nghệ thuật quá bạn ơi! Chụp bằng máy gì vậy?'),
(2, 3, 1, 'Nhìn như trong phim anime của Makoto Shinkai vậy, đỉnh thật!'),
(3, 1, 2, 'Cảm giác đứng ở đây chắc chill lắm, view săn mây tuyệt đỉnh.'),
(4, 4, 3, 'Góc cà phê này ở đâu vậy bạn? Cho mình xin địa chỉ với nha!'),
(5, 1, 4, 'Setup góc làm việc gọn gàng và truyền cảm hứng làm việc rất nhiều.'),
(6, 2, 5, 'Phú Quốc mùa này hoàng hôn đẹp mê hồn luôn!'),
(7, 4, 6, 'Bé mèo xinh quá, nhìn cưng xỉu luôn á!'),
(8, 3, 7, 'Góc máy bắt kiến trúc rất chuẩn và đối xứng.');

-- Chèn ảnh đã lưu mẫu (User đã Save ảnh)
INSERT INTO `luu_anh` (`nguoi_dung_id`, `hinh_id`) VALUES
(1, 3),
(1, 4),
(1, 6),
(2, 1),
(2, 5),
(3, 1),
(3, 2),
(3, 4),
(4, 1),
(4, 6);
