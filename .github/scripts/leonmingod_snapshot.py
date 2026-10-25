"""Read-only production source recovery; never reads secret values."""
from email.parser import BytesParser
import email.policy
import hashlib
import json
from pathlib import Path

import yifu_key_api as api

root = Path('leonmingod-snapshot')
root.mkdir(exist_ok=True)
summary = {}
for worker in ['leonmingod-home', 'leonmingod-free-token']:
    folder = root / worker
    folder.mkdir(exist_ok=True)
    version = api.active(worker)
    settings = api.cf(worker + '/settings')
    _, headers, body = api.cf(worker, raw=True)
    content_type = headers.get('Content-Type', '')
    files = {}
    if 'multipart/' in content_type:
        message = BytesParser(policy=email.policy.default).parsebytes(
            ('Content-Type: ' + content_type + '\r\n\r\n').encode() + body)
        for part in message.iter_parts():
            name = part.get_filename() or part.get_param('name', header='Content-Disposition')
            if name == 'metadata':
                continue
            assert name and Path(name).name == name and name not in files
            payload = part.get_payload(decode=True)
            (folder / name).write_bytes(payload)
            files[name] = hashlib.sha256(payload).hexdigest()
    else:
        (folder / 'index.js').write_bytes(body)
        files['index.js'] = hashlib.sha256(body).hexdigest()
    assert api.active(worker) == version, 'Deployment changed during snapshot'
    # Secret bindings contain names/types only. Do not retain arbitrary secret fields.
    for binding in settings.get('bindings', []):
        if binding.get('type') == 'secret_text':
            assert 'text' not in binding, 'Unexpected secret value in settings response'
    (folder / 'settings.json').write_text(json.dumps(settings, indent=2))
    summary[worker] = {'version': version, 'modules': files}
summary['routes'] = json.loads(api.request(
    'https://api.cloudflare.com/client/v4/zones/4f078f06b815a404337c3b5387c45275/workers/routes',
    headers={'Authorization': 'Bearer ' + __import__('os').environ['CLOUDFLARE_API_TOKEN'].strip()})[2])['result']
(root / 'snapshot.json').write_text(json.dumps(summary, indent=2))
print('WEBSITE_SNAPSHOT=' + json.dumps(summary))
