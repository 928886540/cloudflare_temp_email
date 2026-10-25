import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const release = JSON.parse(await readFile('release.json', 'utf8'));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.mjs':'application/javascript; charset=utf-8', '.webp':'image/webp' };
const routes = {}, manifest = {};
for (const file of release.files) {
  const bytes = await readFile('public/' + file);
  const asset = { file, type: types[extname(file)], body: bytes.toString('base64') };
  if (!asset.type) throw new Error('Unsupported static content type');
  routes['/' + file] = asset;
  if (file.endsWith('index.html')) {
    const directory = '/' + file.slice(0, -10);
    routes[directory] = asset;
    if (directory !== '/') routes[directory.slice(0, -1)] = asset;
  }
  manifest[file] = { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
}
await mkdir('.generated', {recursive:true});
await mkdir('dist', {recursive:true});
await writeFile('.generated/routes.mjs', 'export default ' + JSON.stringify(routes) + ';\n');
await build({ entryPoints:['src/index.js'], bundle:true, format:'esm', target:'es2022', external:['cloudflare:workers'], outfile:'dist/index.js', sourcemap:'external', minify:true });
await writeFile('dist/release.json', JSON.stringify({...release, manifest}, null, 2));
console.log('Built current Worker with', release.files.length, 'updated/new static files; existing ASSETS remain in place.');
