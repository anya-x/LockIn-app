# Database Module Outputs

output "db_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_endpoint" {
  description = "Database connection endpoint (hostname:port)"
  value       = aws_db_instance.main.endpoint
}

output "db_address" {
  description = "Database hostname"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_resource_id" {
  description = "RDS resource ID (for IAM authentication)"
  value       = aws_db_instance.main.resource_id
}

output "db_subnet_group_name" {
  description = "Database subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "db_parameter_group_name" {
  description = "Database parameter group name"
  value       = aws_db_parameter_group.main.name
}
