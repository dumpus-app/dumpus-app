"""Local stand-ins for every HTTP service the API calls.

One server answers for Discord's package links (`click.discord.com`, which
redirects to a signed storage URL), the internal webhook, diswho, and the
Discord API, and records everything it receives.
"""
import hashlib
import json
import socketserver
import threading
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

EXPIRED_BODY = (
    b"<?xml version='1.0' encoding='UTF-8'?><Error><Code>ExpiredToken</Code>"
    b'<Message>The provided token has expired.</Message></Error>'
)


def make_upn(name):
    """A UPN as long as Discord's, derived from `name` so package ids are stable."""
    filler = hashlib.sha256(name.encode()).hexdigest() * 10
    return f'synthetic-{name}-{filler}'[:600]


def package_id(upn):
    return hashlib.md5(upn.encode()).hexdigest()


@dataclass
class Received:
    method: str
    path: str
    query: dict
    headers: dict
    body: bytes

    def json(self):
        return json.loads(self.body)


class Upstream:
    def __init__(self):
        self._server = _Server(('127.0.0.1', 0), _Handler)
        self._server.upstream = self
        self.base = f'http://127.0.0.1:{self._server.server_port}'
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._lock = threading.Lock()
        self.reset()

    def start(self):
        self._thread.start()
        return self

    def stop(self):
        self._server.shutdown()
        self._server.server_close()

    def reset(self):
        self.files = {}
        self.click_targets = {}
        self.received = []
        self.users = {}
        self.guilds = {}

    def discord_link(self, name, body, *, status=200, content_type='application/octet-stream'):
        """Serve `body` behind a Discord-style link. Returns `(link, upn)`."""
        upn = make_upn(name)
        path = f'/storage/{name}.zip'
        self.files[path] = (status, content_type, body)
        self.click_targets[upn] = path
        return f'https://click.discord.com/ls/click?upn={upn}', upn

    def whitelisted_link(self, name, body, *, status=200, content_type='application/octet-stream'):
        path = f'/whitelisted/{name}.zip'
        self.files[path] = (status, content_type, body)
        return self.base + path

    def expire(self, name):
        """What storage answers once a link's signature has expired."""
        self.files[f'/storage/{name}.zip'] = (400, 'application/xml; charset=UTF-8', EXPIRED_BODY)

    @property
    def webhooks(self):
        return [r.json() for r in self.received if r.method == 'POST' and r.path == '/webhook']

    def calls(self, prefix=''):
        """`(method, path)` of what was received under `prefix`, webhooks left out."""
        return [(r.method, r.path) for r in self.received if r.path.startswith(prefix) and r.path != '/webhook']

    def _record(self, received):
        with self._lock:
            self.received.append(received)

    def respond(self, method, path, query):
        if path == '/click/ls/click':
            target = self.click_targets.get(query.get('upn', [''])[0])
            if not target:
                return 404, {'Content-Type': 'text/html'}, b'<html>Not Found</html>'
            return 302, {'Location': f'{self.base}{target}?X-Goog-Signature=synthetic'}, b''
        if path in self.files:
            status, content_type, body = self.files[path]
            return status, {'Content-Type': content_type}, body
        if path == '/webhook' and method == 'POST':
            return 204, {}, b''
        for prefix, table in (
            ('/diswho/user/', self.users),
            ('/discord/api/v8/users//', self.users),
            ('/discord/api/v10/guilds/', self.guilds),
        ):
            if path.startswith(prefix):
                status, payload = table.get(path[len(prefix):], (404, {'message': 'Unknown', 'code': 10013}))
                return status, {'Content-Type': 'application/json'}, json.dumps(payload).encode()
        return 404, {'Content-Type': 'text/html'}, b'<html>Not Found</html>'


class _Server(ThreadingHTTPServer):
    daemon_threads = True

    def server_bind(self):
        # `HTTPServer.server_bind` resolves the host name, a DNS lookup the
        # network guard refuses.
        socketserver.TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address[:2]


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_HEAD(self):
        self._serve(send_body=False)

    def do_GET(self):
        self._serve()

    def do_POST(self):
        self._serve()

    def _serve(self, send_body=True):
        upstream = self.server.upstream
        length = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(length) if length else b''
        url = urlsplit(self.path)
        query = parse_qs(url.query)
        upstream._record(Received(self.command, url.path, query, dict(self.headers), body))
        status, headers, payload = upstream.respond(self.command, url.path, query)
        self.send_response(status)
        for name, value in headers.items():
            self.send_header(name, value)
        if status != 204:
            self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        if send_body and payload:
            self.wfile.write(payload)


class RoutedRequests:
    """Stands in for `requests` inside `tasks` and `util`.

    Same calls, same library underneath, but the Discord hosts those modules
    hard-code are answered by the local upstream.
    """

    def __init__(self, requests, base):
        self._requests = requests
        self._routes = (
            ('https://click.discord.com/', f'{base}/click/'),
            ('https://discord.com/', f'{base}/discord/'),
        )

    def __getattr__(self, name):
        return getattr(self._requests, name)

    def _route(self, url):
        for prefix, local in self._routes:
            if url.startswith(prefix):
                return local + url[len(prefix):]
        return url

    def get(self, url, *args, **kwargs):
        return self._requests.get(self._route(url), *args, **kwargs)

    def head(self, url, *args, **kwargs):
        return self._requests.head(self._route(url), *args, **kwargs)

    def post(self, url, *args, **kwargs):
        return self._requests.post(self._route(url), *args, **kwargs)
