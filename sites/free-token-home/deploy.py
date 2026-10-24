"""Update the Free Token entrance, retaining the existing site's assets and secrets."""
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request
import uuid


ROOT = Path(__file__).resolve().parent
ACCOUNT = os.environ['CLOUDFLARE_ACCOUNT_ID'].strip()
TOKEN = os.environ['CLOUDFLARE_API_TOKEN'].strip()
WORKER = 'leonmingod-home'
EXPECTED_VERSION = '0a14864c-6cd7-408f-b15c-9e476f2eea5c'
API_PATH = f'/accounts/{ACCOUNT}/workers/scripts/{WORKER}'
ORIGIN = 'https://leonmingod.com'


def api(path, method='GET', body=None, content_type='application/json'):
    if isinstance(body, dict):
        body = json.dumps(body).encode()
    req = urllib.request.Request(
        'https://api.cloudflare.com/client/v4' + path, data=body, method=method,
        headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': content_type})
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            data = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            errors = json.load(error).get('errors', [])
        except (ValueError, AttributeError):
            errors = []
        raise RuntimeError(f'Cloudflare HTTP {error.code}: {json.dumps(errors)[:3000]}') from None
    if not data.get('success', True):
        raise RuntimeError('Cloudflare rejected operation: ' + json.dumps(data.get('errors', [])))
    return data.get('result')


def read_public(path):
    req = urllib.request.Request(ORIGIN + path, headers={
        'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.status, response.headers, response.read()


def verify():
    status, headers, body = read_public('/free-token/')
    assert status == 200 and b'welcome-mobile-v1.webp' in body
    assert b'welcome-desktop-v1.webp' in body and b'/free-token/claim/' in body
    status, headers, body = read_public('/free-token/claim/')
    assert status == 200 and b'id="oath-form"' in body
    assert b'/free-token/app.js' in body
    for kind in ['mobile', 'desktop']:
        name = f'welcome-{kind}-v1.webp'
        status, headers, body = read_public('/free-token/' + name)
        assert status == 200 and headers.get_content_type() == 'image/webp'
        assert hashlib.sha256(body).digest() == hashlib.sha256((ROOT / 'assets' / name).read_bytes()).digest()
    status, headers, body = read_public('/')
    assert status == 200 and b'hero-mobile-v3.png' in body and b'hero-desktop-v3.png' in body
    status, headers, body = read_public('/free-token/app.js?v=1')
    assert status == 200 and b'/api/free-token/claim' in body
    req = urllib.request.Request(ORIGIN + '/api/free-token/claim', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        urllib.request.urlopen(req, timeout=30)
        raise AssertionError('Claim endpoint must still reject GET')
    except urllib.error.HTTPError as error:
        assert error.code == 405
    settings = api(API_PATH + '/settings')
    assert any(x.get('name') == 'FREE_TOKEN_CPA_KEY' and x.get('type') == 'secret_text'
               for x in settings.get('bindings', [])), 'Claim secret binding was not retained'


def main():
    if not ACCOUNT or not TOKEN:
        raise RuntimeError('Required Cloudflare secrets are missing')
    deployments = api(API_PATH + '/deployments')['deployments']
    active = deployments[0]['versions']
    if len(active) != 1 or active[0]['percentage'] != 100 or active[0]['version_id'] != EXPECTED_VERSION:
        raise RuntimeError('The live website changed since backup; review it before deploying')
    settings = api(API_PATH + '/settings')
    binding_types = sorted({x['type'] for x in settings.get('bindings', []) if x['type'] != 'assets'})
    metadata = {
        'main_module': 'src/index.js',
        'compatibility_date': settings['compatibility_date'],
        'compatibility_flags': settings.get('compatibility_flags', []),
        'bindings': [{'name': 'ASSETS', 'type': 'assets'}],
        'keep_bindings': binding_types,
        'keep_assets': True,
        'assets': {'config': {'run_worker_first': [
            '/free-token', '/free-token/*', '/api/free-token/*',
            '/image', '/img', '/bg', '/wallpaper.png',
        ]}},
        'annotations': {'workers/message': 'Free Token entrance with mobile and desktop posters'},
    }
    for key in ['placement', 'logpush', 'tail_consumers', 'observability', 'limits']:
        if settings.get(key) is not None:
            metadata[key] = settings[key]
    boundary = 'free-token-' + uuid.uuid4().hex
    parts = []
    def part(name, content, mime, filename=None):
        disposition = f'form-data; name="{name}"'
        if filename:
            disposition += f'; filename="{filename}"'
        parts.append((f'--{boundary}\r\nContent-Disposition: {disposition}\r\nContent-Type: {mime}\r\n\r\n').encode() + content + b'\r\n')
    part('metadata', json.dumps(metadata).encode(), 'application/json')
    for folder in ['src', 'assets']:
        for path in sorted((ROOT / folder).glob('*')):
            name = path.relative_to(ROOT).as_posix()
            part(name, path.read_bytes(), 'application/javascript+module' if path.suffix == '.js' else 'application/octet-stream', name)
    parts.append(f'--{boundary}--\r\n'.encode())
    result = api(API_PATH, method='PUT', body=b''.join(parts), content_type='multipart/form-data; boundary=' + boundary)
    print('Worker uploaded:', json.dumps({k: result.get(k) for k in ['id', 'etag', 'deployment_id']}))
    try:
        for attempt in range(5):
            try:
                verify()
                break
            except (AssertionError, urllib.error.URLError):
                if attempt == 4:
                    raise
                time.sleep(2 ** attempt)
    except Exception:
        print('Verification failed; restoring previous immutable Worker version')
        api(API_PATH + '/deployments', method='POST', body={
            'strategy': 'percentage',
            'versions': [{'version_id': EXPECTED_VERSION, 'percentage': 100}],
            'annotations': {'workers/message': 'Restore website after failed Free Token verification'},
        })
        raise
    live = api(API_PATH + '/deployments')['deployments'][0]
    print('VERIFIED_DEPLOYMENT=' + json.dumps({
        'id': live['id'], 'versions': live['versions'],
        'url': ORIGIN + '/free-token/', 'rollback_version': EXPECTED_VERSION,
    }))


if __name__ == '__main__':
    main()
