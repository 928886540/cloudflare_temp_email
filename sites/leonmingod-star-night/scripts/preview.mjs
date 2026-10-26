import { Miniflare } from 'miniflare';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const mf = new Miniflare({ port:8790, modules:true, scriptPath:'dist/index.js', compatibilityDate:'2025-04-01',
  bindings: { FREE_TOKEN_RENDER_KEY:'local-preview-key-not-a-credential', FREE_TOKEN_LOCAL_TEST:'local-test-only' },
  durableObjects: { GAME_RUNS:{className:'GameRun',useSQLite:true} },
  serviceBindings: { ASSETS:async req=>{
    const url=new URL(req.url);let file=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+'/')&&file!==root)return new Response('Forbidden',{status:403});
    try{if((await stat(file)).isDirectory())file+='/index.html';return new Response(req.method==='HEAD'?null:await readFile(file),{headers:{'Content-Type':types[extname(file)]||'application/octet-stream'}})}catch{return new Response('Not found',{status:404})}
  } }
});
console.log('Preview at',String(await mf.ready));
process.on('SIGTERM',()=>mf.dispose());
