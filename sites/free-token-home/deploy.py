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
WORKER = 'leonmingod-free-token'
ROOT_WORKER = 'leonmingod-home'
ZONE = '4f078f06b815a404337c3b5387c45275'
EXPECTED_VERSION = '0a14864c-6cd7-408f-b15c-9e476f2eea5c'
EXPECTED_ENTRANCE_VERSION = 'bd5549a8-a862-4a72-bd99-fb524a79ec44'
API_PATH = f'/accounts/{ACCOUNT}/workers/scripts/{WORKER}'
ROOT_API = f'/accounts/{ACCOUNT}/workers/scripts/{ROOT_WORKER}'
ROUTES_API = f'/zones/{ZONE}/workers/routes'
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
    assert body.count(b'class="gift-link address-link"') == 1
    assert 'href="https://addr.leonmingod.com"'.encode() in body and '地址证明'.encode() in body
    assert b'https://mail.leonmingod.com' in body and b'href="/free-token/"' in body
    status, headers, body = read_public('/free-token/app.js?v=1')
    assert status == 200 and b'/api/free-token/claim' in body
    req = urllib.request.Request(ORIGIN + '/api/free-token/claim', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        urllib.request.urlopen(req, timeout=30)
        raise AssertionError('Claim endpoint must still reject GET')
    except urllib.error.HTTPError as error:
        assert error.code == 405
    settings = api(ROOT_API + '/settings')
    assert any(x.get('name') == 'FREE_TOKEN_CPA_KEY' and x.get('type') == 'secret_text'
               for x in settings.get('bindings', [])), 'Claim secret binding was not retained'


def main():
    if not ACCOUNT or not TOKEN:
        raise RuntimeError('Required Cloudflare secrets are missing')
    deployments = api(ROOT_API + '/deployments')['deployments']
    active = deployments[0]['versions']
    if len(active) != 1 or active[0]['percentage'] != 100 or active[0]['version_id'] != EXPECTED_VERSION:
        raise RuntimeError('The live website changed since backup; review it before deploying')
    entrance_versions = api(API_PATH + '/deployments')['deployments'][0]['versions']
    if len(entrance_versions) != 1 or entrance_versions[0]['percentage'] != 100 or entrance_versions[0]['version_id'] != EXPECTED_ENTRANCE_VERSION:
        raise RuntimeError('The entrance Worker changed since review; do not overwrite it')
    patterns = [host + suffix for host in ['leonmingod.com', 'www.leonmingod.com']
                for suffix in ['/', '/index.html', '/free-token', '/free-token/*']]
    existing_routes = {x['pattern']: x for x in api(ROUTES_API)}
    if any(pattern in existing_routes and existing_routes[pattern].get('script') != WORKER for pattern in patterns):
        raise RuntimeError('A requested route belongs to another Worker; review before replacing it')
    settings = api(ROOT_API + '/settings')
    metadata = {
        'main_module': 'src/index.js',
        'compatibility_date': settings['compatibility_date'],
        'compatibility_flags': settings.get('compatibility_flags', []),
        'bindings': [{'name': 'SITE', 'type': 'service', 'service': ROOT_WORKER,
                      'environment': 'production'}],
        'annotations': {'workers/message': 'Add Address Proof link to the homepage navigation'},
    }
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
            if path.name == 'site-original.js':
                continue
            name = path.relative_to(ROOT).as_posix()
            part(name, path.read_bytes(), 'application/javascript+module' if path.suffix == '.js' else 'application/octet-stream', name)
    parts.append(f'--{boundary}--\r\n'.encode())
    result = api(API_PATH, method='PUT', body=b''.join(parts), content_type='multipart/form-data; boundary=' + boundary)
    print('Worker uploaded:', json.dumps({k: result.get(k) for k in ['id', 'etag', 'deployment_id']}))
    route_ids = []
    try:
        for pattern in patterns:
            if pattern in existing_routes:
                continue
            route = api(ROUTES_API, method='POST', body={'pattern': pattern, 'script': WORKER})
            route_ids.append(route['id'])
        for attempt in range(8):
            try:
                verify()
                break
            except (AssertionError, urllib.error.URLError):
                if attempt == 7:
                    raise
                time.sleep(min(2 ** attempt, 8))
    except Exception:
        print('Verification failed; restoring previous entrance version and removing new routes')
        for route_id in reversed(route_ids):
            api(ROUTES_API + '/' + route_id, method='DELETE')
        api(API_PATH + '/deployments', method='POST', body={
            'strategy': 'percentage',
            'versions': [{'version_id': EXPECTED_ENTRANCE_VERSION, 'percentage': 100}],
            'annotations': {'workers/message': 'Restore entrance after failed navigation verification'},
        })
        raise
    live = api(API_PATH + '/deployments')['deployments'][0]
    print('VERIFIED_DEPLOYMENT=' + json.dumps({
        'id': live['id'], 'versions': live['versions'],
        'url': ORIGIN + '/free-token/', 'original_version': EXPECTED_VERSION,
        'worker': WORKER, 'route_ids': route_ids,
    }))


if __name__ == '__main__':
    main()
