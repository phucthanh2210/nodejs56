import app from './app.js';
import env from './config.js';
import { pool } from './db.js';

try {
  await pool.query('SELECT 1');
  const server = app.listen(env.PORT, () => console.log(`Movie API: http://localhost:${env.PORT}/swagger`));
  const shutdown = () => {
    server.close(async () => { await pool.end(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('error', async error => { console.error(error.message); await pool.end(); process.exit(1); });
} catch (error) {
  console.error('Không kết nối được MySQL:', error.message);
  await pool.end();
  process.exit(1);
}
