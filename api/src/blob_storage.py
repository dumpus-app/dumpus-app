"""S3-backed storage for encrypted package blobs.

The worker uploads the encrypted SQLite directly to S3 (one object per
package). The API generates short presigned GET URLs so clients can
download directly from S3 — bypassing API Gateway, which is slow and
6MB-capped for binary responses.

No-op when PACKAGE_DATA_BUCKET is unset (local dev): callers fall back
to the legacy DB-backed path.
"""
import os


def _bucket():
    return os.getenv("PACKAGE_DATA_BUCKET")


def is_enabled() -> bool:
    return bool(_bucket())


def _key(package_id: str) -> str:
    # Flat layout. Package IDs are MD5 hex digests, so no path-traversal risk.
    return f"packages/{package_id}.bin"


def upload_encrypted(package_id: str, encrypted_bytes: bytes) -> None:
    """Push the encrypted blob to S3 under a deterministic key."""
    import boto3

    boto3.client("s3").put_object(
        Bucket=_bucket(),
        Key=_key(package_id),
        Body=encrypted_bytes,
        ContentType="application/octet-stream",
    )


def presigned_url(package_id: str, ttl_seconds: int = 300) -> str:
    """Return a short-lived URL the client can GET directly from S3."""
    import boto3

    return boto3.client("s3").generate_presigned_url(
        "get_object",
        Params={"Bucket": _bucket(), "Key": _key(package_id)},
        ExpiresIn=ttl_seconds,
    )


def exists(package_id: str) -> bool:
    """True if a blob has been uploaded for this package."""
    import boto3
    from botocore.exceptions import ClientError

    try:
        boto3.client("s3").head_object(Bucket=_bucket(), Key=_key(package_id))
        return True
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
            return False
        raise
