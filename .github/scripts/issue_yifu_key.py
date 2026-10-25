"""Inspect or issue a Render client key and publish it through the Yifu Token site."""
from email.parser import BytesParser
import email.policy
import hashlib
import json
import os

import yaml

import free_token_render as api


def module_manifest():
    _, headers, body = api.cf('leonmingod-home', raw=True)
    content_type = headers.get('Content-Type', '')
    modules = {}
    if 'multipart/' in content_type:
        message = BytesParser(policy=email.policy.default).parsebytes(
            ('Content-Type: ' + content_type + '\r\n\r\n').encode() + body)
        for part in message.iter_parts():
            name = part.get_filename() or part.get_param('name', header='Content-Disposition')
            if name == 'metadata':
                continue
            assert name and name not in modules, 'Unexpected Worker module names'
            modules[name] = hashlib.sha256(part.get_payload(decode=True)).hexdigest()
    else:
        modules['script'] = hashlib.sha256(body).hexdigest()
    assert modules, 'No Worker modules returned'
    return {'entrypoint': headers.get('cf-entrypoint'), 'modules': modules}


def inspect():
    for name in ['RENDER_API_KEY', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN']:
        if not os.environ.get(name, '').strip():
            raise RuntimeError('Missing GitHub Actions secret: ' + name)
    service = api.render('/services/' + api.SERVICE)
    assert service['ownerId'] == api.WORKSPACE
    assert service['repo'] == 'https://github.com/928886540/cpa' and service['branch'] == 'main'
    assert service['serviceDetails']['envSpecificDetails']['dockerCommand'] == './CLIProxyAPI --config /etc/secrets/config.yaml'
    secret = api.render('/services/' + api.SERVICE + '/secret-files/config.yaml')
    config = yaml.safe_load(secret['content'])
    keys = config.get('access', {}).get('api-keys', config.get('api-keys'))
    assert isinstance(keys, list) and all(isinstance(key, str) for key in keys)
    env = {v['envVar']['key']: v['envVar']['value'] for v in api.render('/services/' + api.SERVICE + '/env-vars?limit=100')}
    candidates = [env.get('MANAGEMENT_PASSWORD')]
    for field in ['management', 'remote-management']:
        block = config.get(field) or {}
        if isinstance(block, dict):
            candidates.append(block.get('secret-key'))
    candidates = list(dict.fromkeys(key for key in candidates if isinstance(key, str) and key and not key.startswith('$2')))
    management = None
    credentials = None
    for key in candidates:
        try:
            credentials = json.loads(api.management_request(key, 'credentials'))
            management = key
            break
        except RuntimeError:
            continue
    state = dict(service=service, secret=secret, config=config, keys=keys, env=env,
                 management=management, credentials=credentials,
                 parent=api.active('leonmingod-home'), entrance=api.active('leonmingod-free-token'),
                 modules=module_manifest(), settings=api.cf('leonmingod-home/settings'),
                 deploy=api.latest_deploy(), claim=api.claim())
    print('YIFU_INSPECTED=' + json.dumps({
        'render_service': api.SERVICE, 'render_deploy': state['deploy']['id'],
        'render_status': state['deploy']['status'], 'render_commit': state['deploy'].get('commit', {}).get('id'),
        'client_key_count': len(keys), 'credential_count': len(credentials['files']) if credentials else None,
        'management_available': management is not None,
        'parent_version': state['parent'], 'entrance_version': state['entrance'],
        'module_manifest': state['modules'],
        'bindings': [{'name': b['name'], 'type': b['type']} for b in state['settings']['bindings']],
        'claim_base_url': state['claim'].get('baseUrl'), 'claim_key_present': bool(state['claim'].get('apiKey')),
    }), flush=True)
    return state


if __name__ == '__main__':
    try:
        state = inspect()
        if os.environ.get('YIFU_MODE', 'inspect') != 'inspect':
            raise RuntimeError('Issuance requires the reviewed live state')
    except yaml.YAMLError:
        raise RuntimeError('Invalid YAML; configuration details suppressed') from None
