"""A throwaway Postgres for the run.

Either a container of the image `docker-compose.yml` uses, on a free local
port, or the server named by `DUMPUS_TEST_POSTGRES_URL` (the CI service).
"""
import os
import re
import subprocess
import time
from contextlib import contextmanager

import psycopg2
import psycopg2.extras

LABEL = 'dumpus-api-tests'
USER = PASSWORD = 'dumpus'
DATABASE = 'dumpus_test'

APP_TABLES = ('package_process_status', 'saved_package_data', 'cached_discord_user')

# Every write the worker makes to a status row, in order, so tests can check
# the steps it went through and not only where it ended.
STEP_LOG = '''
CREATE TABLE IF NOT EXISTS test_step_log (
    seq serial PRIMARY KEY,
    status_id integer,
    package_id varchar,
    step varchar,
    progress integer,
    is_errored boolean,
    error_message_code varchar
);
CREATE OR REPLACE FUNCTION test_log_step() RETURNS trigger AS $$
BEGIN
    INSERT INTO test_step_log (status_id, package_id, step, progress, is_errored, error_message_code)
    VALUES (NEW.id, NEW.package_id, NEW.step, NEW.progress, NEW.is_errored, NEW.error_message_code);
    RETURN NEW;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER test_log_step
    AFTER INSERT OR UPDATE ON package_process_status
    FOR EACH ROW EXECUTE FUNCTION test_log_step();
'''


def compose_image(api_dir):
    compose = (api_dir / 'docker-compose.yml').read_text()
    match = re.search(r'^\s*image:\s*(postgres\S*)\s*$', compose, re.M)
    return match.group(1) if match else 'postgres:17-alpine'


class Postgres:
    def __init__(self, url, container=None):
        self.url = url
        self.container = container
        self.dsn = url.replace('+psycopg2', '')

    @contextmanager
    def connect(self, dbname=None):
        dsn = self.dsn if dbname is None else self.dsn.rsplit('/', 1)[0] + '/' + dbname
        conn = psycopg2.connect(dsn, connect_timeout=2)
        conn.autocommit = True
        try:
            yield conn
        finally:
            conn.close()

    def wait(self, timeout=60):
        deadline = time.monotonic() + timeout
        while True:
            try:
                with self.connect() as conn, conn.cursor() as cur:
                    cur.execute('SELECT 1')
                return
            except psycopg2.OperationalError:
                if time.monotonic() > deadline:
                    raise
                time.sleep(0.2)

    def stop(self):
        if self.container:
            subprocess.run(['docker', 'rm', '--force', self.container], capture_output=True)

    def execute(self, sql, params=None):
        with self.connect() as conn, conn.cursor() as cur:
            cur.execute(sql, params)

    def rows(self, sql, params=None):
        with self.connect() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]

    def reset_schema(self):
        self.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')

    def install_step_log(self):
        self.execute(STEP_LOG)

    def clear(self):
        # DELETE rather than TRUNCATE: a session the API forgot to close still
        # holds a lock that TRUNCATE would wait on forever.
        self.execute(
            ''.join(f'DELETE FROM {table};' for table in (*APP_TABLES, 'test_step_log'))
            + "SELECT setval(pg_get_serial_sequence('package_process_status', 'id'), 1, false);"
            + "SELECT setval(pg_get_serial_sequence('saved_package_data', 'id'), 1, false);"
        )

    def steps(self, package_id):
        """The successive steps of the package's status rows, repeats collapsed."""
        steps = []
        for row in self.rows('SELECT step FROM test_step_log WHERE package_id = %s ORDER BY seq', (package_id,)):
            if not steps or steps[-1] != row['step']:
                steps.append(row['step'])
        return steps

    def insert_status(self, package_id, **columns):
        values = {
            'package_id': package_id,
            'step': 'LOCKED',
            'is_upgraded': False,
            'is_errored': False,
            'is_cancelled': False,
            **columns,
        }
        names = ', '.join(values)
        placeholders = ', '.join(['%s'] * len(values))
        return self.rows(
            f'INSERT INTO package_process_status ({names}, created_at, updated_at) '
            f'VALUES ({placeholders}, clock_timestamp(), clock_timestamp()) RETURNING id',
            list(values.values()),
        )[0]['id']


def start(api_dir):
    url = os.environ.get('DUMPUS_TEST_POSTGRES_URL')
    if url:
        if 'test' not in url.rsplit('/', 1)[-1]:
            raise RuntimeError('DUMPUS_TEST_POSTGRES_URL must name a database with "test" in it: the suite wipes it')
        server = Postgres(url)
        server.wait()
        server.reset_schema()
        return server

    started = subprocess.run(
        [
            'docker', 'run', '--detach', '--rm',
            '--label', LABEL,
            '--env', f'POSTGRES_USER={USER}',
            '--env', f'POSTGRES_PASSWORD={PASSWORD}',
            '--env', f'POSTGRES_DB={DATABASE}',
            '--publish', '127.0.0.1::5432',
            '--tmpfs', '/var/lib/postgresql/data',
            compose_image(api_dir),
            '-c', 'fsync=off', '-c', 'synchronous_commit=off', '-c', 'full_page_writes=off',
        ],
        capture_output=True, text=True,
    )
    if started.returncode:
        raise RuntimeError(f'could not start Postgres with Docker, or set DUMPUS_TEST_POSTGRES_URL:\n{started.stderr}')
    container = started.stdout.strip()
    try:
        published = subprocess.run(
            ['docker', 'port', container, '5432/tcp'], check=True, capture_output=True, text=True,
        ).stdout.splitlines()[0]
        server = Postgres(f'postgresql+psycopg2://{USER}:{PASSWORD}@127.0.0.1:{published.rsplit(":", 1)[1]}/{DATABASE}', container)
        server.wait()
    except BaseException:
        subprocess.run(['docker', 'rm', '--force', container], capture_output=True)
        raise
    return server
