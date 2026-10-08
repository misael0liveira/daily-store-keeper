"""Serve built assets with the same known-route SPA fallback as Capacitor.

Missing assets still return 404; no application API or test data is fabricated.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path.rstrip("/") in {
            "", "/vender", "/estoque", "/mais", "/vendas", "/vendas/configuracoes", "/codigos", "/gestao", "/resumo"
        }:
            self.path = "/index.html"
        super().do_GET()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 4173), partial(PreviewHandler, directory="dist/client")).serve_forever()
