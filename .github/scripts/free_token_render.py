"""Inspect the live CPA and website without printing credentials."""
import email.policy
from email.parser import BytesParser
import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

import yaml

SERVICE = 'srv-d9c4kkvavr4c73ab3sfg'
WORKSPACE = 'tea-d779tahr0fns73e1h3lg'
RENDER_ORIGIN = 'https://cpa-dhke.onrender.com'
ORIGIN = 'https://leonmingod.com'
ROOT = Path('sites/free-token-home')


def request(url, method='GET', body=None, headers=None):
    headers = {'User-Agent': 'Mozilla/5.0', **(headers or {})}
    if isinstance(body, (dict, list)):
        body = json.dumps(body).encode()
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.status, res.headers, res.read()
    except urllib.error.HTTPError as error:
        # Provider error bodies can contain the submitted configuration or secrets.
        raise RuntimeError(f'{method} {urllib.parse.urlsplit(url).path}: HTTP {error.code}') from None


def render(path, method='GET', body=None):
    return json.loads(request('https://api.render.com/v1' + path, method, body,
                             {'Authorization': 'Bearer ' + os.environ['RENDER_API_KEY'].strip()})[2])


def cf(path, method='GET', body=None, headers=None, raw=False):
    result = request('https://api.cloudflare.com/client/v4/accounts/' +
                     os.environ['CLOUDFLARE_ACCOUNT_ID'].strip() + '/workers/scripts/' + path,
                     method, body, {'Authorization': 'Bearer ' + os.environ['CLOUDFLARE_API_TOKEN'].strip(),
                                    **(headers or {})})
    if raw:
        return result
    data = json.loads(result[2])
    if not data.get('success'):
        raise RuntimeError('Cloudflare rejected the operation')
    return data['result']


def active(worker):
    versions = cf(worker + '/deployments')['deployments'][0]['versions']
    if len(versions) != 1 or versions[0]['percentage'] != 100:
        raise RuntimeError('Only a single fully deployed Worker version is supported')
    return versions[0]['version_id']


def source():
    _, headers, body = cf('leonmingod-home', raw=True)
    if 'multipart/' in headers.get('Content-Type', ''):
        message = BytesParser(policy=email.policy.default).parsebytes(
            ('Content-Type: ' + headers['Content-Type'] + '\r\n\r\n').encode() + body)
        parts = {p.get_filename() or p.get_param('name', header='Content-Disposition'):
                 p.get_payload(decode=True) for p in message.iter_parts()}
        if set(parts) != {'index.js'}:
            raise RuntimeError('Unexpected parent Worker modules; review before editing')
        return parts['index.js'].decode()
    return body.decode()


def inspect():
    for name in ['RENDER_API_KEY', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN']:
        if not os.environ.get(name, '').strip():
            raise RuntimeError('Missing GitHub Actions secret: ' + name)
    service = render('/services/' + SERVICE)
    assert service['ownerId'] == WORKSPACE
    assert service['repo'] == 'https://github.com/928886540/cpa'
    assert service['branch'] == 'main'
    assert service['serviceDetails']['envSpecificDetails']['dockerCommand'] == './CLIProxyAPI --config /etc/secrets/config.yaml'
    secret = render('/services/' + SERVICE + '/secret-files/config.yaml')
    config = yaml.safe_load(secret['content'])
    env = render('/services/' + SERVICE + '/env-vars?limit=100')
    env = {v['envVar']['key']: v['envVar']['value'] for v in env}
    candidates = [env.get('MANAGEMENT_PASSWORD')]
    for field in ['management', 'remote-management']:
        block = config.get(field) or {}
        if isinstance(block, dict):
            candidates.append(block.get('secret-key'))
    candidates = list(dict.fromkeys(x for x in candidates if isinstance(x, str) and x and not x.startswith('$2')))
    management = None
    credentials = None
    for key in candidates:
        try:
            _, _, data = request(RENDER_ORIGIN + '/v8/management/credentials',
                                 headers={'Authorization': 'Bearer ' + key})
            credentials = json.loads(data)
            management = key
            break
        except RuntimeError:
            continue
    parent = active('leonmingod-home')
    entrance = active('leonmingod-free-token')
    live_source = source()
    original = (ROOT / 'src/site-original.js').read_text()
    normalize = lambda s: s.split('//# sourceMappingURL=')[0].strip()
    assert normalize(live_source) == normalize(original), 'Live parent source differs from backup'
    settings = cf('leonmingod-home/settings')
    keys = config.get('access', {}).get('api-keys', config.get('api-keys', []))
    assert isinstance(keys, list), 'Unknown client API key layout'
    files = credentials.get('files', []) if credentials is not None else None
    print('INSPECTED=' + json.dumps({
        'render_service': SERVICE, 'repo': service['repo'],
        'config_root_fields': sorted(config), 'client_key_count': len(keys),
        'management_api_available': management is not None,
        'credential_count': len(files) if files is not None else None,
        'credentials_response_fields': sorted(credentials) if credentials is not None else None,
        'environment_variable_names': sorted(env),
        'disk_present': bool(service.get('disk') or service['serviceDetails'].get('disk')),
        'parent_version': parent, 'entrance_version': entrance,
        'parent_source_sha256': hashlib.sha256(live_source.encode()).hexdigest(),
        'parent_matches_backup': True,
        'bindings': [{'name': b['name'], 'type': b['type']} for b in settings['bindings']],
    }))
    return service, secret, config, env, management, credentials, parent, entrance, live_source, settings


if __name__ == '__main__':
    inspect()
    if os.environ.get('CONNECTION_MODE', 'inspect') != 'inspect':
        raise RuntimeError('Connect mode requires the reviewed live configuration')
