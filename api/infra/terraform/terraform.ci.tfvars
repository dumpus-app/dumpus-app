# Non-sensitive tfvars committed to the repo, used by the infra GitHub Actions
# workflow. Sensitive values (diswho_jwt_secret, wh_url) come in via TF_VAR_*
# env from GitHub secrets — never commit those here.

region      = "eu-west-1"
environment = "prod"

allowed_account_ids = ["436630934006"]

domain_name   = "dumpus.app"
api_subdomain = "api"

github_repository = "dumpus-app/dumpus-api"

image_tag = "bootstrap"

diswho_base_url            = "https://diswho.androz2091.fr"
dl_zip_whitelisted_domains = ""

# Fargate worker sizing. 2 vCPU + 8 GB is plenty headroom over the previous
# Lambda's max (3 GB / 1.7 GB used) and bumps CPU enough that even heavy
# packages finish well under any deadline.
worker_task_cpu    = 2048
worker_task_memory = 8192
