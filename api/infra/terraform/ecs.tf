# Fargate worker.
#
# Replaces the old SQS-triggered worker Lambda. The forwarder Lambda
# (lambda.tf) consumes SQS and fires one Fargate task per message via
# ecs.run_task(); each task processes its package and exits.
#
# Why Fargate instead of Lambda for the worker:
# - No 15-min wall clock cap (heavy users blew through it on Lambda).
# - No 3008 MB / 10 GB memory cap that hits new AWS accounts before they
#   request a Lambda quota increase.
# - Pay-per-task with cold-start ~30s, which is irrelevant against jobs
#   that run for minutes.

resource "aws_ecs_cluster" "main" {
  name = "${local.name}-workers"
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/ecs/${local.name}-worker"
  retention_in_days = 30
}

# --- Task IAMs ---

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: used by the ECS agent to pull the image and write logs.
# Needs nothing app-specific.
resource "aws_iam_role" "worker_task_execution" {
  name               = "${local.name}-worker-task-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "worker_task_execution" {
  role       = aws_iam_role.worker_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Task role: used by the worker process itself. Same permissions the old
# worker Lambda role had, scoped to the resources the worker actually uses.
resource "aws_iam_role" "worker_task" {
  name               = "${local.name}-worker-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

data "aws_iam_policy_document" "worker_task" {
  statement {
    sid     = "ReadAppSecrets"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.postgres_url.arn,
      aws_secretsmanager_secret.diswho_jwt_secret.arn,
      aws_secretsmanager_secret.wh_url.arn,
      aws_secretsmanager_secret.discord_bot_token.arn,
    ]
  }

  statement {
    sid       = "WritePackageBlobs"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.package_data.arn}/*"]
  }
}

resource "aws_iam_role_policy" "worker_task" {
  name   = "${local.name}-worker-task"
  role   = aws_iam_role.worker_task.id
  policy = data.aws_iam_policy_document.worker_task.json
}

# --- Networking ---

resource "aws_security_group" "worker_task" {
  name        = "${local.name}-worker-task"
  description = "Egress for Fargate worker tasks"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-worker-task" }
}

# Worker tasks reach Postgres through this rule (mirrors the Lambda one).
resource "aws_security_group_rule" "rds_from_worker_task" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.worker_task.id
  description              = "Postgres from Fargate worker tasks"
}

# --- Task definition ---

locals {
  worker_image_uri     = "${aws_ecr_repository.worker.repository_url}:${var.image_tag}"
  worker_container_name = "${local.name}-worker"
}

resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name}-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  cpu    = tostring(var.worker_task_cpu)
  memory = tostring(var.worker_task_memory)

  ephemeral_storage {
    # /tmp space for downloaded Discord zips. Default Fargate ephemeral is
    # 20 GiB; 21..200 GiB are valid override values. Use the variable so we
    # can grow it without code changes.
    size_in_gib = var.worker_task_ephemeral_storage_gib
  }

  execution_role_arn = aws_iam_role.worker_task_execution.arn
  task_role_arn      = aws_iam_role.worker_task.arn

  container_definitions = jsonencode([
    {
      name  = local.worker_container_name
      image = local.worker_image_uri

      essential = true

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.worker.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "task"
        }
      }

      environment = [
        for k, v in local.app_environment : { name = k, value = tostring(v) }
      ]
    }
  ])

  # Deploy workflow registers new revisions via aws ecs register-task-definition
  # on every push (just bumps the image tag). TF owns the rest of the spec; the
  # ignore_changes block prevents apply from clobbering the active revision.
  lifecycle {
    ignore_changes = [container_definitions]
  }

  depends_on = [
    aws_cloudwatch_log_group.worker,
    null_resource.worker_bootstrap_image,
  ]
}
