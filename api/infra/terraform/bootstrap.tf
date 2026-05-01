# Solves the first-apply chicken-and-egg between ECR and Lambda:
# CreateFunction (image_uri = ecr_repo:bootstrap) requires the image to exist,
# but the image obviously doesn't exist until something pushes it.
#
# This null_resource runs on first apply, pulls the public AWS Lambda Python
# base image, and re-pushes it to our ECR with the :bootstrap tag. The Lambda
# functions depend on it, so apply ordering becomes:
#   ECR repo → null_resource (push placeholder) → Lambdas
#
# After first apply, CI takes over: every push to main builds the real image
# and calls update-function-code, which Terraform ignores via the
# lifecycle.ignore_changes = [image_uri] block on the Lambda resources.
#
# Requires `docker` and `aws` CLI on the apply host.

resource "null_resource" "lambda_bootstrap_image" {
  triggers = {
    repo_url = aws_ecr_repository.lambda.repository_url
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      repo_url="${aws_ecr_repository.lambda.repository_url}"
      registry="$${repo_url%%/*}"
      region="${var.region}"
      repo_name="${aws_ecr_repository.lambda.name}"

      # Idempotent: skip if a :bootstrap image already exists (e.g. after CI
      # has run and the placeholder was overwritten with a real image, or after
      # a re-apply that re-creates this null_resource for any reason).
      if aws ecr describe-images \
            --repository-name "$${repo_name}" \
            --image-ids imageTag=bootstrap \
            --region "$${region}" >/dev/null 2>&1; then
        echo "bootstrap tag already present in $${repo_name}, skipping"
        exit 0
      fi

      aws ecr get-login-password --region "$${region}" \
        | docker login --username AWS --password-stdin "$${registry}"

      # The placeholder just needs to satisfy CreateFunction's image-exists
      # check; it is replaced on the first CI deploy. Pin a non-deprecated tag.
      placeholder="public.ecr.aws/lambda/python:3.13"
      docker pull --platform linux/amd64 "$${placeholder}"
      docker tag  "$${placeholder}" "$${repo_url}:bootstrap"
      docker push "$${repo_url}:bootstrap"
    EOT
  }

  depends_on = [aws_ecr_repository.lambda]
}
