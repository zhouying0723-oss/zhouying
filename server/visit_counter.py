#!/usr/bin/env python3
"""Tiny same-origin visit counter service for zhouying.cn."""

import json
import os
import sqlite3
from http.server import BaseHTTPRequestHandler, HTTPServer


DATABASE_PATH = os.environ.get(
    "VISIT_COUNTER_DB", "/var/lib/zhouying-counter/visits.sqlite3"
)
LISTEN_HOST = os.environ.get("VISIT_COUNTER_HOST", "127.0.0.1")
LISTEN_PORT = int(os.environ.get("VISIT_COUNTER_PORT", "8766"))


def increment_count():
    with sqlite3.connect(DATABASE_PATH, timeout=5) as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS counter "
            "(id INTEGER PRIMARY KEY CHECK (id = 1), value INTEGER NOT NULL)"
        )
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(
            "INSERT OR IGNORE INTO counter (id, value) VALUES (1, 0)"
        )
        connection.execute("UPDATE counter SET value = value + 1 WHERE id = 1")
        row = connection.execute(
            "SELECT value FROM counter WHERE id = 1"
        ).fetchone()
        connection.commit()
        return row[0]


class VisitHandler(BaseHTTPRequestHandler):
    server_version = "ZhouYingVisitCounter/1.0"

    def do_POST(self):
        if self.path != "/visit":
            self.send_error(404)
            return

        try:
            count = increment_count()
        except Exception:
            self.send_error(500)
            return

        payload = json.dumps({"count": count}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        self.send_error(405)

    def log_message(self, message_format, *args):
        print("%s - %s" % (self.address_string(), message_format % args))


if __name__ == "__main__":
    HTTPServer((LISTEN_HOST, LISTEN_PORT), VisitHandler).serve_forever()
