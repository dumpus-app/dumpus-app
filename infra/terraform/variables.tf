variable "region" {
  description = "AWS region for the S3 bucket. CloudFront is global; ACM cert auto-pins to us-east-1."
  type        = string
  default     = "eu-west-1"
}

variable "allowed_account_ids" {
  description = "Refuse to plan/apply unless the resolved AWS credentials belong to one of these account IDs."
  type        = list(string)
  default     = []
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "name_prefix" {
  type    = string
  default = "dumpus-web"
}

variable "domain_name" {
  description = "Apex domain (must already have a Route 53 hosted zone in this account)."
  type        = string
  default     = "dumpus.app"
}

variable "subdomain" {
  description = "Hostname the site is served at. Final URL = subdomain.domain_name."
  type        = string
  default     = "web"
}

variable "github_repository" {
  description = "Repo allowed to assume the deploy role, as its OIDC subject names it: owner/repo, or owner@id/repo@id when GitHub makes the subject immutable (e.g. Androz2091@42497995/dumpus-app@640259652). Empty = skip."
  type        = string
  default     = ""
}

variable "github_deploy_branches" {
  description = "Branches that may deploy."
  type        = list(string)
  default     = ["main"]
}
