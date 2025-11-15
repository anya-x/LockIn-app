# Terraform Outputs
# These values are displayed after terraform apply
# Useful for CI/CD, documentation, and connecting services

# ==============================================================================
# GENERAL INFORMATION
# ==============================================================================

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# ==============================================================================
# NETWORKING
# ==============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.networking.database_subnet_ids
}

# ==============================================================================
# LOAD BALANCER
# ==============================================================================

output "alb_dns_name" {
  description = "Load balancer DNS name - USE THIS TO ACCESS YOUR APP"
  value       = module.load_balancer.alb_dns_name
}

output "alb_url" {
  description = "Full URL to access the application"
  value       = var.alb_certificate_arn != "" ? "https://${module.load_balancer.alb_dns_name}" : "http://${module.load_balancer.alb_dns_name}"
}

output "alb_zone_id" {
  description = "Load balancer zone ID (for Route53)"
  value       = module.load_balancer.alb_zone_id
}

# ==============================================================================
# DATABASE
# ==============================================================================

output "db_endpoint" {
  description = "Database endpoint (hostname:port)"
  value       = module.database.db_endpoint
}

output "db_instance_id" {
  description = "RDS instance identifier"
  value       = module.database.db_instance_id
}

output "db_connection_command" {
  description = "Command to connect to database (for debugging)"
  value       = "psql -h ${module.database.db_endpoint} -U ${var.db_username} -d ${var.db_name}"
  sensitive   = false
}

# ==============================================================================
# ECS
# ==============================================================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "ecs_task_definition_arn" {
  description = "Latest ECS task definition ARN"
  value       = module.ecs.task_definition_arn
}

output "ecs_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = module.ecs.execution_role_arn
}

# ==============================================================================
# ECR
# ==============================================================================

output "ecr_repository_url" {
  description = "ECR repository URL - PUSH DOCKER IMAGES HERE"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.app.name
}

output "docker_push_commands" {
  description = "Commands to build and push Docker image"
  value = <<-EOT
    # 1. Authenticate Docker with ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}

    # 2. Build Docker image
    docker build -t ${local.app_name} ./backend

    # 3. Tag image
    docker tag ${local.app_name}:latest ${aws_ecr_repository.app.repository_url}:latest

    # 4. Push to ECR
    docker push ${aws_ecr_repository.app.repository_url}:latest
  EOT
}

# ==============================================================================
# SECRETS
# ==============================================================================

output "secrets_manager_arn" {
  description = "Secrets Manager ARN containing application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

output "secrets_manager_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.app_secrets.name
}

# ==============================================================================
# MONITORING
# ==============================================================================

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = module.ecs.log_group_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${local.name_prefix}-dashboard"
}

# ==============================================================================
# STORAGE
# ==============================================================================

output "s3_bucket_name" {
  description = "S3 bucket name for application assets"
  value       = module.storage.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.storage.bucket_arn
}

# ==============================================================================
# DOMAIN (if configured)
# ==============================================================================

output "domain_name" {
  description = "Custom domain name (if configured)"
  value       = var.domain_name != "" ? var.domain_name : "Not configured"
}

output "application_url" {
  description = "Primary URL to access application"
  value = var.domain_name != "" ? (
    var.alb_certificate_arn != "" ? "https://${var.domain_name}" : "http://${var.domain_name}"
  ) : module.load_balancer.alb_dns_name
}

# ==============================================================================
# SECURITY GROUPS
# ==============================================================================

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = module.security_groups.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = module.security_groups.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = module.security_groups.rds_security_group_id
}

# ==============================================================================
# COST ESTIMATION
# ==============================================================================

output "estimated_monthly_cost" {
  description = "Estimated monthly AWS cost (approximate)"
  value = <<-EOT
    Estimated Monthly Cost Breakdown:

    RDS (${var.db_instance_class}):           $${var.db_instance_class == "db.t3.micro" ? "15" : "30"}
    ECS Fargate (${var.app_container_cpu} CPU): $${var.app_container_cpu == 256 ? "5" : var.app_container_cpu == 512 ? "10" : "20"}
    ALB:                                       $16
    NAT Gateway:                               $${var.enable_nat_gateway ? (var.single_nat_gateway ? "32" : "64") : "0"}
    CloudWatch Logs:                           $10
    S3 Storage:                                $1
    Data Transfer (estimate):                  $10

    Total: ~$${var.db_instance_class == "db.t3.micro" && var.app_container_cpu == 512 && var.single_nat_gateway ? "94" : "150"}/month

    Note: Actual costs may vary based on usage, data transfer, and AWS pricing changes.
    Use AWS Cost Explorer for accurate tracking.
  EOT
}

# ==============================================================================
# DEPLOYMENT SUMMARY
# ==============================================================================

output "deployment_summary" {
  description = "Complete deployment information"
  value = <<-EOT
    ╔════════════════════════════════════════════════════════════════╗
    ║              LockIn App - Deployment Summary                   ║
    ╚════════════════════════════════════════════════════════════════╝

    Environment:    ${var.environment}
    Region:         ${var.aws_region}
    Account ID:     ${data.aws_caller_identity.current.account_id}

    ┌─ Application Access ─────────────────────────────────────────┐
    │ URL:  ${var.domain_name != "" ? var.domain_name : module.load_balancer.alb_dns_name}
    │ Health Check: ${module.load_balancer.alb_dns_name}${var.alb_health_check_path}
    └──────────────────────────────────────────────────────────────┘

    ┌─ Infrastructure Resources ───────────────────────────────────┐
    │ VPC:          ${module.networking.vpc_id}
    │ ECS Cluster:  ${module.ecs.cluster_name}
    │ ECS Service:  ${module.ecs.service_name}
    │ RDS Instance: ${module.database.db_instance_id}
    │ ECR Repo:     ${aws_ecr_repository.app.name}
    └──────────────────────────────────────────────────────────────┘

    ┌─ Next Steps ─────────────────────────────────────────────────┐
    │ 1. Push Docker image to ECR:
    │    See 'docker_push_commands' output
    │
    │ 2. Verify ECS tasks are running:
    │    aws ecs describe-services --cluster ${module.ecs.cluster_name} \
    │      --services ${module.ecs.service_name}
    │
    │ 3. Check application logs:
    │    aws logs tail ${module.ecs.log_group_name} --follow
    │
    │ 4. Test application:
    │    curl ${module.load_balancer.alb_dns_name}${var.alb_health_check_path}
    │
    │ 5. Monitor in CloudWatch:
    │    https://console.aws.amazon.com/cloudwatch
    └──────────────────────────────────────────────────────────────┘

    ╔════════════════════════════════════════════════════════════════╗
    ║  Need help? Check terraform/README.md for documentation       ║
    ╚════════════════════════════════════════════════════════════════╝
  EOT
}

# ==============================================================================
# WHY OUTPUTS MATTER (Mid→Senior Concept)
# ==============================================================================
#
# 1. AUTOMATION
# Outputs can be consumed by other Terraform projects:
#
#   data "terraform_remote_state" "app" {
#     backend = "s3"
#     config = {
#       bucket = "terraform-state"
#       key    = "app/terraform.tfstate"
#     }
#   }
#
#   resource "aws_route53_record" "app" {
#     zone_id = var.zone_id
#     name    = "app.example.com"
#     type    = "A"
#     alias {
#       name    = data.terraform_remote_state.app.outputs.alb_dns_name
#       zone_id = data.terraform_remote_state.app.outputs.alb_zone_id
#     }
#   }
#
# 2. CI/CD INTEGRATION
# GitHub Actions can use outputs:
#
#   - name: Get ECR URL
#     run: |
#       ECR_URL=$(terraform output -raw ecr_repository_url)
#       echo "ECR_URL=$ECR_URL" >> $GITHUB_ENV
#
# 3. DOCUMENTATION
# Outputs serve as living documentation
# Team knows exactly where resources are
#
# 4. DEBUGGING
# Quickly get resource identifiers without AWS Console
#
#   terraform output db_endpoint
#   terraform output -json | jq .alb_dns_name
#
# ==============================================================================
# SENSITIVE OUTPUTS
# ==============================================================================
#
# Mark outputs as sensitive to hide from logs:
#
#   output "db_password" {
#     value     = var.db_password
#     sensitive = true  # Won't show in terraform output
#   }
#
# Access with:
#   terraform output -raw db_password
#
# ==============================================================================
