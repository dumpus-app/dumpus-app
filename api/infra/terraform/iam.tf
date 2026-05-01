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
    ]
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "${local.name}-api"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api.json
}

# --- Worker Lambda role ---

resource "aws_iam_role" "worker" {
  name               = "${local.name}-worker-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "worker_basic" {
  role       = aws_iam_role.worker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "worker_vpc" {
  role       = aws_iam_role.worker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "worker" {
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
    sid     = "ReadAppSecrets"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.postgres_url.arn,
      aws_secretsmanager_secret.diswho_jwt_secret.arn,
      aws_secretsmanager_secret.wh_url.arn,
    ]
  }
}

resource "aws_iam_role_policy" "worker" {
  name   = "${local.name}-worker"
  role   = aws_iam_role.worker.id
  policy = data.aws_iam_policy_document.worker.json
}
