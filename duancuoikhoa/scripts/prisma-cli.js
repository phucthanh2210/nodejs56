import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { databaseUrl } from '../src/database-url.js';

const require = createRequire(import.meta.url);

export function runPrisma(args) {
  return execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, DATABASE_URL: databaseUrl(), PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'inherit',
    encoding: 'utf8',
  });
}
