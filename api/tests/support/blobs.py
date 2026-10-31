"""Open the blobs the worker uploads, and boil the SQLite inside down to a golden."""
import gzip
import hashlib
import json
import os
import sqlite3
import tempfile

from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def decrypt(blob, iv_hex, upn):
    """The inverse of `crypto.encrypt_sqlite_data`: AES-CBC keyed with SHA-256 of the UPN, PKCS7."""
    key = hashlib.sha256(upn.encode()).digest()
    decryptor = Cipher(algorithms.AES(key), modes.CBC(bytes.fromhex(iv_hex))).decryptor()
    padded = decryptor.update(blob) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    return unpadder.update(padded) + unpadder.finalize()


def open_blob(blob, iv_hex, upn):
    """The SQLite file a client gets from a blob: decrypted when there's an iv, then gunzipped."""
    return gzip.decompress(decrypt(blob, iv_hex, upn) if iv_hex else blob)


def _canonical(value):
    if isinstance(value, bytes):
        return {'hex': value.hex()}
    return value


def read_tables(sqlite_bytes):
    """`{table: sorted rows as JSON lines}` and the index names of a SQLite file."""
    with tempfile.NamedTemporaryFile(suffix='.sqlite') as file:
        file.write(sqlite_bytes)
        file.flush()
        conn = sqlite3.connect(f'file:{file.name}?mode=ro', uri=True)
        try:
            names = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")]
            tables = {}
            for name in names:
                cursor = conn.execute(f'SELECT * FROM "{name}"')
                columns = [column[0] for column in cursor.description]
                rows = [json.dumps([_canonical(v) for v in row], ensure_ascii=False, separators=(',', ':')) for row in cursor]
                tables[name] = {'columns': columns, 'rows': sorted(rows)}
            indexes = sorted(row[0] for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_autoindex_%'"))
        finally:
            conn.close()
    return tables, indexes


def as_dicts(table):
    return [dict(zip(table['columns'], json.loads(row))) for row in table['rows']]


def summarize(sqlite_bytes, dump_to=None):
    """Per table, the row count and a hash of the sorted rows.

    With `dump_to`, also writes every row there, to see what a changed hash
    hides: run once per branch and diff the two dumps.
    """
    tables, indexes = read_tables(sqlite_bytes)
    package_data = tables.get('package_data')
    summary = {
        'tables': {
            name: {'rows': len(table['rows']), 'sha256': hashlib.sha256('\n'.join(table['rows']).encode()).hexdigest()}
            for name, table in tables.items()
        },
        'indexes': indexes,
        'package_data': as_dicts(package_data) if package_data else None,
    }
    if dump_to:
        os.makedirs(os.path.dirname(dump_to), exist_ok=True)
        with open(dump_to, 'w') as file:
            json.dump({name: [table['columns'], *map(json.loads, table['rows'])] for name, table in tables.items()},
                      file, indent=1, ensure_ascii=False)
            file.write('\n')
    return summary
