# GitHub Actions OIDC role — push images to ECR + roll new code into both Lambdas.
# Set var.github_repository to "" to skip provisioning.

variable "github_repository" {
  description = "Owner/repo allowed to assume the deploy role (e.g. Androz2091/dumpus-api). Empty = skip."
  type        = string
  default     = ""
}

variable "github_deploy_branches" {
  description = "Branches allowed to deploy"
  type        = list(string)
  default     = ["main"]
}

locals {
  github_oidc_enabled = var.github_repository != ""
}

resource "aws_iam_openid_connect_provider" "github" {
  count           = local.github_oidc_enabled ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume" {
  count = local.github_oidc_enabled ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github[0].arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        for branch in var.github_deploy_branches :
        "repo:${var.github_repository}:ref:refs/heads/${branch}"
      ]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  count              = local.github_oidc_enabled ? 1 : 0
  name               = "${local.name}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume[0].json
}

data "aws_iam_policy_document" "github_deploy" {
  count = local.github_oidc_enabled ? 1 : 0

  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [
      aws_ecr_repository.lambda.arn,
      aws_ecr_repository.worker.arn,
    ]
  }

  statement {
    sid = "LambdaUpdate"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:PublishVersion",
      "lambda:UpdateAlias",
      "lambda:GetAlias",
    ]
    resources = [
      aws_lambda_function.api.arn,
      aws_lambda_function.forwarder.arn,
    ]
  }

  # Register a new task definition revision per deploy so the next runTask
  # picks up the freshly-pushed image. DescribeTaskDefinition is needed to
  # read the existing revision as a starting point. RegisterTaskDefinition
  # has no resource-level permissions, hence "*".
  statement {
    sid = "EcsRegisterTaskDefinition"
    actions = [
      "ecs:RegisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
    ]
    resources = ["*"]
  }

  # CI re-passes the same task / execution roles when registering revisions.
  statement {
    sid     = "EcsPassTaskRoles"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.worker_task.arn,
      aws_iam_role.worker_task_execution.arn,
    ]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  count  = local.github_oidc_enabled ? 1 : 0
  name   = "${local.name}-github-deploy"
  role   = aws_iam_role.github_deploy[0].id
  policy = data.aws_iam_policy_document.github_deploy[0].json
}

output "github_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN secret in GitHub"
  value       = local.github_oidc_enabled ? aws_iam_role.github_deploy[0].arn : ""
}
