"""Provision only this site's Turnstile widget and private operation signing key."""
import hashlib
import hmac
import json
import os
import secrets
import time
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

if os.environ['SECURITY_MODE'] == 'verify-pass':
    # Owner-authorized protocol QA: sign a temporary pass in runner memory using
    # the existing widget Secret. This does not automate a human challenge or add
    # a public bypass. Never output the Secret, cookies, response key or raw body.
    assert len(widgets) == 1
    widget = json.loads(api.request(base + '/' + widgets[0]['sitekey'], headers=headers)[2])['result']
    ua = 'LeonMinGod human-pass release verification'
    def cookie(issued):
        payload = 'v1.' + str(issued) + '.' + secrets.token_hex(16)
        message = 'lmg-human-pass-v1\nleonmingod.com\n' + hashlib.sha256(ua.encode()).hexdigest() + '\n' + payload
        signature = hmac.new(widget['secret'].encode(), message.encode(), hashlib.sha256).hexdigest()
        return '__Secure-lmg_human=' + payload + '.' + signature
    now = int(time.time())
    valid, expired = cookie(now), cookie(now - 7201)
    results = []
    reference = api.site_claim()
    for origin in [api.ORIGIN, 'https://www.leonmingod.com']:
        browser = {'User-Agent': ua, 'Cookie': valid, 'Origin': origin}
        config = json.loads(api.request(origin + '/api/free-token/security', headers=browser)[2])
        assert config['required'] is False and config['verifiedUntil'] == (now + 7200) * 1000
        for _ in range(2):
            status, response_headers, body = api.request(origin + '/api/free-token/game/start', 'POST', {}, browser)
            assert status == 200 and json.loads(body)['protocol'] == 'live-v1'
            assert not any('__Secure-lmg_human=' in value for value in response_headers.get_all('Set-Cookie', [])), 'Trust expiry must not roll'
        reward = json.loads(api.request(origin + '/api/free-token/claim', 'POST', {'oath': '义父', 'confirmed': True}, browser)[2])
        assert reward == reference
        for invalid in ['', expired, valid + '0']:
            try:
                api.request(origin + '/api/free-token/game/start', 'POST', {}, {**browser, 'Cookie': invalid})
            except RuntimeError as error:
                assert str(error).endswith('HTTP 403')
            else:
                raise AssertionError('Invalid browser pass accepted')
        results.append({'origin': origin, 'trusted_config': True, 'repeat_starts_http': [200, 200], 'same_reward': True, 'invalid_expired_missing_http': 403, 'fixed_expiry': True})
    print('HUMAN_PASS_VERIFIED=' + json.dumps({'scope': 'Owner-signed temporary pass; not an automated human challenge', 'results': results}))
