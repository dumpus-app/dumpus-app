output "api_url" {
  description = "Public HTTPS URL of the API"
  value       = "https://${local.api_fqdn}"
}

output "region" {
  description = "AWS region this stack is deployed in"
  value       = var.region
}

output "ecr_repository_url" {
  description = "Push the Lambda container image here"
  value       = aws_ecr_repository.lambda.repository_url
}

output "api_lambda_name" {
  value = aws_lambda_function.api.function_name
}

output "worker_lambda_name" {
  value = aws_lambda_function.worker.function_name
}

output "sqs_queue_url" {
  value = aws_sqs_queue.packages.url
}

output "sqs_dlq_url" {
  value = aws_sqs_queue.dlq.url
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "fck_nat_eip" {
  description = "Public IP that all outbound Lambda traffic comes from"
  value       = aws_eip.fck_nat.public_ip
}

output "package_data_bucket" {
  value = aws_s3_bucket.package_data.id
}

output "alerts_topic_arn" {
  description = "SNS topic that the ops alarms publish to. Subscribe an email after first apply."
  value       = aws_sns_topic.alerts.arn
}
