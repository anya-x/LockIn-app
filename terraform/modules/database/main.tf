# Database Module - RDS PostgreSQL
# Managed relational database service with automated backups, patching, and scaling

# ==============================================================================
# RDS CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# What is RDS?
# - Managed PostgreSQL/MySQL/etc service
# - AWS handles: backups, patching, monitoring, failover
# - You handle: schema, queries, optimization
#
# Key Concepts:
#
# 1. MULTI-AZ DEPLOYMENT
#    Primary DB in AZ-A, standby replica in AZ-B
#    Automatic failover if primary fails (~60-120 seconds)
#    Synchronous replication (no data loss)
#    Use for: Production
#
# 2. READ REPLICAS
#    Async copies for read scaling
#    Can be in different region
#    Use for: Analytics, reporting
#    NOT for high availability (use Multi-AZ)
#
# 3. PARAMETER GROUPS
#    PostgreSQL configuration settings
#    shared_buffers, max_connections, etc.
#    Changes may require reboot
#
# 4. BACKUP STRATEGY
#    Automated daily backups (during backup window)
#    Point-in-time recovery (5-minute granularity)
#    Manual snapshots (kept until deleted)
#    Retention: 0-35 days
#
# 5. STORAGE AUTOSCALING
#    Automatically increases storage when threshold reached
#    Prevents outages from full disk
#    Max limit prevents runaway costs
#
# ==============================================================================

# ==============================================================================
# DB SUBNET GROUP
# ==============================================================================
# Groups database subnets across multiple AZs

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.identifier}-"
  description = "Database subnet group for ${var.identifier}"
  subnet_ids  = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-subnet-group"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# DB PARAMETER GROUP
# ==============================================================================
# Custom PostgreSQL configuration parameters

resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.identifier}-"
  family      = "postgres${split(".", var.engine_version)[0]}"  # e.g., postgres15
  description = "Custom parameter group for ${var.identifier}"

  # Optimize for our workload
  # These are production-ready settings

  # Connection settings
  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  # Memory settings
  # shared_buffers = 25% of RAM is typical starting point
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"  # 25% of instance memory
  }

  # Work memory for sorts/joins
  parameter {
    name  = "work_mem"
    value = "16384"  # 16MB per operation
  }

  # Maintenance memory for vacuum, index creation
  parameter {
    name  = "maintenance_work_mem"
    value = "262144"  # 256MB
  }

  # Effective cache size (hint to query planner)
  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"  # 75% of instance memory
  }

  # Logging
  parameter {
    name  = "log_min_duration_statement"
    value = var.log_slow_queries ? "1000" : "-1"  # Log queries > 1 second
  }

  parameter {
    name  = "log_connections"
    value = "1"  # Log all connections
  }

  parameter {
    name  = "log_disconnections"
    value = "1"  # Log all disconnections
  }

  # Statement timeout (prevent runaway queries)
  parameter {
    name  = "statement_timeout"
    value = "300000"  # 5 minutes max per query
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-param-group"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# RDS INSTANCE
# ==============================================================================
# The actual PostgreSQL database

resource "aws_db_instance" "main" {
  identifier = var.identifier

  # Engine configuration
  engine         = "postgres"
  engine_version = var.engine_version

  # Instance configuration
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage

  # Storage autoscaling
  max_allocated_storage = var.max_allocated_storage

  # Storage type
  # gp3 = latest generation SSD (cheaper and faster than gp2)
  storage_type          = var.storage_type
  storage_encrypted     = true  # ALWAYS encrypt!
  kms_key_id            = var.kms_key_id  # Use custom KMS key if provided

  # Database credentials
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids
  publicly_accessible    = false  # NEVER true for production!

  # High availability
  multi_az = var.multi_az

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window  # e.g., "03:00-04:00" UTC
  maintenance_window      = var.maintenance_window  # e.g., "Mon:04:00-Mon:05:00"

  # Enable automated backups
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Deletion protection
  deletion_protection = var.deletion_protection

  # Enhanced monitoring (sends metrics to CloudWatch)
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports
  monitoring_interval             = var.monitoring_interval  # 0, 1, 5, 10, 15, 30, 60 seconds
  monitoring_role_arn             = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  # Performance Insights (query performance monitoring)
  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention : null

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name

  # Auto minor version updates
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # Apply changes immediately or during maintenance window
  apply_immediately = var.apply_immediately

  # Copy tags to snapshots
  copy_tags_to_snapshot = true

  tags = merge(
    var.tags,
    {
      Name = var.identifier
    }
  )

  # Prevent accidental deletion via terraform destroy
  lifecycle {
    prevent_destroy = false  # Set to true for production after first deployment
  }
}

# ==============================================================================
# IAM ROLE FOR ENHANCED MONITORING
# ==============================================================================
# Required for RDS to send enhanced metrics to CloudWatch

resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name_prefix = "${var.identifier}-rds-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-rds-monitoring-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ==============================================================================
# CLOUDWATCH ALARMS (Optional but recommended)
# ==============================================================================
# Alert when database metrics exceed thresholds

resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"  # 5 minutes
  statistic           = "Average"
  threshold           = "80"  # 80% CPU
  alarm_description   = "Database CPU utilization is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2147483648"  # 2GB in bytes
  alarm_description   = "Database free storage space is low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.max_connections * 0.8  # 80% of max connections
  alarm_description   = "Database connection count is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}

# ==============================================================================
# RDS OPERATIONAL BEST PRACTICES
# ==============================================================================
#
# 1. BACKUP STRATEGY
#    - Automated daily backups: 7 days (dev), 35 days (prod)
#    - Manual snapshots before major changes
#    - Test restore procedure regularly!
#
# 2. MONITORING
#    - Enable Enhanced Monitoring (1-minute metrics)
#    - Enable Performance Insights (query analysis)
#    - Set up CloudWatch alarms
#    - Review slow query logs weekly
#
# 3. SECURITY
#    - Never publicly accessible
#    - Always encrypt at rest
#    - Rotate credentials via Secrets Manager
#    - Use IAM database authentication (advanced)
#    - Audit with Database Activity Streams (advanced)
#
# 4. PERFORMANCE
#    - Right-size instance based on CloudWatch metrics
#    - Monitor connection pool usage
#    - Use connection pooling (HikariCP in Spring Boot)
#    - Optimize slow queries (use Performance Insights)
#    - Consider read replicas for read-heavy workloads
#
# 5. COST OPTIMIZATION
#    - Reserved Instances for production (save 40-60%)
#    - Right-size instance (don't over-provision)
#    - Use gp3 storage (cheaper than gp2)
#    - Delete old manual snapshots
#    - Use Trusted Advisor for recommendations
#
# ==============================================================================
# DISASTER RECOVERY
# ==============================================================================
#
# RPO (Recovery Point Objective): How much data loss is acceptable?
# - Automated backups: 5-minute granularity
# - Multi-AZ: Zero data loss (synchronous replication)
#
# RTO (Recovery Time Objective): How quickly must we recover?
# - Multi-AZ failover: 60-120 seconds (automatic)
# - Restore from snapshot: 15-30 minutes (manual)
#
# DR Strategy:
# 1. Enable Multi-AZ for production (RTO: 2 minutes)
# 2. Automated backups with 35-day retention
# 3. Manual snapshots before deployments
# 4. Cross-region snapshot copy (for region failure)
# 5. Document and test restore procedures
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "Multi-AZ vs Read Replicas - what's the difference?"
# A:
# Multi-AZ:
# - Synchronous replication
# - Automatic failover
# - Same region
# - For high availability
# - Standby not accessible for reads
#
# Read Replicas:
# - Asynchronous replication
# - Manual promotion
# - Can be cross-region
# - For read scaling
# - Can serve read traffic
#
# Q: "How do you handle database migrations?"
# A:
# - Flyway on application startup
# - Backup before migration
# - Test on staging first
# - Use blue/green deployment for zero downtime
# - Rollback plan ready
#
# Q: "How do you optimize database performance?"
# A:
# - Enable Performance Insights
# - Review slow query logs
# - Optimize indexes
# - Monitor connection pool
# - Right-size instance based on metrics
# - Consider read replicas for reads
#
# ==============================================================================
