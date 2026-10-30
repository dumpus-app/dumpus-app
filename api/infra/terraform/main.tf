locals {
  name     = "${var.name_prefix}-${var.environment}"
  api_fqdn = "${var.api_subdomain}.${var.domain_name}"
}

data "aws_availability_zones" "available" {
  state = "available"
}
