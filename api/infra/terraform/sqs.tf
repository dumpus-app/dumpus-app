resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name}-packages-dlq"
  message_retention_seconds = 14 * 24 * 60 * 60 # 14 days
}

resource "aws_sqs_queue" "packages" {
  name = "${local.name}-packages"

  # Has to comfortably exceed worker_lambda_timeout, plus a buffer for retries.
  visibility_timeout_seconds = var.worker_lambda_timeout + 60

  message_retention_seconds = 4 * 24 * 60 * 60 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    # 1 retry then DLQ. Bumping it just keeps a poison message hot for longer.
    maxReceiveCount = 2
  })
}
