data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# --- API Lambda role ---

resource "aws_iam_role" "api" {
  name               = "${local.name}-api-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "api_basic" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "api_vpc" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "api" {
  statement {
    sid       = "EnqueuePackage"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.packages.arn]
  }

  statement {
    sid     = "ReadAppSecrets"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.postgres_url.arn,
      aws_secretsmanager_secret.diswho_jwt_secret.arn,
      aws_secretsmanager_secret.wh_url.arn,
      aws_secretsmanager_secret.discord_bot_token.arn,
    ]
  }

  # boto3.generate_presigned_url signs with this role's identity, so the
  # role itself must be allowed to GetObject — the URL just borrows that
  # permission for ~5 minutes. PutObject is for the demo lazy-seed path
  # in /blob/demo (the worker uploads real packages with its own role).
  statement {
    sid = "ReadWritePackageBlobs"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${aws_s3_bucket.package_data.arn}/*"]
  }

  # ListBucket is scoped to the bucket itself (not the keys) — needed so
  # head_object returns 404 instead of 403 on missing keys.
  statement {
    sid       = "ListPackageBlobs"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.package_data.arn]
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "${local.name}-api"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api.json
}

# --- Forwarder Lambda role ---
#
# Receives SQS messages, fires Fargate tasks. Doesn't touch RDS, S3, or app
# secrets — those live on the task role.

resource "aws_iam_role" "forwarder" {
  name               = "${local.name}-forwarder-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "forwarder_basic" {
  role       = aws_iam_role.forwarder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "forwarder" {
  statement {
    sid = "ConsumeQueue"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility",
    ]
    resources = [aws_sqs_queue.packages.arn]
  }

  statement {
    sid       = "RunWorkerTask"
    actions   = ["ecs:RunTask"]
    resources = ["${aws_ecs_task_definition.worker.arn_without_revision}:*"]
  }

  # ecs:RunTask requires PassRole on the task and execution roles so ECS can
  # assume them when launching the task.
  statement {
    sid     = "PassTaskRoles"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.worker_task.arn,
      aws_iam_role.worker_task_execution.arn,
    ]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "forwarder" {
  name   = "${local.name}-forwarder"
  role   = aws_iam_role.forwarder.id
  policy = data.aws_iam_policy_document.forwarder.json
}
