resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.name}-api"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "forwarder" {
  name              = "/aws/lambda/${local.name}-forwarder"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigw/${local.name}"
  retention_in_days = 30
}
