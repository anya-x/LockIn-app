# Load Balancer Module - Application Load Balancer (ALB)
# Distributes incoming traffic across multiple ECS tasks

# ==============================================================================
# ALB CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# What is an Application Load Balancer?
# - Layer 7 load balancer (HTTP/HTTPS)
# - Routes traffic based on content (path, host, headers)
# - Performs health checks on targets
# - SSL/TLS termination
# - Integrates with ACM for free SSL certificates
#
# ALB vs NLB vs CLB:
#
# ALB (Application Load Balancer):
# - Layer 7 (HTTP/HTTPS)
# - Path-based routing (/api/* -> Service A)
# - Host-based routing (api.example.com -> Service A)
# - WebSocket support
# - Best for: Web applications, microservices
#
# NLB (Network Load Balancer):
# - Layer 4 (TCP/UDP)
# - Ultra-low latency
# - Millions of requests per second
# - Static IP addresses
# - Best for: Gaming, IoT, extreme performance needs
#
# CLB (Classic Load Balancer):
# - Legacy (don't use for new projects)
# - Layer 4 or 7
# - Less features than ALB/NLB
#
# Key Concepts:
#
# 1. TARGET GROUP
#    Collection of targets (ECS tasks, EC2, Lambda, IP)
#    Health check configuration
#    Load balancing algorithm
#
# 2. LISTENER
#    Checks for connection requests
#    Port and protocol (80, 443)
#    Routes to target group based on rules
#
# 3. LISTENER RULES
#    path-pattern: /api/* -> Target Group A
#    host-header: api.example.com -> Target Group B
#    Priority-based execution
#
# 4. HEALTH CHECKS
#    ALB pings targets periodically
#    Unhealthy targets removed from rotation
#    Automatic recovery when healthy again
#
# ==============================================================================

# ==============================================================================
# APPLICATION LOAD BALANCER
# ==============================================================================

resource "aws_lb" "main" {
  name_prefix        = substr(var.name_prefix, 0, 6)  # Max 6 chars for prefix
  load_balancer_type = "application"
  internal           = false  # Internet-facing (true = internal only)

  # Network configuration
  subnets         = var.subnet_ids  # Must be in at least 2 AZs
  security_groups = var.security_group_ids

  # Access logs (optional but recommended for production)
  dynamic "access_logs" {
    for_each = var.access_logs_bucket != "" ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      enabled = true
      prefix  = var.access_logs_prefix
    }
  }

  # Cross-zone load balancing (automatically enabled for ALB)
  # Distributes traffic evenly across all AZs

  # Delete protection
  enable_deletion_protection = var.enable_deletion_protection

  # Idle timeout (how long to keep connections open)
  idle_timeout = var.idle_timeout

  # Drop invalid headers (security)
  drop_invalid_header_fields = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-alb"
    }
  )
}

# ==============================================================================
# TARGET GROUP
# ==============================================================================
# Defines where to send traffic (ECS tasks)

resource "aws_lb_target_group" "main" {
  name_prefix = substr(var.name_prefix, 0, 6)
  port        = var.target_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"  # Required for Fargate (uses ENI IPs)

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = var.healthy_threshold      # Healthy after N successes
    unhealthy_threshold = var.unhealthy_threshold    # Unhealthy after N failures
    timeout             = var.health_check_timeout
    interval            = var.health_check_interval
    path                = var.health_check_path      # /actuator/health
    protocol            = "HTTP"
    matcher             = "200"  # Expected HTTP status code
  }

  # Deregistration delay (connection draining)
  # Time to wait before removing target (allows in-flight requests to complete)
  deregistration_delay = var.deregistration_delay

  # Stickiness (session affinity)
  # Routes requests from same client to same target
  dynamic "stickiness" {
    for_each = var.enable_stickiness ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = var.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-tg"
    }
  )

  # Target group must be created before ALB listener
  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# LISTENERS
# ==============================================================================
# Defines how ALB accepts connections

# HTTP Listener (Port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action
  # If HTTPS is enabled, redirect HTTP -> HTTPS
  # Otherwise, forward to target group
  dynamic "default_action" {
    for_each = var.certificate_arn != "" ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"  # Permanent redirect
      }
    }
  }

  dynamic "default_action" {
    for_each = var.certificate_arn == "" ? [1] : []
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.main.arn
    }
  }

  tags = var.tags
}

# HTTPS Listener (Port 443) - Only if certificate provided
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy  # e.g., "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = var.tags
}

# ==============================================================================
# LISTENER RULES (Optional - for path-based routing)
# ==============================================================================
# Example: Route /api/* to different target group
# Uncomment and modify if needed

# resource "aws_lb_listener_rule" "api" {
#   listener_arn = aws_lb_listener.https[0].arn
#   priority     = 100
#
#   action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.api.arn
#   }
#
#   condition {
#     path_pattern {
#       values = ["/api/*"]
#     }
#   }
# }

# ==============================================================================
# ALB OPERATIONAL BEST PRACTICES
# ==============================================================================
#
# 1. HEALTH CHECKS
#    - Use Spring Boot Actuator: /actuator/health
#    - Return 200 when healthy
#    - Check dependencies (DB, cache, etc.)
#    - Fast response (<5 seconds)
#    - Log health check failures
#
# 2. SSL/TLS
#    - Always use HTTPS in production
#    - Get free certificate from ACM
#    - Redirect HTTP -> HTTPS
#    - Use modern SSL policy (TLS 1.2+)
#    - Enable HTTP/2 (automatic with ALB)
#
# 3. ACCESS LOGS
#    - Enable for production
#    - Store in S3
#    - Use for debugging, analytics
#    - Set lifecycle policy to delete old logs
#
# 4. MONITORING
#    - CloudWatch metrics: request count, latency, errors
#    - Set alarms for 5xx errors, high latency
#    - Monitor target health
#    - Review access logs for anomalies
#
# 5. SECURITY
#    - Use security groups (not 0.0.0.0/0 if possible)
#    - Enable WAF for DDoS protection (advanced)
#    - Drop invalid headers
#    - Use latest SSL policy
#
# ==============================================================================
# ZERO-DOWNTIME DEPLOYMENTS
# ==============================================================================
#
# How ALB enables zero-downtime deployments:
#
# 1. ECS starts new tasks with new version
# 2. New tasks register with target group
# 3. ALB performs health checks on new tasks
# 4. Once healthy, ALB sends traffic to new tasks
# 5. Old tasks receive deregistration signal
# 6. Old tasks have 'deregistration_delay' to finish requests
# 7. After delay, old tasks are stopped
# 8. No dropped connections!
#
# Key settings:
# - health_check_interval: How often to check (default: 30s)
# - healthy_threshold: Healthy after N checks (default: 2)
# - deregistration_delay: Grace period for old tasks (default: 30s)
#
# ==============================================================================
# TROUBLESHOOTING
# ==============================================================================
#
# Problem: Targets showing as unhealthy
# Solutions:
# - Check security group allows ALB -> ECS on app port
# - Verify health check path returns 200
# - Check application logs for errors
# - Ensure health check timeout < interval
# - Verify ECS tasks are running
#
# Problem: 502/503/504 errors
# Solutions:
# - 502: Bad gateway (app crashed, health check failing)
# - 503: No targets available (all unhealthy or scaling up)
# - 504: Gateway timeout (app response > timeout)
# - Check target health status
# - Review application logs
# - Increase timeout if needed
#
# Problem: Slow response times
# Solutions:
# - Check target group metrics (latency)
# - Review application performance
# - Scale up ECS tasks
# - Enable connection draining
# - Check database performance
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "How do load balancers enable high availability?"
# A:
# - Distribute traffic across multiple AZs
# - Health checks remove unhealthy targets
# - Automatic failover to healthy targets
# - Cross-zone load balancing
# - Integration with Auto Scaling
#
# Q: "How do you achieve zero-downtime deployments?"
# A:
# - ALB health checks ensure new tasks are ready
# - Connection draining (deregistration delay)
# - Blue/green deployments
# - Rolling updates with ECS
# - Circuit breaker for failed deployments
#
# Q: "ALB vs NLB - when to use each?"
# A:
# ALB:
# - HTTP/HTTPS traffic
# - Need path/host routing
# - WebSocket support
# - Most web applications
#
# NLB:
# - TCP/UDP traffic
# - Need static IPs
# - Extreme performance requirements
# - Gaming, IoT, financial trading
#
# ==============================================================================
