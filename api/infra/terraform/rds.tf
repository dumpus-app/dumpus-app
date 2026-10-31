resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "Postgres access from Lambdas"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-rds" }
}

resource "aws_security_group_rule" "rds_from_lambda" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.lambda.id
  description              = "Postgres from Lambda ENIs"
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db"
  subnet_ids = aws_subnet.private[*].id
}

# Custom parameter group so we can flip rds.force_ssl on. The default
# parameter group is read-only.
resource "aws_db_parameter_group" "main" {
  name   = "${local.name}-postgres17"
  family = "postgres17"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
    # Static parameter — requires a reboot to take effect. RDS handles
    # the reboot during the next maintenance window or you can force it.
    apply_method = "pending-reboot"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name}-postgres"
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.postgres_instance_class

  allocated_storage     = var.postgres_allocated_storage
  max_allocated_storage = var.postgres_max_allocated_storage > 0 ? var.postgres_max_allocated_storage : null
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name              = var.postgres_db_name
  username             = var.postgres_username
  password             = random_password.postgres.result
  parameter_group_name = aws_db_parameter_group.main.name

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az                = var.postgres_multi_az
  backup_retention_period = 7
  backup_window           = "02:00-03:00"
  maintenance_window      = "Mon:03:30-Mon:04:30"

  auto_minor_version_upgrade = true
  deletion_protection        = true
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${local.name}-postgres-final-${formatdate("YYYYMMDDhhmm", timestamp())}"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  lifecycle {
    ignore_changes = [final_snapshot_identifier, password]
  }
}
