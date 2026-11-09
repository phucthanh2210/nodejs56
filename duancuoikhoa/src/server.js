import app from './app.js';
import env from './config.js';
import { prisma } from './db.js';

try {
  await prisma.$queryRaw`SELECT 1`;
  const server = app.listen(env.PORT, () => console.log(`Movie API: http://localhost:${env.PORT}/swagger`));
  const shutdown = () => {
    server.close(async () => { await prisma.$disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('error', async error => { console.error(error.message); await prisma.$disconnect(); process.exit(1); });
} catch (error) {
  console.error('Không kết nối được MySQL:', error.message);
  await prisma.$disconnect();
  process.exit(1);
}
