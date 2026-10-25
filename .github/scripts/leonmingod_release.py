"""Stage/publish only the recovered current website; retain the live asset set and bindings."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import time
from email.parser import BytesParser
import email.policy

import yifu_key_api as api

root = Path('sites/leonmingod-star-night')
mode = os.environ.get('WEBSITE_MODE', 'stage')
release = json.loads((root / ('dist/release.json' if mode == 'stage' else 'release.json')).read_text())
(root/'dist').mkdir(exist_ok=True)
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

def activate_forwarder():
    """Keep the forwarding source byte-identical; target the explicit Site entrypoint."""
    name='leonmingod-free-token'
    old=api.cf(name+'/settings')
    assert len(old['bindings']) == 1 and old['bindings'][0]['name'] == 'SITE'
    assert old['bindings'][0]['service'] == worker
    _, headers, body=api.cf(name,raw=True)
    message=BytesParser(policy=email.policy.default).parsebytes(
        ('Content-Type: '+headers['Content-Type']+'\r\n\r\n').encode()+body)
    parts=[]
    for part in message.iter_parts():
        filename=part.get_filename() or part.get_param('name',header='Content-Disposition')
        if filename != 'metadata':
            parts.append((filename,part.get_content_type(),part.get_payload(decode=True)))
    assert {name for name,_,_ in parts} == {'index.js','index.js.map'}
    metadata={'main_module':'index.js','compatibility_date':old['compatibility_date'],
        'compatibility_flags':old.get('compatibility_flags',[]),
        'bindings':[{**old['bindings'][0],'entrypoint':'Site'}],
        'annotations':{'workers/message':'Forward current site through its Site entrypoint; preserve original assets and router code'}}
    boundary='lmg-forward-'+secrets.token_hex(12);chunks=[]
    for filename,mime,payload in [('metadata','application/json',json.dumps(metadata).encode()),*parts]:
        disposition='form-data; name="'+filename+'"'+('' if filename=='metadata' else '; filename="'+filename+'"')
        chunks.extend([(f'--{boundary}\r\nContent-Disposition: {disposition}\r\nContent-Type: {mime}\r\n\r\n').encode(),payload,b'\r\n'])
    chunks.append(('--'+boundary+'--\r\n').encode())
    api.cf(name,'PUT',b''.join(chunks),{'Content-Type':'multipart/form-data; boundary='+boundary})
    assert api.cf(name+'/settings')['bindings'] == metadata['bindings']
    _, check_headers, check_body=api.cf(name,raw=True)
    checked=BytesParser(policy=email.policy.default).parsebytes(
        ('Content-Type: '+check_headers['Content-Type']+'\r\n\r\n').encode()+check_body)
    actual={p.get_filename() or p.get_param('name',header='Content-Disposition'):hashlib.sha256(p.get_payload(decode=True)).hexdigest() for p in checked.iter_parts() if (p.get_filename() or p.get_param('name',header='Content-Disposition')) != 'metadata'}
    assert actual == {n:hashlib.sha256(b).hexdigest() for n,_,b in parts}, 'Forwarder source changed'
    return api.active(name)

if mode == 'stage':
    metadata = {
        'main_module':'index.js', 'keep_assets':True,
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
    assert version_id == release['staged_version'], 'Publish only the reviewed staged version'
    annotated = (version.get('annotations') or {}).get('workers/message')
    assert annotated in [None, release['message']], 'Unrecognized staged version'
    staged_bindings = version['resources']['bindings']
    assert {(b['name'],b['type']) for b in staged_bindings} == {(b['name'],b['type']) for b in bindings}, 'Staged bindings differ'
    assert [b for b in staged_bindings if b['name']=='GAME_RUNS'] == game, 'Staged game namespace differs'
    try:
        api.cf(worker+'/deployments','POST',{'strategy':'percentage','versions':[{'version_id':version_id,'percentage':100}],'annotations':{'workers/message':release['message']}})
        entrance_after=activate_forwarder()
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
                assert api.active('leonmingod-free-token') == entrance_after
                break
            except (AssertionError,RuntimeError):
                if attempt == 11:raise
                time.sleep(5)
        result={'mode':'publish','version_id':version_id,'previous_version':parent,'entrance_version':entrance_after,'previous_entrance_version':entrance,'forwarder_source_unchanged':True,'same_reward_confirmed':True,'models_http':200,'game_namespace_preserved':True,'source_pages_verified':5}
    except Exception:
        if api.active('leonmingod-free-token') != entrance:
            api.cf('leonmingod-free-token/deployments','POST',{'strategy':'percentage','versions':[{'version_id':entrance,'percentage':100}],'annotations':{'workers/message':'Restore original forwarder after failed website publication'}})
        api.cf(worker+'/deployments','POST',{'strategy':'percentage','versions':[{'version_id':parent,'percentage':100}],'annotations':{'workers/message':'Restore website after failed publication checks'}})
        print('WEBSITE_ROLLED_BACK='+parent)
        raise
else:
    raise RuntimeError('Unsupported website mode')
(root/'dist/release-result.json').write_text(json.dumps(result,indent=2))
print('WEBSITE_RELEASE='+json.dumps(result))
