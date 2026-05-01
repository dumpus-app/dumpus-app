# SNS topic that ops alarms publish to. A small Lambda forwards each
# message to the Discord WH_URL webhook so notifications land in the
# same channel as package-processed notices.
resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
}

# Anything in the DLQ means a worker invocation failed twice in a row
# (process_package raised an unhandled exception or the Lambda timed out
# at the 15-min cap). Always worth a look.
resource "aws_cloudwatch_metric_alarm" "worker_dlq_depth" {
  alarm_name          = "${local.name}-worker-dlq-not-empty"
  alarm_description   = "A worker invocation failed permanently and the SQS message landed in the DLQ. Check /aws/lambda/${aws_lambda_function.worker.function_name} for the traceback."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# --- Discord notifier Lambda ---

data "archive_file" "notifier" {
  type        = "zip"
  source_file = "${path.module}/notifier/notifier.py"
  output_path = "${path.module}/notifier/notifier.zip"
}

# Pulls the latest WH_URL out of Secrets Manager at apply time so the
# notifier doesn't need its own runtime SM read.
data "aws_secretsmanager_secret_version" "wh_url_current" {
  secret_id = aws_secretsmanager_secret.wh_url.id
}

resource "aws_iam_role" "notifier" {
  name               = "${local.name}-notifier-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "notifier_basic" {
  role       = aws_iam_role.notifier.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "notifier" {
  name              = "/aws/lambda/${local.name}-alert-notifier"
  retention_in_days = 30
}

resource "aws_lambda_function" "notifier" {
  function_name    = "${local.name}-alert-notifier"
  role             = aws_iam_role.notifier.arn
  filename         = data.archive_file.notifier.output_path
  source_code_hash = data.archive_file.notifier.output_base64sha256
  handler          = "notifier.handler"
  runtime          = "python3.13"
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      WH_URL = data.aws_secretsmanager_secret_version.wh_url_current.secret_string
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.notifier_basic,
    aws_cloudwatch_log_group.notifier,
  ]
}

resource "aws_lambda_permission" "sns_invoke_notifier" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notifier.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

resource "aws_sns_topic_subscription" "notifier" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.notifier.arn
}
