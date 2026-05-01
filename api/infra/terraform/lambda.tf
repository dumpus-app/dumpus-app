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
      POSTGRES_URL       = aws_secretsmanager_secret.postgres_url.arn
      DISWHO_JWT_SECRET  = aws_secretsmanager_secret.diswho_jwt_secret.arn
      WH_URL             = aws_secretsmanager_secret.wh_url.arn
      DISCORD_BOT_TOKEN  = aws_secretsmanager_secret.discord_bot_token.arn
    })

    # Encrypted package blobs live here; API generates presigned URLs.
    PACKAGE_DATA_BUCKET                    = aws_s3_bucket.package_data.id
    PACKAGE_DATA_PRESIGNED_URL_TTL_SECONDS = tostring(var.package_data_presigned_url_ttl_seconds)
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

# --- Forwarder Lambda ---
#
# Tiny SQS consumer that fires one Fargate task per message. The actual work
# happens in the Fargate task (see ecs.tf); this Lambda just acts as the
# SQS → ECS RunTask glue.

resource "aws_lambda_function" "forwarder" {
  function_name = "${local.name}-forwarder"
  role          = aws_iam_role.forwarder.arn

  package_type = "Image"
  image_uri    = local.image_uri

  image_config {
    command = ["lambda_handlers.forwarder.handler"]
  }

  # Forwarder just calls ecs.run_task — minimal memory, sub-second runtime.
  memory_size = 256
  timeout     = 30

  environment {
    variables = {
      ECS_CLUSTER          = aws_ecs_cluster.main.name
      ECS_TASK_DEFINITION  = aws_ecs_task_definition.worker.family
      ECS_CONTAINER_NAME   = local.worker_container_name
      ECS_SUBNETS          = join(",", aws_subnet.private[*].id)
      ECS_SECURITY_GROUPS  = aws_security_group.worker_task.id
    }
  }

  lifecycle {
    ignore_changes = [image_uri]
  }

  depends_on = [
    aws_iam_role_policy_attachment.forwarder_basic,
    aws_cloudwatch_log_group.forwarder,
    null_resource.lambda_bootstrap_image,
  ]
}

# --- SQS → forwarder trigger ---

resource "aws_lambda_event_source_mapping" "forwarder_sqs" {
  event_source_arn = aws_sqs_queue.packages.arn
  function_name    = aws_lambda_function.forwarder.arn

  batch_size                         = 1
  maximum_batching_window_in_seconds = 0

  function_response_types = ["ReportBatchItemFailures"]
}
