resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name}-packages-dlq"
  message_retention_seconds = 14 * 24 * 60 * 60 # 14 days
}

resource "aws_sqs_queue" "packages" {
  name = "${local.name}-packages"

  # The forwarder Lambda's timeout is short (it just calls ecs.run_task), but
  # SQS still needs visibility long enough to absorb a slow API call + retries.
  # 90s gives plenty of headroom over the 30s forwarder timeout.
  visibility_timeout_seconds = 90

  message_retention_seconds = 4 * 24 * 60 * 60 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    # 1 retry then DLQ. Only forwarder failures cycle here — Fargate task
    # failures surface as ERRORED package rows, not redelivered messages.
    maxReceiveCount = 2
  })
}
