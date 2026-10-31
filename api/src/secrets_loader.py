"""Hydrate os.environ from AWS Secrets Manager at module import time.

Lambda runtime gets a single env var `SECRETS_ARN_MAP`, which is a JSON
object like:

    {"POSTGRES_URL": "arn:aws:secretsmanager:...", "DISCORD_SECRET": "arn:..."}

For each entry, this module fetches the secret's value and sets the env var
of the same name — but only if it isn't already set, so you can still
override locally.

No-op when SECRETS_ARN_MAP is unset (local dev).
"""
import json
import os


def _load() -> None:
    raw = os.getenv("SECRETS_ARN_MAP")
    if not raw:
        return

    arn_map = json.loads(raw)
    if not arn_map:
        return

    # Import boto3 only when we actually need it — avoids paying the import
    # cost in local dev where this module is a no-op.
    import boto3

    client = boto3.client("secretsmanager")
    for env_name, arn in arn_map.items():
        if env_name in os.environ:
            continue  # don't override an explicitly-set value
        if not arn:
            continue
        resp = client.get_secret_value(SecretId=arn)
        os.environ[env_name] = resp["SecretString"]


_load()
