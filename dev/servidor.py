"""Servidor local sin caché, para que el navegador siempre cargue la última versión.
Uso (desde la carpeta del proyecto): python dev/servidor.py   →   http://localhost:5500
"""
import functools
import http.server
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class SinCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', 5500), functools.partial(SinCache, directory=RAIZ)).serve_forever()
