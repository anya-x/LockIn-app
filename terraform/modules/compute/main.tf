# Compute Module - ECS Fargate
# Runs Docker containers without managing servers

# ==============================================================================
# ECS FARGATE CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# What is ECS?
# - Elastic Container Service: AWS's container orchestration
# - Alternative to Kubernetes (simpler, less features)
# - Runs Docker containers
# - Integrates deeply with AWS services
#
# ECS on EC2 vs ECS on Fargate:
#
# ECS on EC2:
# - You manage EC2 instances
# - Install ECS agent
# - Control instance types
# - Cheaper for large, stable workloads
# - More control, more complexity
#
# ECS on Fargate (what we're using):
# - Serverless (no EC2 to manage!)
# - AWS manages infrastructure
# - Pay per vCPU/GB/hour
# - Perfect for variable workloads
# - Easier operations
#
# Key Concepts:
#
# 1. CLUSTER
#    Logical grouping of services
#    No servers in Fargate (just a namespace)
#
# 2. TASK DEFINITION
#    Blueprint for your application
#    Like a Docker Compose file
#    Defines: image, CPU, memory, environment variables
#    Versioned (revision number)
#
# 3. SERVICE
#    Ensures N tasks are always running
#    Integrates with load balancer
#    Handles deployments
#    Auto-scaling
#
# 4. TASK
#    Running instance of task definition
#    One or more containers
#    Gets ENI with private IP
#    Ephemeral (tasks come and go)
#
# 5. IAM ROLES
#    Task Execution Role: Pull image, write logs
#    Task Role: AWS API calls from your app
#
# ==============================================================================

# ==============================================================================
# ECS CLUSTER
# ==============================================================================

resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  # Container Insights (costs extra but valuable)
  dynamic "setting" {
    for_each = var.enable_container_insights ? [1] : []
    content {
      name  = "containerInsights"
      value = "enabled"
    }
  }

  tags = merge(
    var.tags,
    {
      Name = var.cluster_name
    }
  )
}

# Cluster capacity providers (Fargate and Fargate Spot)
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  # Default capacity provider strategy
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  # Optional: Use Fargate Spot for cost savings (70% cheaper but can be interrupted)
  # default_capacity_provider_strategy {
  #   capacity_provider = "FARGATE_SPOT"
  #   weight            = 1
  # }
}

# ==============================================================================
# CLOUDWATCH LOG GROUP
# ==============================================================================
# Centralized logging for all container output

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.cluster_name}/${var.service_name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.service_name}-logs"
    }
  )
}

# ==============================================================================
# IAM ROLE: TASK EXECUTION
# ==============================================================================
# Allows ECS to pull images and write logs on your behalf

resource "aws_iam_role" "task_execution" {
  name_prefix = "${var.service_name}-exec-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.service_name}-task-execution-role"
    }
  )
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy to read secrets from Secrets Manager
resource "aws_iam_role_policy" "task_execution_secrets" {
  name_prefix = "${var.service_name}-secrets-"
  role        = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [var.secrets_arn]
      }
    ]
  })
}

# ==============================================================================
# IAM ROLE: TASK
# ==============================================================================
# Allows your application code to make AWS API calls

resource "aws_iam_role" "task" {
  name_prefix = "${var.service_name}-task-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.service_name}-task-role"
    }
  )
}

# Example policy: Allow app to access S3, SES, etc.
resource "aws_iam_role_policy" "task" {
  name_prefix = "${var.service_name}-task-policy-"
  role        = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 access (for file uploads, etc.)
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = ["arn:aws:s3:::${var.service_name}-*/*"]
      },
      # CloudWatch Logs (for application logging)
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["${aws_cloudwatch_log_group.app.arn}:*"]
      }
    ]
  })
}

# ==============================================================================
# TASK DEFINITION
# ==============================================================================
# Defines how to run your Spring Boot container

resource "aws_ecs_task_definition" "app" {
  family                   = var.family
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"  # Required for Fargate
  cpu                      = var.container_cpu
  memory                   = var.container_memory

  # IAM roles
  execution_role_arn = aws_iam_role.task_execution.arn
  task_role_arn      = aws_iam_role.task.arn

  # Container definition
  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      # Environment variables from Secrets Manager
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.secrets_arn}:DB_PASSWORD::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${var.secrets_arn}:JWT_SECRET::"
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = "${var.secrets_arn}:GOOGLE_CLIENT_ID::"
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = "${var.secrets_arn}:GOOGLE_CLIENT_SECRET::"
        }
      ]

      # Static environment variables
      environment = [
        {
          name  = "SPRING_PROFILES_ACTIVE"
          value = var.environment
        },
        {
          name  = "DB_HOST"
          value = var.db_host
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        },
        {
          name  = "DB_USERNAME"
          value = var.db_username
        },
        {
          name  = "SERVER_PORT"
          value = tostring(var.container_port)
        }
      ]

      # Logging configuration
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      # Health check (optional but recommended)
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/actuator/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60  # Give app 60s to start
      }
    }
  ])

  tags = merge(
    var.tags,
    {
      Name = "${var.service_name}-task-definition"
    }
  )
}

# ==============================================================================
# ECS SERVICE
# ==============================================================================
# Ensures desired number of tasks are always running

resource "aws_ecs_service" "app" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  # Platform version (latest for Fargate)
  platform_version = "LATEST"

  # Network configuration
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false  # Private subnets use NAT Gateway
  }

  # Load balancer integration
  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = var.service_name
    container_port   = var.container_port
  }

  # Deployment configuration
  deployment_configuration {
    maximum_percent         = 200  # Can have 2x tasks during deployment
    minimum_healthy_percent = 100  # Keep 100% healthy during deployment

    # Deployment circuit breaker (auto-rollback on failure)
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  # Health check grace period (time before health checks start)
  health_check_grace_period_seconds = 60

  # Deployment controller
  deployment_controller {
    type = "ECS"  # Can also be CODE_DEPLOY for blue/green
  }

  # Force new deployment on changes
  force_new_deployment = var.force_new_deployment

  # Prevent deletion of service until all tasks stopped
  wait_for_steady_state = false

  tags = merge(
    var.tags,
    {
      Name = var.service_name
    }
  )

  # Service must wait for load balancer to be created
  depends_on = [aws_iam_role_policy.task]
}

# ==============================================================================
# AUTO SCALING
# ==============================================================================
# Automatically adjust number of tasks based on load

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_count
  min_capacity       = var.min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale up/down based on CPU utilization
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.service_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0  # Target 70% CPU
    scale_in_cooldown  = 300   # Wait 5 min before scaling in
    scale_out_cooldown = 60    # Wait 1 min before scaling out
  }
}

# Scale based on memory utilization
resource "aws_appautoscaling_policy" "memory" {
  name               = "${var.service_name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0  # Target 80% memory
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Scale based on ALB request count (advanced)
resource "aws_appautoscaling_policy" "requests" {
  count = var.enable_request_based_scaling ? 1 : 0

  name               = "${var.service_name}-request-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = var.alb_resource_label
    }
    target_value       = var.target_requests_per_task
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ==============================================================================
# DATA SOURCES
# ==============================================================================

data "aws_region" "current" {}

# ==============================================================================
# ECS DEPLOYMENT STRATEGIES
# ==============================================================================
#
# Rolling Update (default):
# - Start new tasks
# - Wait for health checks
# - Stop old tasks
# - No downtime!
#
# Blue/Green (CODE_DEPLOY):
# - Create new task set
# - Shift traffic gradually
# - Rollback instantly if issues
# - Requires ALB with 2 target groups
#
# Settings for zero-downtime:
# - minimum_healthy_percent: 100
# - maximum_percent: 200
# - health_check_grace_period: Give app time to start
# - deployment_circuit_breaker: Auto-rollback on failure
#
# ==============================================================================
# COST OPTIMIZATION
# ==============================================================================
#
# Fargate Pricing:
# - Per vCPU-hour and GB-hour
# - No minimum, pay for what you use
#
# Cost Saving Tips:
# 1. Right-size containers (don't over-provision)
# 2. Use Fargate Spot (70% cheaper, can be interrupted)
# 3. Scale down during off-hours
# 4. Monitor actual usage with Container Insights
# 5. Consider Savings Plans for consistent usage
#
# Example costs (us-east-1):
# 0.25 vCPU, 0.5 GB:  ~$8/month per task
# 0.5 vCPU, 1 GB:     ~$15/month per task
# 1 vCPU, 2 GB:       ~$30/month per task
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "ECS vs Kubernetes - when to use each?"
# A:
# ECS:
# - Simpler learning curve
# - Deep AWS integration
# - Managed control plane (free!)
# - Good for AWS-only shops
#
# Kubernetes:
# - Multi-cloud portability
# - Larger ecosystem
# - More features and flexibility
# - Better for complex microservices
# - EKS control plane costs $73/month
#
# Q: "How do you achieve zero-downtime deployments?"
# A:
# - ALB health checks ensure new tasks ready
# - minimum_healthy_percent: 100
# - maximum_percent: 200
# - Connection draining on old tasks
# - Circuit breaker for automatic rollback
#
# Q: "How do you handle secrets?"
# A:
# - AWS Secrets Manager for sensitive data
# - ECS pulls secrets at task startup
# - Never in environment variables or code
# - Automatic rotation support
# - IAM controls access
#
# ==============================================================================
