#!/usr/bin/env python3
"""Same-origin visit counter and moderated guestbook service for zhouying.cn."""

import base64
import hmac
import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse


DATABASE_PATH = os.environ.get(
    "VISIT_COUNTER_DB", "/var/lib/zhouying-counter/visits.sqlite3"
)
LISTEN_HOST = os.environ.get("VISIT_COUNTER_HOST", "127.0.0.1")
LISTEN_PORT = int(os.environ.get("VISIT_COUNTER_PORT", "8766"))
ADMIN_PASSWORD = os.environ.get("GUESTBOOK_ADMIN_PASSWORD", "")


def connect():
    connection = sqlite3.connect(DATABASE_PATH, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute(
        "CREATE TABLE IF NOT EXISTS messages ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "name TEXT NOT NULL, content TEXT NOT NULL, "
        "status TEXT NOT NULL DEFAULT 'pending', "
        "created_at TEXT NOT NULL, reviewed_at TEXT)"
    )
    return connection


def increment_count():
    with connect() as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS counter "
            "(id INTEGER PRIMARY KEY CHECK (id = 1), value INTEGER NOT NULL)"
        )
        connection.execute("BEGIN IMMEDIATE")
        connection.execute("INSERT OR IGNORE INTO counter (id, value) VALUES (1, 0)")
        connection.execute("UPDATE counter SET value = value + 1 WHERE id = 1")
        row = connection.execute("SELECT value FROM counter WHERE id = 1").fetchone()
        connection.commit()
        return row[0]


def serialize_message(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "content": row["content"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }


class SiteAPIHandler(BaseHTTPRequestHandler):
    server_version = "ZhouYingSiteAPI/2.0"

    def send_json(self, status, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 8192:
            raise ValueError("invalid body")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def is_admin(self):
        if not ADMIN_PASSWORD:
            return False
        header = self.headers.get("Authorization", "")
        if not header.startswith("Basic "):
            return False
        try:
            decoded = base64.b64decode(header[6:], validate=True).decode("utf-8")
            _, password = decoded.split(":", 1)
        except (ValueError, UnicodeDecodeError):
            return False
        return hmac.compare_digest(password, ADMIN_PASSWORD)

    def require_admin(self):
        if self.is_admin():
            return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Guestbook Admin"')
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", "0")
        self.end_headers()
        return False

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/messages":
            with connect() as connection:
                rows = connection.execute(
                    "SELECT * FROM messages WHERE status = 'approved' "
                    "ORDER BY id DESC LIMIT 100"
                ).fetchall()
            self.send_json(200, {"messages": [serialize_message(row) for row in rows]})
            return

        if path == "/admin/messages":
            if not self.require_admin():
                return
            with connect() as connection:
                rows = connection.execute(
                    "SELECT * FROM messages ORDER BY id DESC LIMIT 200"
                ).fetchall()
            self.send_json(200, {"messages": [serialize_message(row) for row in rows]})
            return

        self.send_error(404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/visit":
            try:
                self.send_json(200, {"count": increment_count()})
            except Exception:
                self.send_error(500)
            return

        if path == "/messages":
            try:
                data = self.read_json()
                name = str(data.get("name", "")).strip()
                content = str(data.get("content", "")).strip()
                honeypot = str(data.get("website", "")).strip()
                if honeypot or not name or not content:
                    raise ValueError("missing fields")
                if len(name) > 30 or len(content) > 500:
                    raise ValueError("too long")
                created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
                with connect() as connection:
                    connection.execute(
                        "INSERT INTO messages (name, content, created_at) VALUES (?, ?, ?)",
                        (name, content, created_at),
                    )
                    connection.commit()
                self.send_json(201, {"ok": True, "message": "留言已提交，审核后会显示。"})
            except (ValueError, json.JSONDecodeError):
                self.send_json(400, {"ok": False, "message": "请填写昵称和留言（最多 500 字）。"})
            return

        if path.startswith("/admin/messages/"):
            if not self.require_admin():
                return
            parts = path.strip("/").split("/")
            if len(parts) != 4 or parts[3] not in ("approve", "reject"):
                self.send_error(404)
                return
            try:
                message_id = int(parts[2])
                status = "approved" if parts[3] == "approve" else "rejected"
                reviewed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
                with connect() as connection:
                    cursor = connection.execute(
                        "UPDATE messages SET status = ?, reviewed_at = ? WHERE id = ?",
                        (status, reviewed_at, message_id),
                    )
                    connection.commit()
                if cursor.rowcount == 0:
                    self.send_error(404)
                    return
                self.send_json(200, {"ok": True, "status": status})
            except ValueError:
                self.send_error(404)
            return

        self.send_error(404)

    def log_message(self, message_format, *args):
        print("%s - %s" % (self.address_string(), message_format % args))


if __name__ == "__main__":
    HTTPServer((LISTEN_HOST, LISTEN_PORT), SiteAPIHandler).serve_forever()
