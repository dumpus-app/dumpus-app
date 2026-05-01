terraform {
  backend "s3" {
    bucket         = "dumpus-prod-tfstate"
    key            = "web/prod/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "dumpus-prod-tfstate-lock"
    encrypt        = true
  }
}
