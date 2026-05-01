output "api_url" {
  description = "Public HTTPS URL of the API"
  value       = "https://${local.api_fqdn}"
}

output "region" {
  description = "AWS region this stack is deployed in"
  value       = var.region
}

output "ecr_lambda_repository_url" {
  description = "Push the API + forwarder Lambda container image here"
  value       = aws_ecr_repository.lambda.repository_url
}

output "ecr_worker_repository_url" {
  description = "Push the Fargate worker container image here"
  value       = aws_ecr_repository.worker.repository_url
}

output "api_lambda_name" {
  value = aws_lambda_function.api.function_name
}

output "forwarder_lambda_name" {
  value = aws_lambda_function.forwarder.function_name
}

output "worker_ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "worker_ecs_task_family" {
  value = aws_ecs_task_definition.worker.family
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
  description = "Public IP that all outbound worker / Lambda traffic comes from"
  value       = aws_eip.fck_nat.public_ip
}

output "package_data_bucket" {
  value = aws_s3_bucket.package_data.id
}

output "alerts_topic_arn" {
  description = "SNS topic that the ops alarms publish to. Subscribe an email after first apply."
  value       = aws_sns_topic.alerts.arn
}
