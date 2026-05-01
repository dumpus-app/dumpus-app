resource "random_password" "postgres" {
  # Alphanumeric only: any of `:`, `?`, `&`, `=`, `@`, `/` would otherwise need
  # URL-encoding before being spliced into the SQLAlchemy URL, and SQLAlchemy
  # treats them as URL syntax if it sees them raw. 32 alnum chars give ~190 bits
  # of entropy, which is plenty.
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "postgres_password" {
  name                    = "${local.name}/postgres/password"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "postgres_password" {
  secret_id     = aws_secretsmanager_secret.postgres_password.id
  secret_string = random_password.postgres.result
}

resource "aws_secretsmanager_secret" "postgres_url" {
  name                    = "${local.name}/postgres/url"
  description             = "SQLAlchemy URL consumed by the app"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "postgres_url" {
  secret_id = aws_secretsmanager_secret.postgres_url.id
  secret_string = format(
    "postgresql+psycopg2://%s:%s@%s:%d/%s",
    var.postgres_username,
    random_password.postgres.result,
    aws_db_instance.main.address,
    aws_db_instance.main.port,
    var.postgres_db_name,
  )
}

resource "aws_secretsmanager_secret" "diswho_jwt_secret" {
  name                    = "${local.name}/app/diswho-jwt-secret"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "diswho_jwt_secret" {
  secret_id     = aws_secretsmanager_secret.diswho_jwt_secret.id
  secret_string = var.diswho_jwt_secret

  # TF seeds the value on first apply. After that, rotate via
  # `aws secretsmanager put-secret-value`; this prevents tofu apply from
  # reverting the rotation.
  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "wh_url" {
  name                    = "${local.name}/app/wh-url"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "wh_url" {
  secret_id     = aws_secretsmanager_secret.wh_url.id
  secret_string = var.wh_url

  lifecycle {
    ignore_changes = [secret_string]
  }
}
