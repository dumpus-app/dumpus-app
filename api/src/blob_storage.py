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


def _client():
    """boto3 S3 client pinned to the function's region with sigv4.

    Without these, boto3 generates URLs like `bucket.s3.amazonaws.com`
    which 308-redirect to the regional endpoint for non-us-east-1 buckets.
    Browsers treat the redirect as cross-origin and CORS-block the response.
    """
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        region_name=os.environ.get("AWS_REGION", "eu-west-1"),
        config=Config(signature_version="s3v4"),
    )


def upload(package_id: str, body: bytes) -> None:
    """Push a blob to S3 under a deterministic key. Same operation for the
    worker's encrypted SQLite and the demo's unencrypted one."""
    _client().put_object(
        Bucket=_bucket(),
        Key=_key(package_id),
        Body=body,
        ContentType="application/octet-stream",
    )


def presigned_url(package_id: str, ttl_seconds: int = 300) -> str:
    """Return a short-lived URL the client can GET directly from S3."""
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": _bucket(), "Key": _key(package_id)},
        ExpiresIn=ttl_seconds,
    )


def exists(package_id: str) -> bool:
    """True if a blob has been uploaded for this package."""
    from botocore.exceptions import ClientError

    try:
        _client().head_object(Bucket=_bucket(), Key=_key(package_id))
        return True
    except ClientError as e:
        # boto3 reports object-not-found in several flavors depending on the
        # SDK version; check the HTTP status, which is always 404.
        if e.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
            return False
        raise
