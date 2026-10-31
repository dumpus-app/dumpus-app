"""Open the blobs the worker uploads, and read the SQLite inside."""
import gzip
import hashlib
import json
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
    """`{table: {columns, rows}}` of a SQLite file, its rows as sorted JSON lines."""
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
        finally:
            conn.close()
    return tables


def as_dicts(table):
    return [dict(zip(table['columns'], json.loads(row))) for row in table['rows']]

