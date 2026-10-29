"""Read-only quota contract audit; output only aggregate/public-safe fields."""
import json
import yaml
import yifu_key_api as api

before = api.latest_deploy()['id']
values = {row['envVar']['key']: row['envVar']['value'] for row in api.render('/services/' + api.SERVICE + '/env-vars?limit=100')}
key = values.get('MANAGEMENT_PASSWORD')
if not key:
    config = yaml.safe_load(api.render('/services/' + api.SERVICE + '/secret-files/config.yaml')['content'])
    key = next((config.get(name, {}).get('secret-key') for name in ['management', 'remote-management'] if isinstance(config.get(name), dict) and config[name].get('secret-key')), None)
assert isinstance(key, str) and key and not key.startswith('$2'), 'No available management credential'
print('::add-mask::' + key)
files = json.loads(api.management_request(key, 'credentials'))['files']
result = {'accounts': len(files), 'fields': sorted(set().union(*(set(f) for f in files))), 'providers': sorted({f.get('provider', f.get('type', 'unknown')) for f in files})}
account = next((f for f in files if f.get('provider', f.get('type')) == 'codex' and not f.get('disabled') and f.get('status') == 'active'), None)
if account:
    result['observed_signal_keys'] = sorted((account.get('quota') or {}).get('signals', {}))
    headers = {'Authorization': 'Bearer $TOKEN$', 'Accept': 'application/json'}
    account_id = (account.get('id_token') or {}).get('chatgpt_account_id')
    if account_id:
        headers['Chatgpt-Account-Id'] = account_id
    response = json.loads(api.management_request(key, 'requests/api-call', 'POST', {'auth_index': account['auth_index'], 'method': 'GET', 'url': 'https://chatgpt.com/backend-api/wham/usage', 'header': headers}))
    result['quota_http'] = response.get('status_code')
    if result['quota_http'] == 200:
        body = json.loads(response['body'])
        result['quota_fields'] = sorted(body)
        result['plan_type'] = body.get('plan_type')
        rate = body.get('rate_limit') or {}
        result['windows'] = {k: {field: v.get(field) for field in ['used_percent', 'limit_window_seconds', 'reset_at', 'reset_after_seconds']} for k, v in rate.items() if k in ['primary_window', 'secondary_window'] and isinstance(v, dict)}
        credits = body.get('credits') or {}
        result['credits'] = {k: credits.get(k) for k in ['balance', 'unlimited', 'has_credits']}
assert before == api.latest_deploy()['id'], 'Deployment changed during read-only audit'
print('POOL_AUDIT=' + json.dumps(result, ensure_ascii=False))
