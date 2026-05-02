import os

from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func, text

import orjson

engine = create_engine(os.getenv('POSTGRES_URL'), pool_recycle=3600, pool_pre_ping=True)

Base = declarative_base()

class SavedPackageData(Base):
    __tablename__ = 'saved_package_data'

    id = Column(Integer, primary_key=True)
    package_id = Column(String(255), nullable=False)
    iv = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, onupdate=func.now(), default=func.now())

class CachedDiscordUser(Base):
    """Cache of upstream /user payloads (diswho or Discord bot API).

    Discord usernames + avatars don't move often; the upstream is rate-
    limited (429s on bursts) so a small Postgres-backed cache absorbs
    the per-package fan-out and stops us hammering Discord every time
    a user opens a heavy package.
    """
    __tablename__ = 'cached_discord_user'

    user_id = Column(String(255), primary_key=True)
    payload = Column(String, nullable=False)  # JSON-serialized upstream response
    cached_at = Column(DateTime, nullable=False, default=func.now())


CACHED_DISCORD_USER_TTL_HOURS = 24


class PackageProcessStatus(Base):
    __tablename__ = 'package_process_status'

    id = Column(Integer, primary_key=True)
    package_id = Column(String(255), nullable=False)
    step = Column(String(255), nullable=False)
    progress = Column(Integer, nullable=True)
    queue_standard_total_when_started = Column(Integer, nullable=True)
    queue_premium_total_when_started = Column(Integer, nullable=True)
    queue_standard_total_when_upgraded = Column(Integer, nullable=True)
    queue_premium_total_when_upgraded = Column(Integer, nullable=True)
    is_upgraded = Column(Boolean, nullable=False, default=False)
    is_errored = Column(Boolean, nullable=False, default=False)
    error_message_code = Column(String(255), nullable=True)
    error_message_traceback = Column(String, nullable=True)
    is_cancelled = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, onupdate=func.now(), default=func.now())

Base.metadata.create_all(engine)

# One-shot migration: drop the legacy encrypted_data blob column on the
# saved_package_data table. Encrypted bytes live in S3 now; only iv stays
# in the DB. IF EXISTS makes this idempotent across cold starts.
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE saved_package_data DROP COLUMN IF EXISTS encrypted_data;"))

Session = sessionmaker(bind=engine)

def update_progress (package_status_id, package_id, current_progress, session):
    package = session.query(PackageProcessStatus).filter_by(id=package_status_id).first()
    if package:
        package.progress = current_progress
        package.updated_at = datetime.now()
        session.commit()

def update_step (package_status_id, package_id, step, session):
    package = session.query(PackageProcessStatus).filter_by(id=package_status_id).first()
    if package:
        package.step = step
        package.updated_at = datetime.now()
        session.commit()

def fetch_package_rank (package_id, package_status, session):
    if not package_status:
        return None
    
    upgraded_row_count = None
    row_count = None

    query = 'select count(*) from package_process_status where step <> \'PROCESSED\' and is_upgraded = :is_upgraded and is_errored = false and is_cancelled = false;'

    total_upgraded_row_count = session.execute(text(query).bindparams(is_upgraded=True)).fetchone()[0]
    total_row_count = session.execute(text(query).bindparams(is_upgraded=False)).fetchone()[0]

    if package_status.is_upgraded:
        upgraded_row_count = session.execute(text("""
            select count(*) from package_process_status 
            where id < (select id from package_process_status where package_id = :package_id order by created_at desc limit 1)
            and step <> 'PROCESSED'
            and is_upgraded = true and is_errored = false and is_cancelled = false;
        """).bindparams(package_id=package_id)).fetchone()[0]
    else:    
        row_count = session.execute(text("""
            select count(*) from package_process_status
            where id < (select id from package_process_status where package_id = :package_id order by created_at desc limit 1)
            and step <> 'PROCESSED' and is_errored = false and is_cancelled = false;
        """).bindparams(package_id=package_id)).fetchone()[0]

    return (total_upgraded_row_count, total_row_count, upgraded_row_count, row_count)

def fetch_package_status(package_id, session):
    status = session.query(PackageProcessStatus).filter_by(package_id=package_id).order_by(PackageProcessStatus.created_at.desc()).first()
    return status

def get_cached_discord_user(user_id, session):
    """Return the cached upstream user dict, or None if absent or stale."""
    row = session.query(CachedDiscordUser).filter_by(user_id=user_id).first()
    if not row:
        return None
    if datetime.now() - row.cached_at > timedelta(hours=CACHED_DISCORD_USER_TTL_HOURS):
        return None
    return orjson.loads(row.payload)


def cache_discord_user(user_id, payload, session):
    """Upsert a user payload into the cache.

    Caller must only pass valid upstream responses — never None, never
    error envelopes — so the cache doesn't pin failures and starve
    legitimate retries.
    """
    serialized = orjson.dumps(payload).decode()
    existing = session.query(CachedDiscordUser).filter_by(user_id=user_id).first()
    if existing:
        existing.payload = serialized
        existing.cached_at = datetime.now()
    else:
        session.add(CachedDiscordUser(user_id=user_id, payload=serialized))
    session.commit()


def fetch_pending_packages():
    session = Session()
    # select * from package_process_status pps where step <> 'PROCESSED' and error_message_code is null
    result = session.query(PackageProcessStatus).filter(PackageProcessStatus.step != 'PROCESSED', PackageProcessStatus.error_message_code == None).all()
    session.close()
    return result
