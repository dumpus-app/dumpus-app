# Solves the first-apply chicken-and-egg between ECR and Lambda/ECS:
# CreateFunction (image_uri = ecr_repo:bootstrap) and ECS task definitions
# require the image to exist, but the image obviously doesn't exist until
# something pushes it.
#
# These null_resources run on first apply, pull the relevant public base
# image, and re-push it to our ECR with the :bootstrap tag. Lambda + ECS
# resources depend on it, so apply ordering becomes:
#   ECR repo → null_resource (push placeholder) → consumer
#
# After first apply, CI takes over: every push to main builds the real
# image and updates the consumer (Lambda update-function-code, ECS
# register-task-definition). The lifecycle.ignore_changes blocks on
# image_uri / container_definitions keep TF out of CI's way.
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

      if aws ecr describe-images \
            --repository-name "$${repo_name}" \
            --image-ids imageTag=bootstrap \
            --region "$${region}" >/dev/null 2>&1; then
        echo "bootstrap tag already present in $${repo_name}, skipping"
        exit 0
      fi

      aws ecr get-login-password --region "$${region}" \
        | docker login --username AWS --password-stdin "$${registry}"

      placeholder="public.ecr.aws/lambda/python:3.13"
      docker pull --platform linux/amd64 "$${placeholder}"
      docker tag  "$${placeholder}" "$${repo_url}:bootstrap"
      docker push "$${repo_url}:bootstrap"
    EOT
  }

  depends_on = [aws_ecr_repository.lambda]
}

resource "null_resource" "worker_bootstrap_image" {
  triggers = {
    repo_url = aws_ecr_repository.worker.repository_url
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      repo_url="${aws_ecr_repository.worker.repository_url}"
      registry="$${repo_url%%/*}"
      region="${var.region}"
      repo_name="${aws_ecr_repository.worker.name}"

      if aws ecr describe-images \
            --repository-name "$${repo_name}" \
            --image-ids imageTag=bootstrap \
            --region "$${region}" >/dev/null 2>&1; then
        echo "bootstrap tag already present in $${repo_name}, skipping"
        exit 0
      fi

      aws ecr get-login-password --region "$${region}" \
        | docker login --username AWS --password-stdin "$${registry}"

      # Plain Python base — what the worker image actually uses.
      placeholder="public.ecr.aws/docker/library/python:3.10-slim"
      docker pull --platform linux/amd64 "$${placeholder}"
      docker tag  "$${placeholder}" "$${repo_url}:bootstrap"
      docker push "$${repo_url}:bootstrap"
    EOT
  }

  depends_on = [aws_ecr_repository.worker]
}
