locals {
  image_uri = "${aws_ecr_repository.lambda.repository_url}:${var.image_tag}"

  app_environment = {
    DL_ZIP_TMP_PATH            = "/tmp"
    DL_ZIP_WHITELISTED_DOMAINS = var.dl_zip_whitelisted_domains
    DISWHO_BASE_URL            = var.diswho_base_url
    QUEUE_BACKEND              = "sqs"
    SQS_QUEUE_URL              = aws_sqs_queue.packages.url

    # Sensitive values are NOT in env. The Lambda's secrets_loader.py reads
    # them from Secrets Manager at startup using the ARNs below.
    SECRETS_ARN_MAP = jsonencode({
      POSTGRES_URL      = aws_secretsmanager_secret.postgres_url.arn
      DISWHO_JWT_SECRET = aws_secretsmanager_secret.diswho_jwt_secret.arn
      WH_URL            = aws_secretsmanager_secret.wh_url.arn
    })
  }
}

# --- API Lambda ---

resource "aws_lambda_function" "api" {
  function_name = "${local.name}-api"
  role          = aws_iam_role.api.arn

  package_type = "Image"
  image_uri    = local.image_uri

  image_config {
    command = ["lambda_handlers.api.handler"]
  }

  memory_size = var.api_lambda_memory
  timeout     = var.api_lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = local.app_environment
  }

  # Deploys via CI bump image_uri without TF noticing — only the tag changes,
  # the rest of the function spec is owned by Terraform.
  lifecycle {
    ignore_changes = [image_uri]
  }

  depends_on = [
    aws_iam_role_policy_attachment.api_basic,
    aws_iam_role_policy_attachment.api_vpc,
    aws_cloudwatch_log_group.api,
    null_resource.lambda_bootstrap_image,
  ]
}

# --- Worker Lambda ---

resource "aws_lambda_function" "worker" {
  function_name = "${local.name}-worker"
  role          = aws_iam_role.worker.arn

  package_type = "Image"
  image_uri    = local.image_uri

  image_config {
    command = ["lambda_handlers.worker.handler"]
  }

  memory_size = var.worker_lambda_memory
  timeout     = var.worker_lambda_timeout

  ephemeral_storage {
    size = var.worker_ephemeral_storage_mb
  }

  # null → use the account-level concurrency pool. New AWS accounts have a
  # 10-execution ceiling and require ≥10 unreserved, so any reservation fails
  # until you request a quota increase. Set the var > 0 once that's lifted.
  reserved_concurrent_executions = var.worker_reserved_concurrency > 0 ? var.worker_reserved_concurrency : null

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = local.app_environment
  }

  lifecycle {
    ignore_changes = [image_uri]
  }

  depends_on = [
    aws_iam_role_policy_attachment.worker_basic,
    aws_iam_role_policy_attachment.worker_vpc,
    aws_cloudwatch_log_group.worker,
    null_resource.lambda_bootstrap_image,
  ]
}

# --- SQS → worker trigger ---

resource "aws_lambda_event_source_mapping" "worker_sqs" {
  event_source_arn = aws_sqs_queue.packages.arn
  function_name    = aws_lambda_function.worker.arn

  batch_size                         = 1
  maximum_batching_window_in_seconds = 0

  function_response_types = ["ReportBatchItemFailures"]

  scaling_config {
    # Match reserved concurrency so we don't burn through retries during a backlog.
    maximum_concurrency = max(2, var.worker_reserved_concurrency)
  }
}
