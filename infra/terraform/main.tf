locals {
  name = var.name_prefix
  fqdn = "${var.subdomain}.${var.domain_name}"
}

data "aws_route53_zone" "apex" {
  name         = var.domain_name
  private_zone = false
}

# Created already by the dumpus-api stack — look it up rather than create
# a duplicate (one IAM OIDC provider per account per issuer).
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}
