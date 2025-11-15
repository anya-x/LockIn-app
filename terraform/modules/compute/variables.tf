# Compute Module Variables

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "service_name" {
  description = "ECS service name"
  type        = string
}

variable "family" {
  description = "Task definition family name"
  type        = string
}

# Networking
variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

# Container Configuration
variable "container_image" {
  description = "Docker image to run"
  type        = string
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8080
}

variable "container_cpu" {
  description = "CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Memory in MB"
  type        = number
  default     = 1024
}

# Task Count
variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "min_count" {
  description = "Minimum tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "max_count" {
  description = "Maximum tasks for auto-scaling"
  type        = number
  default     = 4
}

# Load Balancer
variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

# Database Configuration
variable "db_host" {
  description = "Database hostname"
  type        = string
  default     = ""
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = ""
  sensitive   = true
}

# Secrets
variable "secrets_arn" {
  description = "ARN of Secrets Manager secret"
  type        = string
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

# Monitoring
variable "enable_container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = false
}

# Auto-scaling
variable "enable_request_based_scaling" {
  description = "Enable request-based auto-scaling"
  type        = bool
  default     = false
}

variable "alb_resource_label" {
  description = "ALB resource label for request-based scaling"
  type        = string
  default     = ""
}

variable "target_requests_per_task" {
  description = "Target requests per task for auto-scaling"
  type        = number
  default     = 1000
}

# Deployment
variable "force_new_deployment" {
  description = "Force new deployment on apply"
  type        = bool
  default     = false
}

# Environment
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
