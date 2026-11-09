-- Baseline of the existing Movie schema, including CHECK constraints.
CREATE TABLE nguoi_dung (
  taiKhoan VARCHAR(50) PRIMARY KEY,
  matKhau VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  soDt VARCHAR(20) NOT NULL,
  hoTen VARCHAR(100) NOT NULL,
  maNhom VARCHAR(10) NOT NULL DEFAULT 'GP01',
  maLoaiNguoiDung ENUM('KhachHang','QuanTri') NOT NULL DEFAULT 'KhachHang',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE phim (
  maPhim INT AUTO_INCREMENT PRIMARY KEY,
  tenPhim VARCHAR(200) NOT NULL,
  biDanh VARCHAR(250) NOT NULL,
  trailer VARCHAR(1000) NOT NULL DEFAULT '',
  hinhAnh VARCHAR(1000) NOT NULL DEFAULT '',
  moTa TEXT NOT NULL,
  maNhom VARCHAR(10) NOT NULL DEFAULT 'GP01',
  ngayKhoiChieu DATE NOT NULL,
  danhGia TINYINT NOT NULL DEFAULT 0,
  hot BOOLEAN NOT NULL DEFAULT FALSE,
  dangChieu BOOLEAN NOT NULL DEFAULT TRUE,
  sapChieu BOOLEAN NOT NULL DEFAULT FALSE,
  thoiLuong INT NOT NULL DEFAULT 120,
  CONSTRAINT chk_rating CHECK (danhGia BETWEEN 0 AND 10),
  CONSTRAINT chk_duration CHECK (thoiLuong > 0),
  INDEX idx_movie_group_date (maNhom, ngayKhoiChieu)
) ENGINE=InnoDB;

CREATE TABLE banner (
  maBanner INT AUTO_INCREMENT PRIMARY KEY,
  maPhim INT NOT NULL,
  hinhAnh VARCHAR(1000) NOT NULL,
  FOREIGN KEY (maPhim) REFERENCES phim(maPhim) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE he_thong_rap (
  maHeThongRap VARCHAR(50) PRIMARY KEY,
  tenHeThongRap VARCHAR(100) NOT NULL,
  biDanh VARCHAR(100) NOT NULL,
  logo VARCHAR(1000) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

CREATE TABLE cum_rap (
  maCumRap VARCHAR(100) PRIMARY KEY,
  maHeThongRap VARCHAR(50) NOT NULL,
  tenCumRap VARCHAR(200) NOT NULL,
  diaChi VARCHAR(500) NOT NULL,
  hinhAnh VARCHAR(1000) NOT NULL DEFAULT '',
  FOREIGN KEY (maHeThongRap) REFERENCES he_thong_rap(maHeThongRap)
) ENGINE=InnoDB;

CREATE TABLE rap (
  maRap INT AUTO_INCREMENT PRIMARY KEY,
  maCumRap VARCHAR(100) NOT NULL,
  tenRap VARCHAR(100) NOT NULL,
  FOREIGN KEY (maCumRap) REFERENCES cum_rap(maCumRap)
) ENGINE=InnoDB;

CREATE TABLE ghe (
  maGhe INT AUTO_INCREMENT PRIMARY KEY,
  maRap INT NOT NULL,
  tenGhe VARCHAR(10) NOT NULL,
  loaiGhe ENUM('Thuong','Vip') NOT NULL DEFAULT 'Thuong',
  stt INT NOT NULL,
  UNIQUE KEY uq_seat_name (maRap, tenGhe),
  FOREIGN KEY (maRap) REFERENCES rap(maRap)
) ENGINE=InnoDB;

CREATE TABLE lich_chieu (
  maLichChieu INT AUTO_INCREMENT PRIMARY KEY,
  maPhim INT NOT NULL,
  maRap INT NOT NULL,
  ngayChieuGioChieu DATETIME NOT NULL,
  ketThuc DATETIME NOT NULL,
  giaVe DECIMAL(12,0) NOT NULL,
  CONSTRAINT chk_showtime CHECK (ketThuc > ngayChieuGioChieu),
  CONSTRAINT chk_price CHECK (giaVe > 0),
  UNIQUE KEY uq_showtime (maRap, ngayChieuGioChieu),
  INDEX idx_movie_showtime (maPhim, ngayChieuGioChieu),
  FOREIGN KEY (maPhim) REFERENCES phim(maPhim),
  FOREIGN KEY (maRap) REFERENCES rap(maRap)
) ENGINE=InnoDB;

CREATE TABLE ve (
  maVe INT AUTO_INCREMENT PRIMARY KEY,
  taiKhoan VARCHAR(50) NOT NULL,
  maLichChieu INT NOT NULL,
  maGhe INT NOT NULL,
  giaVe DECIMAL(12,0) NOT NULL,
  ngayDat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booked_seat (maLichChieu, maGhe),
  FOREIGN KEY (taiKhoan) REFERENCES nguoi_dung(taiKhoan),
  FOREIGN KEY (maLichChieu) REFERENCES lich_chieu(maLichChieu),
  FOREIGN KEY (maGhe) REFERENCES ghe(maGhe)
) ENGINE=InnoDB;
