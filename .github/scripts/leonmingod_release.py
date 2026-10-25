"""Stage/publish only the recovered current website; retain the live asset set and bindings."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import time

import yifu_key_api as api

root = Path('sites/leonmingod-star-night')
release = json.loads((root / 'dist/release.json').read_text())
worker = 'leonmingod-home'
parent = api.active(worker)
entrance = api.active('leonmingod-free-token')
assert parent == release['baseline_parent'], 'Parent changed since source recovery; reread and review before publishing'
assert entrance == release['baseline_entrance'], 'Entrance changed since source recovery'
settings = api.cf(worker + '/settings')
bindings = settings['bindings']
game = [b for b in bindings if b['name'] == 'GAME_RUNS']
assert len(game) == 1 and game[0]['class_name'] == 'GameRun' and game[0]['namespace_id'] == '2dffacc2783647f0bec81263501de5e1'
assert any(b['name'] == 'FREE_TOKEN_RENDER_KEY' and b['type'] == 'secret_text' for b in bindings)
assert any(b['name'] == 'ASSETS' and b['type'] == 'assets' for b in bindings)

def claim():
    data = json.loads(api.request(api.ORIGIN + '/api/free-token/claim', 'POST', {'oath':'义父','confirmed':True}, {'Origin':api.ORIGIN})[2])
    assert data['baseUrl'] == api.RENDER_ORIGIN + '/v1' and data['apiKey']
    return data

before_claim = claim()
mode = os.environ.get('WEBSITE_MODE', 'stage')
if mode == 'stage':
    metadata = {
        'main_module':'index.js', 'keep_assets':True,
        'assets':{'config':{'run_worker_first':True}},
        'compatibility_date':settings['compatibility_date'],
        'compatibility_flags':settings.get('compatibility_flags', []),
        'keep_bindings':['secret_text','plain_text','json'],
        'bindings':[b for b in bindings if b['type'] not in ['secret_text','plain_text','json']],
        'annotations':{'workers/message':release['message']},
    }
    boundary = 'lmg-' + secrets.token_hex(16)
    chunks=[]
    for name, mime, payload in [('metadata','application/json',json.dumps(metadata).encode()),('index.js','application/javascript+module',(root/'dist/index.js').read_bytes()),('index.js.map','application/source-map',(root/'dist/index.js.map').read_bytes())]:
        disposition='form-data; name="'+name+'"'+('' if name == 'metadata' else '; filename="'+name+'"')
        chunks += [(f'--{boundary}\r\nContent-Disposition: {disposition}\r\nContent-Type: {mime}\r\n\r\n').encode(),payload,b'\r\n']
    chunks.append(('--'+boundary+'--\r\n').encode())
    version=api.cf(worker+'/versions','POST',b''.join(chunks),{'Content-Type':'multipart/form-data; boundary='+boundary})
    assert api.active(worker) == parent and claim() == before_claim, 'Stage unexpectedly affected production'
    result={'mode':'stage','version_id':version['id'],'production_unchanged':True,'parent_version':parent,'entrance_version':entrance,'module_sha256':hashlib.sha256((root/'dist/index.js').read_bytes()).hexdigest(),'resources_summary':{'bindings':[{'name':b['name'],'type':b['type']} for b in version.get('resources',{}).get('bindings',[])],'assets_config':version.get('resources',{}).get('assets',{}).get('config')}}
elif mode == 'publish':
    version_id=os.environ['WEBSITE_VERSION']
    version=api.cf(worker+'/versions/'+version_id)
    assert version['metadata']['annotations']['workers/message'] == release['message'], 'Unrecognized staged version'
    try:
        api.cf(worker+'/deployments','POST',{'strategy':'percentage','versions':[{'version_id':version_id,'percentage':100}],'annotations':{'workers/message':release['message']}})
        for attempt in range(12):
            try:
                for path, local in [('/','index.html'),('/free-token/','free-token/index.html'),('/free-token/choose/','free-token/choose/index.html'),('/free-token/claim/','free-token/claim/index.html'),('/free-token/game/','free-token/game/index.html')]:
                    body=api.request(api.ORIGIN+path)[2].decode()
                    expected=(root/'public'/local).read_text()
                    import re
                    body=re.sub(r'<script[^>]*src=["\']https://static\.cloudflareinsights\.com/[^>]*>\s*</script>','',body)
                    assert body.replace('\r\n','\n').strip()==expected.replace('\r\n','\n').strip(), 'Published page differs: '+path
                assert claim() == before_claim, 'Reward changed during website publication'
                assert api.models(before_claim['apiKey']) > 0
                after=api.cf(worker+'/settings')['bindings']
                assert {(b['name'],b['type']) for b in after} == {(b['name'],b['type']) for b in bindings}
                assert [b for b in after if b['name']=='GAME_RUNS'] == game
                assert api.active('leonmingod-free-token') == entrance
                break
            except (AssertionError,RuntimeError):
                if attempt == 11:raise
                time.sleep(5)
        result={'mode':'publish','version_id':version_id,'previous_version':parent,'entrance_version':entrance,'same_reward_confirmed':True,'models_http':200,'game_namespace_preserved':True,'source_pages_verified':5}
    except Exception:
        api.cf(worker+'/deployments','POST',{'strategy':'percentage','versions':[{'version_id':parent,'percentage':100}],'annotations':{'workers/message':'Restore website after failed publication checks'}})
        print('WEBSITE_ROLLED_BACK='+parent)
        raise
else:
    raise RuntimeError('Unsupported website mode')
(root/'dist/release-result.json').write_text(json.dumps(result,indent=2))
print('WEBSITE_RELEASE='+json.dumps(result))
