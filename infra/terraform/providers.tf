provider "aws" {
  region              = var.region
  allowed_account_ids = var.allowed_account_ids

  default_tags {
    tags = {
      Project     = "dumpus-app"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront ACM certs MUST live in us-east-1 regardless of where the rest
# of the stack runs. This alias is used only for aws_acm_certificate.web.
provider "aws" {
  alias               = "us_east_1"
  region              = "us-east-1"
  allowed_account_ids = var.allowed_account_ids

  default_tags {
    tags = {
      Project     = "dumpus-app"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
