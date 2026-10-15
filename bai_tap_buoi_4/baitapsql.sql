-- 1. TẠO DATABASE
CREATE DATABASE IF NOT EXISTS db_food;
USE db_food;
DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS `sub_food`;
DROP TABLE IF EXISTS `food`;
DROP TABLE IF EXISTS `food_type`;
DROP TABLE IF EXISTS `like_res`;
DROP TABLE IF EXISTS `rate_res`;
DROP TABLE IF EXISTS `restaurant`;
DROP TABLE IF EXISTS `user`;
-- Bảng user
CREATE TABLE `user` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL
);
-- Bảng restaurant
CREATE TABLE `restaurant` (
    `res_id` INT AUTO_INCREMENT PRIMARY KEY,
    `res_name` VARCHAR(255) NOT NULL,
    `image` VARCHAR(255),
    `desc` VARCHAR(255)
);
-- Bảng rate_res
CREATE TABLE `rate_res` (
    `user_id` INT,
    `res_id` INT,
    `amount` INT,
    `date_rate` DATETIME,
    PRIMARY KEY (`user_id`, `res_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`res_id`) REFERENCES `restaurant`(`res_id`) ON DELETE CASCADE
);
-- Bảng like_res
CREATE TABLE `like_res` (
    `user_id` INT,
    `res_id` INT,
    `date_like` DATETIME,
    PRIMARY KEY (`user_id`, `res_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`res_id`) REFERENCES `restaurant`(`res_id`) ON DELETE CASCADE
);
-- Bảng food_type
CREATE TABLE `food_type` (
    `type_id` INT AUTO_INCREMENT PRIMARY KEY,
    `type_name` VARCHAR(255) NOT NULL
);
-- Bảng food
CREATE TABLE `food` (
    `food_id` INT AUTO_INCREMENT PRIMARY KEY,
    `food_name` VARCHAR(255) NOT NULL,
    `image` VARCHAR(255),
    `price` FLOAT,
    `desc` VARCHAR(255),
    `type_id` INT,
    FOREIGN KEY (`type_id`) REFERENCES `food_type`(`type_id`) ON DELETE SET NULL
);
-- Bảng sub_food
CREATE TABLE `sub_food` (
    `sub_id` INT AUTO_INCREMENT PRIMARY KEY,
    `sub_name` VARCHAR(255) NOT NULL,
    `sub_price` FLOAT,
    `food_id` INT,
    FOREIGN KEY (`food_id`) REFERENCES `food`(`food_id`) ON DELETE CASCADE
);
-- Bảng order
CREATE TABLE `order` (
    `user_id` INT,
    `food_id` INT,
    `amount` INT,
    `code` VARCHAR(255),
    `arr_sub_id` VARCHAR(255),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`food_id`) REFERENCES `food`(`food_id`) ON DELETE CASCADE
);
-- THÊM DỮ LIỆU MẪU


-- Thêm user (10 người dùng)
INSERT INTO `user` (`user_id`, `full_name`, `email`, `password`) VALUES
(1, 'Nguyen Van A', 'nguyenvana@gmail.com', '123456'),
(2, 'Tran Thi B', 'tranthib@gmail.com', '123456'),
(3, 'Le Van C', 'levanc@gmail.com', '123456'),
(4, 'Pham Van D', 'phamvand@gmail.com', '123456'),
(5, 'Hoang Thi E', 'hoangthie@gmail.com', '123456'),
(6, 'Voo Van F', 'vovanf@gmail.com', '123456'),
(7, 'Dang Thi G', 'dangthig@gmail.com', '123456'),
(8, 'Bui Van H', 'buivanh@gmail.com', '123456'),    -- User không hoạt động
(9, 'Ngo Thi I', 'ngothii@gmail.com', '123456'),      -- User không hoạt động
(10, 'Doan Van K', 'doanvank@gmail.com', '123456');
-- User không hoạt động

-- Thêm nhà hàng (5 nhà hàng)
INSERT INTO `restaurant` (`res_id`, `res_name`, `image`, `desc`) VALUES
(1, 'KFC Nhat Tao', 'kfc.jpg', 'Ga ran gion rui'),
(2, 'Pizza Hut Le Dai Hanh', 'pizzahut.jpg', 'Pizza y thom ngon'),
(3, 'Lotteria Ba Thang Hai', 'lotteria.jpg', 'Fast food truyen thong'),
(4, 'McDonalds Tran Hung Dao', 'mcdonalds.jpg', 'Burger va khoai tay chien'),
(5, 'Starbucks Nguyen Hue', 'starbucks.jpg', 'Ca phe va banh ngot');
-- Thêm loại món ăn
INSERT INTO `food_type` (`type_id`, `type_name`) VALUES
(1, 'Fast Food'),
(2, 'Drink'),
(3, 'Dessert');
-- Thêm món ăn
INSERT INTO `food` (`food_id`, `food_name`, `image`, `price`, `desc`, `type_id`) VALUES
(1, 'Ga ran mieng', 'garan.jpg', 35000, 'Ga ran sot cay', 1),
(2, 'Pizza Hai San', 'pizza.jpg', 150000, 'Pizza hai san co lon', 1),
(3, 'Tra sua Oolong', 'trasua.jpg', 45000, 'Tra sua kem cheese', 2),
(4, 'Burger Bo', 'burger.jpg', 65000, 'Burger bo nuong', 1);
-- Thêm sub_food
INSERT INTO `sub_food` (`sub_id`, `sub_name`, `sub_price`, `food_id`) VALUES
(1, 'Them phomai', 10000, 2),
(2, 'Them tranchau', 8000, 3);
-- Thêm lượt like nhà hàng (like_res)
INSERT INTO `like_res` (`user_id`, `res_id`, `date_like`) VALUES
(1, 1, '2023-01-01 10:00:00'),
(1, 2, '2023-01-02 11:00:00'),
(1, 3, '2023-01-03 12:00:00'),
(1, 4, '2023-01-04 13:00:00'),
(1, 5, '2023-01-05 14:00:00'), -- User 1: 5 likes
(2, 1, '2023-01-01 10:00:00'),
(2, 2, '2023-01-02 11:00:00'),
(2, 3, '2023-01-03 12:00:00'),
(2, 4, '2023-01-04 13:00:00'), -- User 2: 4 likes
(3, 1, '2023-01-01 10:00:00'),
(3, 2, '2023-01-02 11:00:00'),
(3, 3, '2023-01-03 12:00:00'), -- User 3: 3 likes
(4, 1, '2023-01-01 10:00:00'),
(4, 2, '2023-01-02 11:00:00'),
(4, 4, '2023-01-04 13:00:00'), -- User 4: 3 likes
(5, 1, '2023-01-01 10:00:00'),
(5, 3, '2023-01-03 12:00:00'), -- User 5: 2 likes
(6, 1, '2023-01-01 10:00:00'), -- User 6: 1 like
(7, 2, '2023-01-02 11:00:00');
-- User 7: 1 like

-- Thêm đánh giá nhà hàng (rate_res)
INSERT INTO `rate_res` (`user_id`, `res_id`, `amount`, `date_rate`) VALUES
(1, 1, 5, '2023-01-06 10:00:00'),
(2, 2, 4, '2023-01-06 11:00:00'),
(4, 1, 5, '2023-01-06 12:00:00'),
(5, 3, 3, '2023-01-06 13:00:00');
-- Thêm đơn hàng (order)
INSERT INTO `order` (`user_id`, `food_id`, `amount`, `code`, `arr_sub_id`) VALUES
(3, 1, 2, 'ORD001', '1'),
(3, 2, 1, 'ORD002', '1,2'),
(3, 3, 3, 'ORD003', ''),
(3, 4, 1, 'ORD004', ''),
(3, 1, 2, 'ORD005', ''), -- User 3: 5 orders (nhiều nhất)
(1, 2, 1, 'ORD006', '1'),
(1, 3, 2, 'ORD007', ''),
(2, 4, 1, 'ORD008', ''),
(4, 1, 2, 'ORD009', ''),
(6, 3, 1, 'ORD010', '');
-- Tìm 5 người đã like nhà hàng nhiều nhất.

SELECT 
    u.user_id, 
    u.full_name, 
    u.email, 
    COUNT(l.res_id) AS total_like
FROM `user` u
INNER JOIN `like_res` l ON u.user_id = l.user_id
GROUP BY u.user_id, u.full_name, u.email
ORDER BY total_like DESC
LIMIT 5;
-- Tìm 2 nhà hàng có lượt like nhiều nhất.

SELECT 
    r.res_id, 
    r.res_name, 
    COUNT(l.user_id) AS total_like
FROM `restaurant` r
INNER JOIN `like_res` l ON r.res_id = l.res_id
GROUP BY r.res_id, r.res_name
ORDER BY total_like DESC
LIMIT 2;


-- Tìm người đã đặt hàng nhiều nhất.

SELECT 
    u.user_id, 
    u.full_name, 
    u.email, 
    COUNT(o.food_id) AS total_orders,
    SUM(o.amount) AS total_items_ordered
FROM `user` u
INNER JOIN `order` o ON u.user_id = o.user_id
GROUP BY u.user_id, u.full_name, u.email
ORDER BY total_orders DESC
LIMIT 1;


-- Yêu cầu 4: Tìm người dùng không hoạt động trong hệ thống 
-- (không đặt hàng, không like, không đánh giá nhà hàng).


SELECT 
    u.user_id, 
    u.full_name, 
    u.email
FROM `user` u
LEFT JOIN `like_res` l ON u.user_id = l.user_id
LEFT JOIN `rate_res` r ON u.user_id = r.user_id
LEFT JOIN `order` o ON u.user_id = o.user_id
WHERE l.user_id IS NULL 
  AND r.user_id IS NULL 
  AND o.user_id IS NULL;