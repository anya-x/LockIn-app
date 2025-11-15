# Networking Module - VPC, Subnets, NAT, Internet Gateway
# This module creates a production-ready VPC with public, private, and database subnets

# ==============================================================================
# VPC (Virtual Private Cloud)
# ==============================================================================
# Think of VPC as your own isolated data center in AWS

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  # Enable DNS resolution and hostnames
  # Required for RDS endpoints to work properly
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = var.vpc_name
    }
  )
}

# ==============================================================================
# INTERNET GATEWAY
# ==============================================================================
# Allows resources in public subnets to access the internet

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-igw"
    }
  )
}

# ==============================================================================
# PUBLIC SUBNETS
# ==============================================================================
# For resources that need direct internet access (ALB, NAT Gateway)

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true  # Auto-assign public IPs

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-${var.availability_zones[count.index]}"
      Type = "public"
      Tier = "public"
    }
  )
}

# ==============================================================================
# PRIVATE SUBNETS
# ==============================================================================
# For application servers (ECS tasks)
# Can access internet through NAT Gateway but not directly accessible from internet

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-${var.availability_zones[count.index]}"
      Type = "private"
      Tier = "application"
    }
  )
}

# ==============================================================================
# DATABASE SUBNETS
# ==============================================================================
# Isolated subnets for RDS (best practice for security)

resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database-${var.availability_zones[count.index]}"
      Type = "private"
      Tier = "database"
    }
  )
}

# ==============================================================================
# NAT GATEWAY
# ==============================================================================
# Allows private subnets to access internet (for package downloads, API calls)
# WARNING: Costs ~$32/month per NAT Gateway

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  domain = "vpc"

  # NAT Gateway must be created before destroying
  depends_on = [aws_internet_gateway.main]

  tags = merge(
    var.tags,
    {
      Name = var.single_nat_gateway ? "${var.name_prefix}-nat-eip" : "${var.name_prefix}-nat-eip-${var.availability_zones[count.index]}"
    }
  )
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name = var.single_nat_gateway ? "${var.name_prefix}-nat" : "${var.name_prefix}-nat-${var.availability_zones[count.index]}"
    }
  )

  # NAT needs IGW to be created first
  depends_on = [aws_internet_gateway.main]
}

# ==============================================================================
# ROUTE TABLES
# ==============================================================================
# Route tables define how traffic flows in/out of subnets

# Public Route Table (routes to Internet Gateway)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"  # All traffic
    gateway_id = aws_internet_gateway.main.id  # Goes to internet
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-rt"
      Type = "public"
    }
  )
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table (routes to NAT Gateway)
resource "aws_route_table" "private" {
  count  = var.enable_nat_gateway ? length(var.private_subnet_cidrs) : 1
  vpc_id = aws_vpc.main.id

  # Only add NAT route if NAT Gateway is enabled
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-rt-${count.index}"
      Type = "private"
    }
  )
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

# Database Route Table (no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  # No routes = no internet access (most secure for database)

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-database-rt"
      Type = "database"
    }
  )
}

# Associate database subnets with database route table
resource "aws_route_table_association" "database" {
  count = length(var.database_subnet_cidrs)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# ==============================================================================
# VPC ENDPOINTS (Optional cost optimization)
# ==============================================================================
# VPC endpoints allow private access to AWS services without NAT Gateway
# Saves NAT Gateway data transfer costs

# S3 Gateway Endpoint (free!)
resource "aws_vpc_endpoint" "s3" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.private[0].id],
    [aws_route_table.database.id]
  )

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-s3-endpoint"
    }
  )
}

# ECR API Endpoint (for pulling Docker images)
resource "aws_vpc_endpoint" "ecr_api" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints[0].id]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-ecr-api-endpoint"
    }
  )
}

# ECR Docker Endpoint
resource "aws_vpc_endpoint" "ecr_dkr" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints[0].id]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-ecr-dkr-endpoint"
    }
  )
}

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  count = var.enable_vpc_endpoints ? 1 : 0

  name_prefix = "${var.name_prefix}-vpc-endpoints-"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpc-endpoints-sg"
    }
  )
}

# ==============================================================================
# DATA SOURCES
# ==============================================================================

data "aws_region" "current" {}

# ==============================================================================
# NETWORKING CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# 1. CIDR NOTATION
# 10.0.0.0/16 means:
# - Network: 10.0.0.0
# - Netmask: 255.255.0.0
# - Usable IPs: 65,536 (10.0.0.0 - 10.0.255.255)
# - /16 = first 16 bits are network, last 16 bits are hosts
#
# 10.0.1.0/24 means:
# - Usable IPs: 256 (10.0.1.0 - 10.0.1.255)
# - /24 = first 24 bits are network, last 8 bits are hosts
#
# 2. SUBNET SIZING
# Rule of thumb:
# - /16 for VPC (65k IPs)
# - /24 for subnets (256 IPs each)
# - Leave room for growth!
#
# 3. PUBLIC VS PRIVATE SUBNETS
# Public:
# - Has route to Internet Gateway
# - Resources get public IPs
# - Used for: ALB, NAT Gateway
#
# Private:
# - Routes to NAT Gateway (if needed)
# - No public IPs
# - Used for: Application servers, databases
#
# 4. MULTI-AZ STRATEGY
# Best practice: Spread resources across multiple AZs
# - If AZ fails, app stays up
# - ALB distributes traffic across AZs
# - RDS can failover to standby in different AZ
#
# 5. NAT GATEWAY COST OPTIMIZATION
# Single NAT Gateway:
# - Cheaper (~$32/month)
# - Single point of failure
# - Good for dev/staging
#
# NAT per AZ:
# - More expensive (~$64/month for 2 AZs)
# - High availability
# - Required for production
#
# VPC Endpoints:
# - Can reduce/eliminate NAT costs
# - S3 endpoint is free!
# - ECR endpoints cost $7/month but save NAT data transfer
#
# ==============================================================================
