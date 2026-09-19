"""
AuthentiHire - Database Connection & Session Management
=======================================================
SQLAlchemy 2.x engine initialization, thread-safe session factories,
and FastAPI dependency injection utilities.
"""

import os
import logging
from typing import Generator
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

logger = logging.getLogger("authentihire.database")

# Database URL configuration with default SQLite local path
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "authentihire.db"
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH}"

DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

# Configure engine arguments based on dialect
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    # Ensure data directory exists for SQLite
    if "///" in DATABASE_URL and not DATABASE_URL.startswith("sqlite:///:memory:"):
        db_file_path = DATABASE_URL.split("///", 1)[1]
        parent_dir = Path(db_file_path).parent
        parent_dir.mkdir(parents=True, exist_ok=True)

    engine_kwargs["connect_args"] = {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite:///:memory:"):
        engine_kwargs["poolclass"] = StaticPool
else:
    # PostgreSQL connection pool settings
    engine_kwargs["pool_size"] = int(os.environ.get("DB_POOL_SIZE", "10"))
    engine_kwargs["max_overflow"] = int(os.environ.get("DB_MAX_OVERFLOW", "20"))
    engine_kwargs["pool_pre_ping"] = True

# Create SQLAlchemy 2.x Engine
engine = create_engine(DATABASE_URL, **engine_kwargs)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enables foreign key enforcement on SQLite connections."""
    if type(dbapi_connection).__module__ == "sqlite3":
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Thread-safe SessionLocal factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a managed database session with transaction safety."""
    db: Session = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session encountered an error; rolling back: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db(target_engine=None) -> None:
    """Initializes tables via metadata (used in local development fallback and test suites)."""
    from src.database.models import Base
    active_engine = target_engine or engine
    logger.info(f"Initializing database schema on {active_engine.url}...")
    Base.metadata.create_all(bind=active_engine)
    logger.info("[+] Database schema successfully created.")


def drop_db(target_engine=None) -> None:
    """Drops all tables (primarily used for isolated test suite tearDown)."""
    from src.database.models import Base
    active_engine = target_engine or engine
    Base.metadata.drop_all(bind=active_engine)
