"""The Postgres schema `db.py` creates and migrates when it is imported."""
import os
import subprocess
import sys

from support import env

VARCHAR = 'character varying'
TIMESTAMP = 'timestamp without time zone'

SCHEMA = {
    'cached_discord_user': [
        ('user_id', VARCHAR, 255, 'NO', None),
        ('payload', VARCHAR, None, 'NO', None),
        ('cached_at', TIMESTAMP, None, 'NO', None),
    ],
    'package_process_status': [
        ('id', 'integer', None, 'NO', "nextval('package_process_status_id_seq'::regclass)"),
        ('package_id', VARCHAR, 255, 'NO', None),
        ('step', VARCHAR, 255, 'NO', None),
        ('progress', 'integer', None, 'YES', None),
        ('queue_standard_total_when_started', 'integer', None, 'YES', None),
        ('queue_premium_total_when_started', 'integer', None, 'YES', None),
        ('queue_standard_total_when_upgraded', 'integer', None, 'YES', None),
        ('queue_premium_total_when_upgraded', 'integer', None, 'YES', None),
        ('is_upgraded', 'boolean', None, 'NO', None),
        ('is_errored', 'boolean', None, 'NO', None),
        ('error_message_code', VARCHAR, 255, 'YES', None),
        ('error_message_traceback', VARCHAR, None, 'YES', None),
        ('is_cancelled', 'boolean', None, 'NO', None),
        ('created_at', TIMESTAMP, None, 'NO', None),
        ('updated_at', TIMESTAMP, None, 'NO', None),
    ],
    'saved_package_data': [
        ('id', 'integer', None, 'NO', "nextval('saved_package_data_id_seq'::regclass)"),
        ('package_id', VARCHAR, 255, 'NO', None),
        ('iv', VARCHAR, 255, 'NO', None),
        ('created_at', TIMESTAMP, None, 'NO', None),
        ('updated_at', TIMESTAMP, None, 'NO', None),
    ],
}

INDEXES = {
    'cached_discord_user': ['CREATE UNIQUE INDEX cached_discord_user_pkey ON public.cached_discord_user USING btree (user_id)'],
    'package_process_status': ['CREATE UNIQUE INDEX package_process_status_pkey ON public.package_process_status USING btree (id)'],
    'saved_package_data': ['CREATE UNIQUE INDEX saved_package_data_pkey ON public.saved_package_data USING btree (id)'],
}

MIGRATION_DB = 'dumpus_test_migration'


def schema(postgres, dbname=None):
    with postgres.connect(dbname) as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT table_name, column_name, data_type, character_maximum_length, is_nullable, column_default "
            "FROM information_schema.columns WHERE table_schema = 'public' AND table_name NOT LIKE 'test\\_%' "
            "ORDER BY table_name, ordinal_position")
        tables = {}
        for table, *column in cur.fetchall():
            tables.setdefault(table, []).append(tuple(column))
        cur.execute(
            "SELECT tablename, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename NOT LIKE 'test\\_%' "
            "ORDER BY tablename, indexname")
        indexes = {}
        for table, definition in cur.fetchall():
            indexes.setdefault(table, []).append(definition)
    return tables, indexes


def test_import_creates_the_schema(api, postgres):
    assert schema(postgres) == (SCHEMA, INDEXES)


def import_db(postgres, dbname):
    url = postgres.url.rsplit('/', 1)[0] + '/' + dbname
    return subprocess.run([sys.executable, '-c', 'import db'], cwd=env.SRC_DIR, env={**os.environ, 'POSTGRES_URL': url},
                          capture_output=True, text=True, timeout=60)


def test_import_drops_the_legacy_blob_column_and_keeps_the_rows(api, postgres):
    with postgres.connect() as conn, conn.cursor() as cur:
        cur.execute(f'DROP DATABASE IF EXISTS {MIGRATION_DB}')
        cur.execute(f'CREATE DATABASE {MIGRATION_DB}')
    try:
        with postgres.connect(MIGRATION_DB) as conn, conn.cursor() as cur:
            cur.execute(
                'CREATE TABLE saved_package_data (id serial PRIMARY KEY, package_id varchar(255) NOT NULL, '
                'iv varchar(255) NOT NULL, encrypted_data bytea, created_at timestamp NOT NULL, updated_at timestamp NOT NULL)')
            cur.execute("INSERT INTO saved_package_data (package_id, iv, encrypted_data, created_at, updated_at) "
                        "VALUES ('legacy', '00112233445566778899aabbccddeeff', '\\x00', now(), now())")

        for _ in range(2):
            migrated = import_db(postgres, MIGRATION_DB)
            assert migrated.returncode == 0, migrated.stderr

        assert schema(postgres, MIGRATION_DB) == (SCHEMA, INDEXES)
        with postgres.connect(MIGRATION_DB) as conn, conn.cursor() as cur:
            cur.execute('SELECT package_id, iv FROM saved_package_data')
            assert cur.fetchall() == [('legacy', '00112233445566778899aabbccddeeff')]
    finally:
        with postgres.connect() as conn, conn.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS {MIGRATION_DB}')
