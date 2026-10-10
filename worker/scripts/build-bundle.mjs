import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workerDir = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const wrangler = resolve(dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
// A dedicated build config keeps credentials out of build logs and always bundles source.
const result = spawnSync(process.execPath, [wrangler, 'deploy', '--config', 'wrangler.bundle.jsonc',
  '--dry-run', '--minify', '--outdir', 'dist'], { cwd: workerDir, stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
copyFileSync(resolve(workerDir, 'dist/worker.js'), resolve(workerDir, 'dist_worker.js'));
console.log('Updated dist_worker.js from src/worker.ts');
