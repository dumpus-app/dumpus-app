variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "allowed_account_ids" {
  description = "If non-empty, refuse to plan/apply unless the resolved AWS credentials belong to one of these account IDs. Strongly recommended on shared workstations."
  type        = list(string)
  default     = []
}

variable "environment" {
  description = "Environment name (used for tagging and resource naming)"
  type        = string
  default     = "prod"
}

variable "name_prefix" {
  description = "Prefix applied to all resource names"
  type        = string
  default     = "dumpus"
}

# ---- DNS / TLS ----

variable "domain_name" {
  description = "Apex domain (must already have a Route53 hosted zone)"
  type        = string
  default     = "dumpus.app"
}

variable "api_subdomain" {
  description = "Hostname for the public API"
  type        = string
  default     = "api"
}

# ---- Networking ----

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "az_count" {
  description = "Number of AZs to spread subnets across"
  type        = number
  default     = 2
}

variable "fck_nat_instance_type" {
  description = "Instance type for the fck-nat NAT replacement (~$3/mo on t4g.nano)"
  type        = string
  default     = "t4g.nano"
}

# ---- Database ----

variable "postgres_version" {
  type    = string
  default = "17.2"
}

variable "postgres_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "postgres_allocated_storage" {
  type    = number
  default = 20
}

variable "postgres_max_allocated_storage" {
  description = "Storage autoscaling cap in GB (0 to disable)"
  type        = number
  default     = 100
}

variable "postgres_db_name" {
  type    = string
  default = "dumpus"
}

variable "postgres_username" {
  type    = string
  default = "dumpus"
}

variable "postgres_multi_az" {
  type    = bool
  default = false
}

# ---- Lambda sizing ----

variable "image_tag" {
  description = "Container image tag deployed to both Lambdas. CI overrides per-deploy via UpdateFunctionCode."
  type        = string
  default     = "bootstrap"
}

variable "api_lambda_memory" {
  description = "MB. 512 is plenty for Flask + apig-wsgi."
  type        = number
  default     = 512
}

variable "api_lambda_timeout" {
  description = "Seconds. API Gateway HTTP API caps at 30."
  type        = number
  default     = 30
}

variable "worker_lambda_memory" {
  description = "MB. Pandas + zip processing are memory-hungry; 3008 is the sweet spot."
  type        = number
  default     = 3008
}

variable "worker_lambda_timeout" {
  description = "Seconds. Lambda hard cap is 900."
  type        = number
  default     = 900
}

variable "worker_ephemeral_storage_mb" {
  description = "MB of /tmp space for the worker (Discord zips). 512..10240."
  type        = number
  default     = 5120
}

variable "worker_reserved_concurrency" {
  description = "Cap on concurrent worker Lambdas. 0 = no reservation (account-level pool). New AWS accounts have a 10-execution ceiling and reject any reservation until you request a Lambda concurrency quota increase. Set > 0 once that's lifted."
  type        = number
  default     = 0
}

# ---- App secrets / config ----

variable "package_data_retention_days" {
  description = "How long to keep encrypted package blobs in S3 before lifecycle deletion. Acts as a passive GDPR-friendly cleanup."
  type        = number
  default     = 90
}

variable "package_data_presigned_url_ttl_seconds" {
  description = "TTL on the presigned download URL the API hands the client. Short = safer if the URL leaks."
  type        = number
  default     = 300
}

variable "wh_url" {
  description = "Optional Discord webhook URL the app pings for internal notifications (new package, errored package, etc.). Leave blank to disable."
  type        = string
  sensitive   = true
  default     = ""
}

variable "diswho_jwt_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "diswho_base_url" {
  type    = string
  default = ""
}

variable "dl_zip_whitelisted_domains" {
  type    = string
  default = ""
}
