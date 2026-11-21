import aiosqlite
import json
import os
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.guardrails import redact_sensitive_text

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "audit.db"

class AuditLogger:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or Path(os.getenv("DATABASE_PATH", DEFAULT_DB_PATH))

    async def init_db(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    session_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
            """)
            await db.commit()

    async def log_event(self, session_id: str, event_type: str, actor: str, payload: Dict[str, Any]) -> int:
        await self.init_db()
        payload_str = json.dumps(payload, ensure_ascii=False)
        # Redact sensitive personal data before persisting to audit database
        redacted_payload = redact_sensitive_text(payload_str)
        now = time.time()

        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "INSERT INTO audit_events (timestamp, session_id, event_type, actor, payload) VALUES (?, ?, ?, ?, ?)",
                (now, session_id, event_type, actor, redacted_payload)
            )
            await db.commit()
            return cursor.lastrowid or 0

    async def get_session_events(self, session_id: str) -> List[Dict[str, Any]]:
        await self.init_db()
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT id, timestamp, session_id, event_type, actor, payload FROM audit_events WHERE session_id = ? ORDER BY id ASC",
                (session_id,)
            )
            rows = await cursor.fetchall()
            events = []
            for row in rows:
                events.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "session_id": row["session_id"],
                    "event_type": row["event_type"],
                    "actor": row["actor"],
                    "payload": json.loads(row["payload"])
                })
            return events

audit_logger = AuditLogger()
