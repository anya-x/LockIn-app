# Monitoring Module - CloudWatch Alarms and Dashboards
# Proactive monitoring for production applications

# ==============================================================================
# MONITORING CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# Why Monitoring Matters:
# - Detect issues before users complain
# - Understand system behavior
# - Capacity planning
# - Troubleshooting
# - SLA compliance
#
# Key Metrics to Monitor:
#
# 1. THE FOUR GOLDEN SIGNALS (Google SRE)
#    - Latency: How long requests take
#    - Traffic: How many requests
#    - Errors: How many failures
#    - Saturation: How full the system is
#
# 2. APPLICATION METRICS
#    - Request count
#    - Response time (P50, P95, P99)
#    - Error rate
#    - Active connections
#
# 3. INFRASTRUCTURE METRICS
#    - CPU utilization
#    - Memory usage
#    - Disk space
#    - Network throughput
#
# 4. DATABASE METRICS
#    - Connection count
#    - Query latency
#    - Deadlocks
#    - Replication lag
#
# CloudWatch Concepts:
#
# METRICS:
# - Time-ordered data points
# - Namespace, dimensions, name
# - 1-minute or 5-minute resolution
# - Retained for 15 months
#
# ALARMS:
# - Trigger actions when metric crosses threshold
# - States: OK, ALARM, INSUFFICIENT_DATA
# - Can send to SNS, trigger Auto Scaling, etc.
#
# DASHBOARDS:
# - Visual representation of metrics
# - Real-time and historical views
# - Shareable via URL
#
# ==============================================================================

# ==============================================================================
# SNS TOPIC FOR ALARMS
# ==============================================================================
# CloudWatch alarms send notifications here

resource "aws_sns_topic" "alarms" {
  name_prefix = "${var.name_prefix}-alarms-"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-alarms"
    }
  )
}

# Email subscription for alarms
resource "aws_sns_topic_subscription" "alarms_email" {
  count = var.alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ==============================================================================
# ALB ALARMS
# ==============================================================================

# High 5xx error rate
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "ALB is seeing high 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = split("/", var.alb_arn)[1]
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# High response time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"  # 5 seconds
  alarm_description   = "ALB target response time is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = split("/", var.alb_arn)[1]
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# Unhealthy target count
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "${var.name_prefix}-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "ALB has unhealthy targets"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = split(":", var.target_group_arn)[5]
    LoadBalancer = split("/", var.alb_arn)[1]
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# ==============================================================================
# ECS ALARMS
# ==============================================================================

# High CPU utilization
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${var.name_prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS service CPU is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# High memory utilization
resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  alarm_name          = "${var.name_prefix}-ecs-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "ECS service memory is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# Running task count too low
resource "aws_cloudwatch_metric_alarm" "ecs_running_tasks" {
  alarm_name          = "${var.name_prefix}-ecs-low-task-count"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ECS service has too few running tasks"
  treat_missing_data  = "breaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# ==============================================================================
# RDS ALARMS
# ==============================================================================

# High CPU
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS CPU utilization is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# Low free storage
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.name_prefix}-rds-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5368709120"  # 5GB in bytes
  alarm_description   = "RDS free storage is low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# High database connections
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.name_prefix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"  # Adjust based on max_connections
  alarm_description   = "RDS connection count is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# ==============================================================================
# CLOUDWATCH DASHBOARD
# ==============================================================================
# Visual monitoring dashboard

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # ALB Request Count
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "ALB Request Count"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # ALB Response Time
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "Average" }],
            ["...", { stat = "p99", label = "P99" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ALB Response Time"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # ECS CPU and Memory
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "CPU %" }],
            [".", "MemoryUtilization", { stat = "Average", label = "Memory %" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ECS Resource Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      # RDS CPU
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", {
              stat = "Average",
              dimensions = {
                DBInstanceIdentifier = var.db_instance_id
              }
            }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "RDS CPU Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      # RDS Connections
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", {
              stat = "Average",
              dimensions = {
                DBInstanceIdentifier = var.db_instance_id
              }
            }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "RDS Database Connections"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# ==============================================================================
# DATA SOURCES
# ==============================================================================

data "aws_region" "current" {}

# ==============================================================================
# MONITORING BEST PRACTICES
# ==============================================================================
#
# 1. ALERT FATIGUE
#    - Don't alert on everything
#    - Only alert on actionable items
#    - Set appropriate thresholds
#    - Use evaluation periods to avoid flapping
#
# 2. SEVERITY LEVELS
#    Critical: Page immediately (5xx errors, service down)
#    Warning: Alert during business hours (high CPU)
#    Info: Log only (high traffic)
#
# 3. RUNBOOKS
#    For each alarm, document:
#    - What it means
#    - How to investigate
#    - How to fix
#    - Example: "High CPU -> Check ECS metrics -> Scale up tasks"
#
# 4. SLOs (Service Level Objectives)
#    Define targets:
#    - 99.9% availability (43 min downtime/month)
#    - P95 latency < 1 second
#    - Error rate < 0.1%
#
# 5. ON-CALL ROTATION
#    - Rotate on-call duties
#    - Escalation policies
#    - Incident response process
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "What metrics do you monitor in production?"
# A:
# - The Four Golden Signals (latency, traffic, errors, saturation)
# - Application: request count, response time, error rate
# - Infrastructure: CPU, memory, disk, network
# - Database: connections, query latency, locks
# - Business: users, revenue, conversions
#
# Q: "How do you prevent alert fatigue?"
# A:
# - Alert only on actionable items
# - Appropriate thresholds
# - Evaluation periods (don't alert on spikes)
# - Severity levels
# - Regular review and tuning
#
# Q: "How do you respond to production incidents?"
# A:
# 1. Acknowledge alert
# 2. Check dashboard for context
# 3. Review recent deployments
# 4. Check logs in CloudWatch
# 5. Mitigate (rollback, scale up, etc.)
# 6. Root cause analysis
# 7. Preventive measures
# 8. Postmortem document
#
# ==============================================================================
