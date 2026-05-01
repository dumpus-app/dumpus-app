resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-igw" }
}

# Public subnets host the fck-nat instance.
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name}-public-${count.index}"
    Tier = "public"
  }
}

# Private subnets host RDS and the Lambda ENIs.
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 8)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${local.name}-private-${count.index}"
    Tier = "private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${local.name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --- fck-nat: a community-maintained NAT instance AMI. ~$3/mo on t4g.nano
# vs ~$35/mo for a managed NAT Gateway. See https://fck-nat.dev. ---

data "aws_ami" "fck_nat" {
  most_recent = true
  owners      = ["568608671756"] # fck-nat publisher

  # AWS provider v6 hard-fails most_recent lookups unless an owner is pinned
  # via owner-id or image-id. owners=[] satisfies that, but the explicit
  # filter is cheap belt-and-suspenders and keeps things working if a future
  # version tightens the rule further.
  filter {
    name   = "owner-id"
    values = ["568608671756"]
  }

  filter {
    name = "name"
    # AL2023 builds. The "fck-nat-nat64-*" prefix is a different (NAT64)
    # variant — the dash anchors keep us on the plain NAT image.
    values = ["fck-nat-al2023-*-arm64-ebs"]
  }
}

resource "aws_security_group" "fck_nat" {
  name        = "${local.name}-fck-nat"
  description = "Allow private subnets to NAT through this instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
    description = "From within VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-fck-nat" }
}

resource "aws_network_interface" "fck_nat" {
  subnet_id         = aws_subnet.public[0].id
  security_groups   = [aws_security_group.fck_nat.id]
  source_dest_check = false

  tags = { Name = "${local.name}-fck-nat-eni" }
}

resource "aws_eip" "fck_nat" {
  domain            = "vpc"
  network_interface = aws_network_interface.fck_nat.id
  tags              = { Name = "${local.name}-fck-nat-eip" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_instance" "fck_nat" {
  ami           = data.aws_ami.fck_nat.id
  instance_type = var.fck_nat_instance_type

  network_interface {
    network_interface_id = aws_network_interface.fck_nat.id
    device_index         = 0
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = { Name = "${local.name}-fck-nat" }

  # Ensure the EIP is attached to the ENI before the instance starts using it
  # — otherwise EIP association races with the instance's ENI attachment.
  depends_on = [aws_eip.fck_nat]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block           = "0.0.0.0/0"
    network_interface_id = aws_network_interface.fck_nat.id
  }

  tags = { Name = "${local.name}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# --- Security group attached to the Lambda ENIs ---

resource "aws_security_group" "lambda" {
  name        = "${local.name}-lambda"
  description = "Egress for Lambda ENIs"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-lambda" }
}
