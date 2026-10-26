"""Provision only this site's Turnstile widget and private operation signing key."""
import hashlib
import hmac
import json
import os
import yifu_key_api as api

base = 'https://api.cloudflare.com/client/v4/accounts/' + os.environ['CLOUDFLARE_ACCOUNT_ID'].strip() + '/challenges/widgets'
headers = {'Authorization': 'Bearer ' + os.environ['CLOUDFLARE_API_TOKEN'].strip()}
try:
    listing = json.loads(api.request(base, headers=headers)[2])
except RuntimeError as error:
    print('SECURITY_CAPABILITY=' + json.dumps({'turnstile_access': False, 'error': str(error), 'parent_version': api.active('leonmingod-home')}))
    raise
assert listing['success']
widgets = [w for w in listing['result'] if w['name'] == 'LeonMinGod free-token']
assert len(widgets) <= 1
if os.environ['SECURITY_MODE'] == 'setup':
    if not widgets:
        widget = json.loads(api.request(base, 'POST', {'name': 'LeonMinGod free-token', 'domains': ['leonmingod.com', 'www.leonmingod.com'], 'mode': 'managed'}, headers)[2])['result']
    else:
        widget = json.loads(api.request(base + '/' + widgets[0]['sitekey'], headers=headers)[2])['result']
    assert set(widget['domains']) == {'leonmingod.com', 'www.leonmingod.com'}
    signing = hmac.new(os.environ['RENDER_API_KEY'].strip().encode(), b'leonmingod-ops-probe-v1', hashlib.sha256).hexdigest()
    for name, value in [('FREE_TOKEN_TURNSTILE_SITEKEY', widget['sitekey']), ('FREE_TOKEN_TURNSTILE_SECRET', widget['secret']), ('FREE_TOKEN_OPS_SECRET', signing)]:
        api.cf('leonmingod-home/secrets', 'PUT', {'name': name, 'type': 'secret_text', 'text': value})
print('SECURITY_CAPABILITY=' + json.dumps({'turnstile_access': True, 'configured': os.environ['SECURITY_MODE'] == 'setup', 'parent_version': api.active('leonmingod-home'), 'entrance_version': api.active('leonmingod-free-token')}))
