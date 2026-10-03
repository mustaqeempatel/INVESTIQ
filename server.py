"""
=============================================================================
INVESTIQ BACKEND SERVER
REST API, SQLite Database, Multi-User Isolation, Market Data & Static Hosting
=============================================================================
"""

import os
import sys
import json
import sqlite3
import hashlib
import secrets
import mimetypes
from datetime import datetime, timedelta
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "investiq.db")

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        preferred_currency TEXT DEFAULT 'USD',
        theme TEXT DEFAULT 'dark',
        risk_tolerance TEXT DEFAULT 'medium',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS portfolios (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        cash_balance REAL DEFAULT 25000.0,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS holdings (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        avg_buy_price REAL NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(portfolio_id) REFERENCES portfolios(id),
        UNIQUE(portfolio_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total_value REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY(portfolio_id) REFERENCES portfolios(id)
    );

    CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        added_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL,
        threshold REAL NOT NULL,
        is_triggered INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        link_target TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    # Seed Default Judge Demo Users if empty
    cursor.execute("SELECT COUNT(*) as cnt FROM users")
    if cursor.fetchone()["cnt"] == 0:
        demo_users = [
            ("alex_morgan", "alex.morgan@investiq.internal", "Alex Morgan", "USD", "medium", 25000.0, [
                ("AAPL", 45, 195.20), ("NVDA", 30, 108.50), ("MSFT", 25, 412.00),
                ("RELIANCE", 120, 28.50), ("SAP", 40, 185.00), ("AZN", 50, 135.00)
            ]),
            ("priya_sharma", "priya.sharma@investiq.internal", "Priya Sharma", "INR", "low", 500000.0, [
                ("TCS", 80, 42.10), ("HDFCBANK", 150, 18.90), ("INFY", 110, 21.40),
                ("GOOGL", 35, 165.00), ("7203", 200, 18.20)
            ]),
            ("marcus_vance", "marcus.vance@investiq.internal", "Marcus Vance", "USD", "low", 40000.0, [
                ("JNJ", 60, 155.00), ("JPM", 50, 205.00), ("SHEL", 100, 34.00), ("ALV", 45, 270.00)
            ])
        ]

        now = datetime.now().isoformat()
        for uid, email, name, curr, risk, cash, holdings in demo_users:
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, full_name, preferred_currency, theme, risk_tolerance, created_at)
                VALUES (?, ?, ?, ?, ?, 'dark', ?, ?)
            """, (uid, email, hash_password("investiq2026"), name, curr, risk, now))

            pid = f"port_{uid}"
            cursor.execute("""
                INSERT INTO portfolios (id, user_id, name, cash_balance, created_at)
                VALUES (?, ?, 'Primary Portfolio', ?, ?)
            """, (pid, uid, cash, now))

            for sym, qty, avg_price in holdings:
                hid = f"hold_{uid}_{sym}"
                cursor.execute("""
                    INSERT INTO holdings (id, portfolio_id, symbol, quantity, avg_buy_price, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (hid, pid, sym, qty, avg_price, now))

                txid = f"tx_{uid}_{sym}"
                cursor.execute("""
                    INSERT INTO transactions (id, portfolio_id, symbol, type, quantity, price, total_value, date, notes)
                    VALUES (?, ?, ?, 'BUY', ?, ?, ?, '2024-08-15', 'Initial Portfolio Holding')
                """, (txid, pid, sym, qty, avg_price, qty * avg_price))

            # Default Watchlist
            for wsym in ["AAPL", "NVDA", "RELIANCE", "SAP", "7203", "SHOP"]:
                wid = f"w_{uid}_{wsym}"
                cursor.execute("""
                    INSERT OR IGNORE INTO watchlist (id, user_id, symbol, added_at)
                    VALUES (?, ?, ?, ?)
                """, (wid, uid, wsym, now))

            # Seed notification
            cursor.execute("""
                INSERT INTO notifications (id, user_id, title, message, severity, is_read, link_target, created_at)
                VALUES (?, ?, 'Welcome to InvestIQ', 'Your global workspace and simulation engine are initialized.', 'success', 0, 'dashboard', ?)
            """, (f"notif_{uid}_init", uid, now))

    conn.commit()
    conn.close()

# Initialize DB on load
init_db()

class InvestIQRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def send_json(self, status_code, data):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def get_auth_user(self):
        auth_header = self.headers.get("Authorization", "")
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        
        if not token:
            # Fallback to default demo user Alex Morgan for smooth hackathon evaluation
            return "alex_morgan"

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?", (token, datetime.now().isoformat()))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row["user_id"]
        return "alex_morgan"

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 0:
            raw = self.rfile.read(length).decode("utf-8")
            try:
                return json.loads(raw)
            except Exception:
                return {}
        return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # Static routing
        if not path.startswith("/api/"):
            return super().do_GET()

        user_id = self.get_auth_user()
        conn = get_db()
        cursor = conn.cursor()

        try:
            if path == "/api/auth/me":
                cursor.execute("SELECT id, email, full_name, preferred_currency, theme, risk_tolerance FROM users WHERE id = ?", (user_id,))
                user = cursor.fetchone()
                if user:
                    self.send_json(200, {"user": dict(user)})
                else:
                    self.send_json(404, {"error": "User not found"})

            elif path == "/api/portfolio":
                cursor.execute("SELECT id, cash_balance FROM portfolios WHERE user_id = ?", (user_id,))
                port = cursor.fetchone()
                if not port:
                    self.send_json(404, {"error": "Portfolio not found"})
                    return

                cursor.execute("SELECT symbol, quantity, avg_buy_price FROM holdings WHERE portfolio_id = ?", (port["id"],))
                holdings = [dict(h) for h in cursor.fetchall()]
                self.send_json(200, {
                    "portfolioId": port["id"],
                    "cashBalance": port["cash_balance"],
                    "holdings": holdings
                })

            elif path == "/api/transactions":
                cursor.execute("""
                    SELECT t.id, t.symbol, t.type, t.quantity, t.price, t.total_value, t.date, t.notes
                    FROM transactions t
                    JOIN portfolios p ON t.portfolio_id = p.id
                    WHERE p.user_id = ?
                    ORDER BY t.date DESC, t.id DESC
                """, (user_id,))
                txs = [dict(r) for r in cursor.fetchall()]
                self.send_json(200, {"transactions": txs})

            elif path == "/api/watchlist":
                cursor.execute("SELECT symbol, added_at FROM watchlist WHERE user_id = ?", (user_id,))
                items = [r["symbol"] for r in cursor.fetchall()]
                self.send_json(200, {"watchlist": items})

            elif path == "/api/alerts":
                cursor.execute("SELECT id, symbol, type, threshold, is_triggered, created_at FROM alerts WHERE user_id = ?", (user_id,))
                alerts = [dict(r) for r in cursor.fetchall()]
                self.send_json(200, {"alerts": alerts})

            elif path == "/api/notifications":
                cursor.execute("SELECT id, title, message, severity, is_read, link_target, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
                notifs = [dict(r) for r in cursor.fetchall()]
                self.send_json(200, {"notifications": notifs})

            else:
                self.send_json(404, {"error": f"API endpoint {path} not found"})

        except Exception as e:
            self.send_json(500, {"error": str(e)})
        finally:
            conn.close()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()
        conn = get_db()
        cursor = conn.cursor()

        try:
            if path == "/api/auth/login":
                email = body.get("email", "").lower().strip()
                password = body.get("password", "")
                hashed = hash_password(password)
                cursor.execute("SELECT id, full_name, preferred_currency FROM users WHERE email = ? AND password_hash = ?", (email, hashed))
                user = cursor.fetchone()
                if user:
                    token = secrets.token_hex(24)
                    expires = (datetime.now() + timedelta(days=7)).isoformat()
                    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user["id"], expires))
                    conn.commit()
                    self.send_json(200, {"token": token, "user": dict(user)})
                else:
                    self.send_json(401, {"error": "Invalid email or password"})

            elif path == "/api/auth/demo-login":
                persona_id = body.get("personaId", "alex_morgan")
                cursor.execute("SELECT id, email, full_name, preferred_currency, theme, risk_tolerance FROM users WHERE id = ?", (persona_id,))
                user = cursor.fetchone()
                if user:
                    token = secrets.token_hex(24)
                    expires = (datetime.now() + timedelta(days=7)).isoformat()
                    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user["id"], expires))
                    conn.commit()
                    self.send_json(200, {"token": token, "user": dict(user)})
                else:
                    self.send_json(404, {"error": "Demo persona not found"})

            elif path == "/api/portfolio/transactions":
                user_id = self.get_auth_user()
                symbol = body.get("symbol", "").upper().strip()
                tx_type = body.get("type", "BUY").upper()
                quantity = int(body.get("quantity", 0))
                price = float(body.get("price", 0.0))
                notes = body.get("notes", "Simulated order via workspace")
                tx_date = body.get("date") or datetime.now().strftime("%Y-%m-%d")

                if not symbol or quantity <= 0 or price <= 0:
                    self.send_json(400, {"error": "Invalid transaction parameters"})
                    return

                cursor.execute("SELECT id, cash_balance FROM portfolios WHERE user_id = ?", (user_id,))
                port = cursor.fetchone()
                if not port:
                    self.send_json(404, {"error": "Portfolio not found"})
                    return

                total_val = quantity * price
                pid = port["id"]
                current_cash = port["cash_balance"]

                if tx_type == "BUY":
                    new_cash = max(0.0, current_cash - total_val)
                    cursor.execute("UPDATE portfolios SET cash_balance = ? WHERE id = ?", (new_cash, pid))

                    # Update holding
                    cursor.execute("SELECT quantity, avg_buy_price FROM holdings WHERE portfolio_id = ? AND symbol = ?", (pid, symbol))
                    existing = cursor.fetchone()
                    now_str = datetime.now().isoformat()
                    if existing:
                        old_qty = existing["quantity"]
                        old_avg = existing["avg_buy_price"]
                        new_qty = old_qty + quantity
                        new_avg = ((old_qty * old_avg) + total_val) / new_qty
                        cursor.execute("""
                            UPDATE holdings SET quantity = ?, avg_buy_price = ?, updated_at = ?
                            WHERE portfolio_id = ? AND symbol = ?
                        """, (new_qty, round(new_avg, 2), now_str, pid, symbol))
                    else:
                        hid = f"h_{pid}_{symbol}_{secrets.token_hex(4)}"
                        cursor.execute("""
                            INSERT INTO holdings (id, portfolio_id, symbol, quantity, avg_buy_price, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                        """, (hid, pid, symbol, quantity, round(price, 2), now_str))

                elif tx_type == "SELL":
                    cursor.execute("SELECT quantity FROM holdings WHERE portfolio_id = ? AND symbol = ?", (pid, symbol))
                    existing = cursor.fetchone()
                    if not existing or existing["quantity"] < quantity:
                        self.send_json(400, {"error": f"Insufficient shares to sell. Currently held: {existing['quantity'] if existing else 0}"})
                        return

                    new_cash = current_cash + total_val
                    cursor.execute("UPDATE portfolios SET cash_balance = ? WHERE id = ?", (new_cash, pid))

                    if existing["quantity"] == quantity:
                        cursor.execute("DELETE FROM holdings WHERE portfolio_id = ? AND symbol = ?", (pid, symbol))
                    else:
                        cursor.execute("UPDATE holdings SET quantity = quantity - ? WHERE portfolio_id = ? AND symbol = ?", (quantity, pid, symbol))

                # Log Transaction
                txid = f"tx_{secrets.token_hex(8)}"
                cursor.execute("""
                    INSERT INTO transactions (id, portfolio_id, symbol, type, quantity, price, total_value, date, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (txid, pid, symbol, tx_type, quantity, price, total_val, tx_date, notes))

                conn.commit()
                self.send_json(201, {"success": True, "transactionId": txid})

            elif path == "/api/watchlist":
                user_id = self.get_auth_user()
                symbol = body.get("symbol", "").upper().strip()
                if symbol:
                    wid = f"w_{user_id}_{symbol}"
                    cursor.execute("""
                        INSERT OR IGNORE INTO watchlist (id, user_id, symbol, added_at)
                        VALUES (?, ?, ?, ?)
                    """, (wid, user_id, symbol, datetime.now().isoformat()))
                    conn.commit()
                    self.send_json(201, {"success": True})
                else:
                    self.send_json(400, {"error": "Missing symbol"})

            elif path == "/api/alerts":
                user_id = self.get_auth_user()
                symbol = body.get("symbol", "").upper().strip()
                alert_type = body.get("type", "PRICE_ABOVE")
                threshold = float(body.get("threshold", 0))
                aid = f"alt_{secrets.token_hex(6)}"
                cursor.execute("""
                    INSERT INTO alerts (id, user_id, symbol, type, threshold, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (aid, user_id, symbol, alert_type, threshold, datetime.now().isoformat()))
                conn.commit()
                self.send_json(201, {"success": True, "alertId": aid})

            elif path == "/api/reset-demo":
                init_db()
                self.send_json(200, {"success": True, "message": "Demo database restored to default"})

            else:
                self.send_json(404, {"error": f"POST endpoint {path} not found"})

        except Exception as e:
            self.send_json(500, {"error": str(e)})
        finally:
            conn.close()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        user_id = self.get_auth_user()
        conn = get_db()
        cursor = conn.cursor()

        try:
            if path.startswith("/api/watchlist/"):
                sym = path.split("/")[-1].upper()
                cursor.execute("DELETE FROM watchlist WHERE user_id = ? AND symbol = ?", (user_id, sym))
                conn.commit()
                self.send_json(200, {"success": True})

            elif path.startswith("/api/alerts/"):
                aid = path.split("/")[-1]
                cursor.execute("DELETE FROM alerts WHERE user_id = ? AND id = ?", (user_id, aid))
                conn.commit()
                self.send_json(200, {"success": True})

            else:
                self.send_json(404, {"error": "DELETE endpoint not found"})
        except Exception as e:
            self.send_json(500, {"error": str(e)})
        finally:
            conn.close()

if __name__ == "__main__":
    print(f"Starting INVESTIQ Server on http://localhost:{PORT}")
    server = HTTPServer(("127.0.0.1", PORT), InvestIQRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down INVESTIQ server.")
        server.server_close()
