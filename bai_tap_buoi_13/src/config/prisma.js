const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// Kiểm tra kết nối MySQL
prisma.$connect()
  .then(() => {
    console.log("✅ Kết nối MySQL Docker thành công (Port 3307, Database: db_baitapbuoi13)!");
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MySQL:", err.message);
  });

module.exports = prisma;
