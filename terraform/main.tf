# Main Terraform Configuration
# This file orchestrates all infrastructure modules

# ==============================================================================
# LOCAL VALUES
# ==============================================================================
# Locals are like variables but computed from other values
# They help avoid repetition and make code cleaner

locals {
  # Common resource naming convention
  # Format: {project}-{environment}-{resource}
  # Example: lockin-prod-vpc
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags merged with additional tags
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.additional_tags
  )

  # Application configuration
  app_name = "lockin-app"
  app_port = var.app_container_port

  # Database connection string (used by ECS task)
  # Format: postgresql://username:password@hostname:5432/database
  # NOTE: Password will be from Secrets Manager, not hardcoded
  db_connection_string_template = "postgresql://${var.db_username}:{{DB_PASSWORD}}@${module.database.db_endpoint}:5432/${var.db_name}"
}

# ==============================================================================
# DATA SOURCES
# ==============================================================================
# Data sources fetch information about existing AWS resources

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# ==============================================================================
# NETWORKING MODULE
# ==============================================================================
# Creates VPC, subnets, internet gateway, NAT gateway, route tables

module "networking" {
  source = "./modules/networking"

  # Naming
  name_prefix = local.name_prefix
  vpc_name    = "${local.name_prefix}-vpc"

  # Network configuration
  vpc_cidr                = var.vpc_cidr
  availability_zones      = var.availability_zones
  public_subnet_cidrs     = var.public_subnet_cidrs
  private_subnet_cidrs    = var.private_subnet_cidrs
  database_subnet_cidrs   = var.database_subnet_cidrs

  # NAT Gateway configuration
  enable_nat_gateway      = var.enable_nat_gateway
  single_nat_gateway      = var.single_nat_gateway

  # VPC endpoints (optional cost optimization)
  enable_vpc_endpoints    = var.enable_vpc_endpoints

  # Tags
  tags = local.common_tags
}

# ==============================================================================
# SECURITY GROUPS MODULE
# ==============================================================================
# Creates security groups for ALB, ECS, RDS

module "security_groups" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id

  # Application configuration
  app_port = local.app_port

  # Allow traffic from these CIDRs
  allowed_cidr_blocks = ["0.0.0.0/0"]  # CHANGE for production!

  tags = local.common_tags
}

# ==============================================================================
# DATABASE MODULE (RDS PostgreSQL)
# ==============================================================================
# Creates RDS instance, subnet group, parameter group

module "database" {
  source = "./modules/database"

  # Naming
  identifier = "${local.name_prefix}-db"

  # Network configuration
  vpc_id                  = module.networking.vpc_id
  subnet_ids              = module.networking.database_subnet_ids
  security_group_ids      = [module.security_groups.rds_security_group_id]

  # Instance configuration
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_allocated_storage
  engine_version          = var.db_engine_version

  # Database configuration
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = var.db_password

  # Backup and maintenance
  backup_retention_period = var.db_backup_retention_period
  multi_az                = var.db_multi_az
  deletion_protection     = var.db_deletion_protection

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.environment == "production"

  tags = local.common_tags
}

# ==============================================================================
# SECRETS MANAGEMENT
# ==============================================================================
# Stores sensitive application secrets in AWS Secrets Manager

resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${local.name_prefix}-app-secrets"
  description = "Application secrets for LockIn app"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  # Store secrets as JSON
  # ECS task will parse this and set environment variables
  secret_string = jsonencode({
    DB_PASSWORD          = var.db_password
    JWT_SECRET           = var.jwt_secret
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    DB_HOST              = module.database.db_endpoint
    DB_PORT              = "5432"
    DB_NAME              = var.db_name
    DB_USERNAME          = var.db_username
  })
}

# ==============================================================================
# ECR REPOSITORY
# ==============================================================================
# Docker image registry for application containers

resource "aws_ecr_repository" "app" {
  name                 = "${local.name_prefix}-app"
  image_tag_mutability = "MUTABLE"

  # Scan images for vulnerabilities
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encryption at rest
  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = local.common_tags
}

# ECR lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ==============================================================================
# APPLICATION LOAD BALANCER
# ==============================================================================
# Distributes traffic to ECS tasks

module "load_balancer" {
  source = "./modules/load-balancer"

  name_prefix = local.name_prefix

  # Network configuration
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.public_subnet_ids
  security_group_ids = [module.security_groups.alb_security_group_id]

  # Target group configuration
  target_port        = local.app_port
  health_check_path  = var.alb_health_check_path
  health_check_interval = var.alb_health_check_interval

  # HTTPS configuration (optional)
  certificate_arn    = var.alb_certificate_arn

  tags = local.common_tags
}

# ==============================================================================
# ECS CLUSTER AND SERVICE
# ==============================================================================
# Runs application containers on AWS Fargate

module "ecs" {
  source = "./modules/compute"

  # Naming
  cluster_name = "${local.name_prefix}-cluster"
  service_name = "${local.name_prefix}-service"
  family       = local.app_name

  # Network configuration
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_security_group_id]

  # Container configuration
  container_image    = "${aws_ecr_repository.app.repository_url}:${var.app_image_tag}"
  container_port     = local.app_port
  container_cpu      = var.app_container_cpu
  container_memory   = var.app_container_memory

  # Task count and autoscaling
  desired_count      = var.app_desired_count
  min_count          = var.app_min_count
  max_count          = var.app_max_count

  # Load balancer integration
  target_group_arn   = module.load_balancer.target_group_arn

  # Secrets and environment variables
  secrets_arn        = aws_secretsmanager_secret.app_secrets.arn

  # CloudWatch logging
  log_retention_days = var.log_retention_days

  # Container Insights
  enable_container_insights = var.enable_container_insights

  # Environment
  environment = var.environment

  tags = local.common_tags
}

# ==============================================================================
# CLOUDWATCH MONITORING
# ==============================================================================
# Creates alarms and dashboards

module "monitoring" {
  source = "./modules/monitoring"

  name_prefix = local.name_prefix

  # Resources to monitor
  alb_arn        = module.load_balancer.alb_arn
  target_group_arn = module.load_balancer.target_group_arn
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  db_instance_id   = module.database.db_instance_id

  # Alarm configuration
  alarm_email = var.alarm_email

  # Environment
  environment = var.environment

  tags = local.common_tags
}

# ==============================================================================
# S3 BUCKET FOR APPLICATION ASSETS
# ==============================================================================
# Optional: Store static files, logs, backups

module "storage" {
  source = "./modules/storage"

  name_prefix = local.name_prefix
  environment = var.environment

  # Bucket configuration
  enable_versioning = var.environment == "production"
  lifecycle_rules = [
    {
      id      = "delete-old-logs"
      enabled = true
      prefix  = "logs/"
      expiration_days = 90
    }
  ]

  tags = local.common_tags
}

# ==============================================================================
# ROUTE53 (OPTIONAL)
# ==============================================================================
# DNS configuration if domain is provided

resource "aws_route53_record" "app" {
  count   = var.domain_name != "" && var.route53_zone_id != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.load_balancer.alb_dns_name
    zone_id                = module.load_balancer.alb_zone_id
    evaluate_target_health = true
  }
}

# ==============================================================================
# UNDERSTANDING MODULE DEPENDENCIES (Mid→Senior Concept)
# ==============================================================================
#
# Terraform automatically determines execution order based on resource references:
#
# 1. networking module (no dependencies)
# 2. security_groups module (depends on networking.vpc_id)
# 3. database module (depends on networking subnets + security_groups)
# 4. ECR repository (independent)
# 5. load_balancer module (depends on networking + security_groups)
# 6. ecs module (depends on load_balancer, ECR, database, secrets)
# 7. monitoring module (depends on all above)
#
# This is called a "dependency graph" - Terraform builds it automatically!
#
# You can visualize it:
#   terraform graph | dot -Tsvg > graph.svg
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "Why use modules instead of one big file?"
# A:
# - Reusability across environments
# - Easier testing
# - Better organization
# - Can version modules separately
# - Team can own different modules
#
# Q: "How do you handle secrets?"
# A:
# - Never in code or variables
# - AWS Secrets Manager for runtime secrets
# - Parameter Store for configuration
# - ECS tasks fetch at startup
# - Rotation supported
#
# Q: "How do you ensure zero downtime deployments?"
# A:
# - ECS creates new tasks before stopping old ones
# - ALB health checks ensure tasks are ready
# - Deployment circuit breaker stops bad deploys
# - Blue/green deployment option available
#
# Q: "How do you handle database migrations?"
# A:
# - Flyway runs on app startup
# - ECS task definition includes migration command
# - Or separate ECS task for migrations
# - Database backups before major changes
#
# ==============================================================================
