output "url" {
  description = "Public HTTPS URL of the site"
  value       = "https://${local.fqdn}"
}

output "site_bucket" {
  description = "S3 bucket the deploy workflow syncs into"
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "Pass to cloudfront create-invalidation after each deploy"
  value       = aws_cloudfront_distribution.site.id
}

output "github_deploy_role_arn" {
  description = "Set as AWS_DEPLOY_ROLE_ARN in this repo's GH secrets"
  value       = local.github_oidc_enabled ? aws_iam_role.github_deploy[0].arn : ""
}
