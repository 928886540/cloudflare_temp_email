"""Restore OAuth before readiness, preserving live key traffic and all guard policy."""
import json
from datetime import datetime, timezone
import os
from pathlib import Path
import threading
import time
import urllib.parse
import urllib.request
import urllib.error

import cpa_abuse_guard as guard
import yifu_key_api as api
import yifu_keys


def main():
    expected = os.environ['CPA_EXPECTED_COMMIT'].strip()
    assert len(expected) == 40 and all(c in '0123456789abcdef' for c in expected)
    assert guard.service()['autoDeploy'] == 'no', 'Hold auto-deploy before pushing CPA main'
    state = yifu_keys.read_state()
    credentials = guard.download_credentials(state)
    guard.seal_backup(state, credentials)
    snapshot = {'schema': 1, 'files': [{'name': file['name'], 'content': json.loads(credentials[file['name']]),
        'disabled': bool(file.get('disabled'))} for file in state['files']]}
    assert len(snapshot['files']) == len(credentials) and credentials
    name = 'cpa-oauth-bootstrap.json'
    content = json.dumps(snapshot, separators=(',', ':'))
    api.render('/services/' + api.SERVICE + '/secret-files/' + name, 'PUT', {'content': content})
    assert api.render('/services/' + api.SERVICE + '/secret-files/' + name)['content'] == content
    path = '/etc/secrets/' + name
    api.render('/services/' + api.SERVICE + '/env-vars/CPA_OAUTH_BOOTSTRAP_FILE', 'PUT', {'value': path})
    assert api.render('/services/' + api.SERVICE + '/secret-files/config.yaml')['content'] == state['secret']['content']

    samples = []
    stopped = threading.Event()

    def monitor():
        while not stopped.is_set():
            for index, key in enumerate(state['keys']):
                if stopped.is_set():
                    break
                try:
                    count = api.models(key)
                    samples.append({'key_index': index, 'http': 200, 'models': count, 'at': datetime.now(timezone.utc).isoformat()})
                except Exception as error:
                    # API helper errors contain only path/status, never keys or bodies.
                    samples.append({'key_index': index, 'http': 'failed', 'at': datetime.now(timezone.utc).isoformat(),
                        'error_type': type(error).__name__, 'reason': str(error)[:180] if isinstance(error, RuntimeError) else type(error).__name__})
            stopped.wait(3)

    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()
    try:
        deploy = api.render('/services/' + api.SERVICE + '/deploys', 'POST', {'commitId': expected})
        guard.wait_deploy(deploy['id'], expected)
        files = json.loads(api.management_request(state['management'], 'credentials'))['files']
        current = {file['name']: file for file in files}
        assert {file['name'] for file in state['files']} <= set(current), 'Pool was incomplete at cutover'
        assert all(bool(current[file['name']].get('disabled')) == bool(file.get('disabled')) for file in state['files'])
        guard.verify_client_keys(state)
        assert api.request(api.RENDER_ORIGIN + '/healthz')[0] == 200
        target = os.environ.get('CPA_GUARD_IP', '').strip()
        if target:
            response = json.loads(api.management_request(state['management'], 'security/login-attempts', 'DELETE', {'ip': target}))
            assert response.get('cleared') is True
        current_env = {row['envVar']['key']: row['envVar']['value'] for row in api.render('/services/' + api.SERVICE + '/env-vars?limit=100')}
        assert all(current_env.get(key) == value for key, value in state['env'].items())
        assert current_env['CPA_OAUTH_BOOTSTRAP_FILE'] == path
        assert api.active('leonmingod-home') == state['parent']
        result = {'deploy': deploy['id'], 'commit': expected, 'credentials_retained': len(state['files']),
            'static_keys_retained': len(state['keys']), 'bootstrap_before_readiness': True,
            'guard_policy_unchanged': True, 'website_unchanged': True, 'auto_deploy': 'no',
            'management_ip_cleared': bool(target)}
    finally:
        stopped.set()
        thread.join(timeout=60)
        report = {'samples': len(samples), 'failures': sum(row['http'] != 200 for row in samples),
            'keys_checked': len(state['keys'])}
        Path('cpa-abuse-rollout').mkdir(exist_ok=True)
        Path('cpa-abuse-rollout/model-traffic-verification.json').write_text(json.dumps(report, indent=2))
        Path('cpa-abuse-rollout/model-traffic-samples.json').write_text(json.dumps(samples, indent=2))
        print('CPA_LIVE_TRAFFIC_MONITOR=' + json.dumps(report), flush=True)
    assert not report['failures'], 'Live key requests failed during monitored cutover'
    print('CPA_SAFE_MANAGEMENT_DEPLOY=' + json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
