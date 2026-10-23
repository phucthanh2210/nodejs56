require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");
const rootRouter = require("./routes/root.router");
const { failCode } = require("./config/response");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware cơ bản
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ Web Frontend & Static files
app.use(express.static(path.join(__dirname, "../public")));

// Swagger UI Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Định tuyến chính cho RESTful API
app.use("/api", rootRouter);

// Trang chủ mở Web Application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Bắt lỗi 404 cho API
app.use("/api/*", (req, res) => {
  return failCode(res, null, `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống API!`, 404);
});

// Fallback SPA routing cho Frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  return res.status(500).json({
    statusCode: 500,
    message: err.message || "Đã xảy ra lỗi máy chủ nội bộ!",
    content: null,
    dateTime: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Website Pinterest đang chạy tại: http://localhost:${PORT}`);
  console.log(`📖 Tài liệu Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`🗄️  Kết nối MySQL: Docker Container (Port 3307)`);
  console.log(`====================================================`);
});
