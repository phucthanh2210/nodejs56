import { defineConfig } from 'prisma/config';
import { databaseUrl } from './src/database-url.js';

process.env.DATABASE_URL = databaseUrl();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
});
