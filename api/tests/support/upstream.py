"""Local stand-ins for the HTTP services the worker calls.

One server answers for Discord's package links (`click.discord.com`, which
redirects to a signed storage URL) and the internal webhook, and records what
it receives.
"""
import hashlib
import socketserver
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit


def make_upn(name):
    """A UPN as long as Discord's, derived from `name` so package ids are stable."""
    filler = hashlib.sha256(name.encode()).hexdigest() * 10
    return f'synthetic-{name}-{filler}'[:600]


def package_id(upn):
    return hashlib.md5(upn.encode()).hexdigest()


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

    def discord_link(self, name, body):
        """Serve `body` behind a Discord-style link. Returns `(link, upn)`."""
        upn = make_upn(name)
        path = f'/storage/{name}.zip'
        self.files[path] = body
        self.click_targets[upn] = path
        return f'https://click.discord.com/ls/click?upn={upn}', upn

    def calls(self):
        """`(method, path)` of what was received, webhooks left out."""
        return [(method, path) for method, path in self.received if path != '/webhook']

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
            return 200, {'Content-Type': 'application/octet-stream'}, self.files[path]
        if path == '/webhook' and method == 'POST':
            return 204, {}, b''
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
        # Read the body even unused, or closing the connection could reset it.
        length = int(self.headers.get('Content-Length') or 0)
        if length:
            self.rfile.read(length)
        url = urlsplit(self.path)
        upstream._record((self.command, url.path))
        status, headers, payload = upstream.respond(self.command, url.path, parse_qs(url.query))
        self.send_response(status)
        for name, value in headers.items():
            self.send_header(name, value)
        if status != 204:
            self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        if send_body and payload:
            self.wfile.write(payload)


class RoutedRequests:
    """Stands in for `requests` inside `tasks`.

    Same calls, same library underneath, but links to `click.discord.com` are
    answered by the local upstream.
    """

    def __init__(self, requests, base):
        self._requests = requests
        self._routes = (
            ('https://click.discord.com/', f'{base}/click/'),
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
