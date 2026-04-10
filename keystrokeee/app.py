from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect("keystroke.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            pattern TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            timestamp TEXT,
            status TEXT,
            risk TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data["username"]
    pattern = json.dumps(data["pattern"])

    conn = sqlite3.connect("keystroke.db")
    cursor = conn.cursor()

    cursor.execute(
        "INSERT OR REPLACE INTO users (username, pattern) VALUES (?, ?)",
        (username, pattern)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "User registered successfully"})

@app.route("/get_user/<username>")
def get_user(username):
    conn = sqlite3.connect("keystroke.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT pattern FROM users WHERE username = ?",
        (username,)
    )

    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({"pattern": json.loads(row[0])})

    return jsonify({"error": "User not found"}), 404

@app.route("/log_attempt", methods=["POST"])
def log_attempt():
    data = request.json

    username = data["username"]
    status = data["status"]
    risk = data["risk"]
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect("keystroke.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO login_logs (username, timestamp, status, risk)
        VALUES (?, ?, ?, ?)
    """, (username, timestamp, status, risk))

    conn.commit()
    conn.close()

    return jsonify({"message": "Attempt logged"})

@app.route("/admin")
def admin():
    conn = sqlite3.connect("keystroke.db")
    cursor = conn.cursor()

    cursor.execute("SELECT username, pattern FROM users")
    users = cursor.fetchall()

    cursor.execute("""
        SELECT username, timestamp, status, risk
        FROM login_logs
        ORDER BY id DESC
    """)
    logs = cursor.fetchall()

    conn.close()

    return render_template(
        "admin.html",
        users=users,
        logs=logs
    )

if __name__ == "__main__":
    app.run(debug=True)