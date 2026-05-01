# Stores encrypted package blobs out-of-band from Postgres so the API can
# return short presigned URLs instead of streaming hundreds of MB through
# Lambda + API Gateway (which is slow and capped at 6MB).
#
# The blob itself is encrypted client-key-derived AES-CBC by the worker, so
# there's no privacy concern about the bucket holding it — only the holder
# of the UPN can decrypt it.

resource "aws_s3_bucket" "package_data" {
  bucket = "${local.name}-package-data"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "package_data" {
  bucket = aws_s3_bucket.package_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "package_data" {
  bucket = aws_s3_bucket.package_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "package_data" {
  bucket = aws_s3_bucket.package_data.id
  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "package_data" {
  bucket = aws_s3_bucket.package_data.id

  rule {
    id     = "expire-blobs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.package_data_retention_days
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# CORS so the frontend (web.dumpus.app and dev) can fetch the presigned URL
# from the browser. Only GET is allowed.
resource "aws_s3_bucket_cors_configuration" "package_data" {
  bucket = aws_s3_bucket.package_data.id

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "Content-Length"]
    max_age_seconds = 300
  }
}

# VPC gateway endpoint for S3 so worker uploads (potentially hundreds of MB)
# don't go through fck-nat. Gateway endpoints are free, route table-based.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = { Name = "${local.name}-s3-endpoint" }
}
