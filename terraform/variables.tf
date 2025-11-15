# Terraform Variables
# Variables make infrastructure flexible and reusable across environments

# ==============================================================================
# GENERAL CONFIGURATION
# ==============================================================================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.aws_region))
    error_message = "Region must be valid AWS region format (e.g., us-east-1)"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production"
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "lockin"
}

variable "owner" {
  description = "Owner of the infrastructure (for tagging)"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

# ==============================================================================
# NETWORKING
# ==============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be valid IPv4 CIDR block"
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones required for high availability"
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets (costs ~$32/month)"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cheaper) vs one per AZ (more reliable)"
  type        = bool
  default     = true  # Set to false for production
}

# ==============================================================================
# DATABASE (RDS)
# ==============================================================================

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"  # 2 vCPU, 1GB RAM - good for dev/small prod

  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "Instance class must be valid RDS instance type"
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 65536
    error_message = "Storage must be between 20 and 65536 GB"
  }
}

variable "db_max_allocated_storage" {
  description = "Maximum storage for autoscaling (0 to disable)"
  type        = number
  default     = 100
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "lockin"
}

variable "db_username" {
  description = "Master username for database"
  type        = string
  default     = "lockin_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for database (use strong password!)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "Database password must be at least 16 characters"
  }
}

variable "db_backup_retention_period" {
  description = "Backup retention in days (0-35)"
  type        = number
  default     = 7  # 7 days for dev, 35 for production
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for high availability"
  type        = bool
  default     = false  # Set to true for production
}

variable "db_deletion_protection" {
  description = "Prevent accidental database deletion"
  type        = bool
  default     = true  # ALWAYS true for production
}

# ==============================================================================
# ECS FARGATE
# ==============================================================================

variable "app_container_cpu" {
  description = "CPU units for container (256 = 0.25 vCPU)"
  type        = number
  default     = 512  # 0.5 vCPU

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.app_container_cpu)
    error_message = "CPU must be valid Fargate value: 256, 512, 1024, 2048, 4096"
  }
}

variable "app_container_memory" {
  description = "Memory for container in MB"
  type        = number
  default     = 1024  # 1 GB

  validation {
    condition     = var.app_container_memory >= 512 && var.app_container_memory <= 30720
    error_message = "Memory must be between 512 MB and 30720 MB"
  }
}

variable "app_container_port" {
  description = "Port the Spring Boot app listens on"
  type        = number
  default     = 8080
}

variable "app_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2  # Run 2 tasks for redundancy
}

variable "app_min_count" {
  description = "Minimum number of tasks for autoscaling"
  type        = number
  default     = 1
}

variable "app_max_count" {
  description = "Maximum number of tasks for autoscaling"
  type        = number
  default     = 4
}

variable "app_image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  type        = string
  default     = ""  # Will be created by Terraform
}

# ==============================================================================
# LOAD BALANCER
# ==============================================================================

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for HTTPS (leave empty for HTTP only)"
  type        = string
  default     = ""
}

variable "alb_health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/actuator/health"
}

variable "alb_health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "alb_health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "alb_healthy_threshold" {
  description = "Healthy threshold count"
  type        = number
  default     = 2
}

variable "alb_unhealthy_threshold" {
  description = "Unhealthy threshold count"
  type        = number
  default     = 3
}

# ==============================================================================
# MONITORING
# ==============================================================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7  # 7 days for dev, 30+ for production

  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention must be valid CloudWatch retention period"
  }
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights (costs extra)"
  type        = bool
  default     = false  # Set to true for production monitoring
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = ""
}

# ==============================================================================
# APPLICATION SECRETS
# ==============================================================================

variable "jwt_secret" {
  description = "JWT secret for token signing (minimum 32 characters)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT secret must be at least 32 characters"
  }
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  default     = ""
  sensitive   = true
}

# ==============================================================================
# FEATURE FLAGS
# ==============================================================================

variable "enable_prometheus" {
  description = "Deploy Prometheus on ECS"
  type        = bool
  default     = false  # Set to true if you want Prometheus in AWS
}

variable "enable_grafana" {
  description = "Deploy Grafana on ECS"
  type        = bool
  default     = false  # Set to true if you want Grafana in AWS
}

variable "enable_vpc_endpoints" {
  description = "Create VPC endpoints for AWS services (saves NAT costs)"
  type        = bool
  default     = false  # Set to true for cost optimization
}

# ==============================================================================
# DOMAIN AND DNS
# ==============================================================================

variable "domain_name" {
  description = "Domain name for the application (e.g., lockin.example.com)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID (leave empty to skip DNS)"
  type        = string
  default     = ""
}

# ==============================================================================
# TAGS
# ==============================================================================

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ==============================================================================
# VARIABLE LEARNING NOTES
# ==============================================================================
#
# Why use validation blocks?
# - Catch errors early (before AWS API calls)
# - Document constraints
# - Prevent invalid configurations
#
# Why mark variables as sensitive?
# - Prevents values from appearing in logs
# - Masked in terraform plan output
# - Still stored in state file (encrypt state!)
#
# Default values strategy:
# - Dev defaults: cheap, single AZ, small instances
# - Production: override in terraform.tfvars or environment variables
#
# Variable precedence (highest to lowest):
# 1. Command line: -var="environment=prod"
# 2. terraform.tfvars file
# 3. Environment variables: TF_VAR_environment=prod
# 4. Default values in variables.tf
