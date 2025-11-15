# Load Balancer Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs (must be in at least 2 AZs)"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

# Target Group Configuration
variable "target_port" {
  description = "Port on which targets receive traffic"
  type        = number
  default     = 8080
}

# Health Check Configuration
variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/actuator/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "healthy_threshold" {
  description = "Number of consecutive successful health checks"
  type        = number
  default     = 2
}

variable "unhealthy_threshold" {
  description = "Number of consecutive failed health checks"
  type        = number
  default     = 3
}

# Connection Settings
variable "deregistration_delay" {
  description = "Time to wait before deregistering targets (seconds)"
  type        = number
  default     = 30
}

variable "idle_timeout" {
  description = "Idle timeout for connections (seconds)"
  type        = number
  default     = 60
}

# Stickiness (Session Affinity)
variable "enable_stickiness" {
  description = "Enable session stickiness"
  type        = bool
  default     = false
}

variable "stickiness_duration" {
  description = "Stickiness duration in seconds"
  type        = number
  default     = 86400  # 24 hours
}

# SSL/TLS
variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (leave empty for HTTP only)"
  type        = string
  default     = ""
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

# Access Logs
variable "access_logs_bucket" {
  description = "S3 bucket for access logs (leave empty to disable)"
  type        = string
  default     = ""
}

variable "access_logs_prefix" {
  description = "S3 prefix for access logs"
  type        = string
  default     = "alb-logs"
}

# Protection
variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false  # Set to true for production
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
