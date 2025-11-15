# Security Groups Module
# Security groups act as virtual firewalls for AWS resources

# ==============================================================================
# SECURITY GROUP CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# What are Security Groups?
# - Stateful firewalls (return traffic automatically allowed)
# - Apply to network interfaces (ENIs)
# - Default: deny all inbound, allow all outbound
# - Rules evaluated together (allow only, no deny rules)
#
# Stateful vs Stateless:
# STATEFUL (Security Groups):
#   Request: Client -> Server on port 80
#   Response: Server -> Client (automatically allowed, no rule needed!)
#
# STATELESS (NACLs):
#   Request: Need rule to allow 80 inbound
#   Response: Need rule to allow ephemeral ports outbound (1024-65535)
#
# Best Practices:
# 1. Principle of least privilege (only allow what's needed)
# 2. Reference security groups instead of CIDR blocks when possible
# 3. Separate security groups by function (ALB, ECS, RDS)
# 4. Use descriptive names and descriptions
# 5. Limit 0.0.0.0/0 access (only for ALB if needed)
#
# ==============================================================================

# ==============================================================================
# APPLICATION LOAD BALANCER SECURITY GROUP
# ==============================================================================
# Controls traffic to the load balancer (public-facing)

resource "aws_security_group" "alb" {
  name_prefix = "${var.name_prefix}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  # Allow HTTP from anywhere (or specific CIDRs)
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Allow HTTPS from anywhere (if using SSL)
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Allow all outbound traffic
  # ALB needs to send traffic to ECS tasks on app_port
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # -1 means all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-alb-sg"
      Type = "alb"
    }
  )

  # lifecycle block prevents replacement if name changes
  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# ECS TASKS SECURITY GROUP
# ==============================================================================
# Controls traffic to ECS Fargate tasks (application containers)

resource "aws_security_group" "ecs" {
  name_prefix = "${var.name_prefix}-ecs-"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = var.vpc_id

  # Allow traffic from ALB on application port
  # This uses security group reference (best practice!)
  ingress {
    description     = "Traffic from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow all outbound traffic
  # ECS needs to:
  # - Pull Docker images from ECR
  # - Connect to RDS database
  # - Make external API calls (e.g., Google Calendar)
  # - Send logs to CloudWatch
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-ecs-sg"
      Type = "ecs"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# RDS DATABASE SECURITY GROUP
# ==============================================================================
# Controls traffic to PostgreSQL database (most restrictive!)

resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = var.vpc_id

  # ONLY allow PostgreSQL traffic from ECS tasks
  # This is the most secure approach - no direct internet access
  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  # Optional: Allow access from bastion host (for debugging)
  # Uncomment if you create a bastion host for database access
  # ingress {
  #   description     = "PostgreSQL from Bastion"
  #   from_port       = 5432
  #   to_port         = 5432
  #   protocol        = "tcp"
  #   security_groups = [var.bastion_security_group_id]
  # }

  # RDS doesn't need outbound access
  # But AWS requires at least one egress rule
  egress {
    description = "No outbound traffic needed"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rds-sg"
      Type = "rds"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# SECURITY GROUP RULES VISUALIZATION
# ==============================================================================
#
# Traffic Flow:
#
# Internet
#    ↓ (HTTP/HTTPS: 80, 443)
#    ↓
# ┌──────────────────┐
# │  ALB (Public)    │  ← aws_security_group.alb
# │  Security Group  │
# └──────────────────┘
#    ↓ (App Port: 8080)
#    ↓
# ┌──────────────────┐
# │  ECS (Private)   │  ← aws_security_group.ecs
# │  Security Group  │
# └──────────────────┘
#    ↓ (PostgreSQL: 5432)
#    ↓
# ┌──────────────────┐
# │  RDS (Private)   │  ← aws_security_group.rds
# │  Security Group  │
# └──────────────────┘
#
# Key Points:
# 1. Each layer only accepts traffic from the layer above
# 2. RDS is completely isolated from internet
# 3. Using security group references (not CIDR) is more secure
# 4. If ECS tasks change IPs, rules still work (dynamic!)
#
# ==============================================================================
# COMMON SECURITY MISTAKES TO AVOID
# ==============================================================================
#
# ❌ DON'T:
# 1. Allow 0.0.0.0/0 to RDS port 5432
# 2. Allow all ports (0-65535)
# 3. Use same security group for everything
# 4. Forget egress rules (some services need outbound)
# 5. Hardcode IP addresses
#
# ✅ DO:
# 1. Use separate SGs for each tier (ALB, ECS, RDS)
# 2. Reference security groups in rules
# 3. Document each rule with description
# 4. Use principle of least privilege
# 5. Enable VPC Flow Logs for troubleshooting
#
# ==============================================================================
# DEBUGGING SECURITY GROUPS
# ==============================================================================
#
# If traffic isn't working:
#
# 1. Check Security Group Rules:
#    aws ec2 describe-security-groups --group-ids sg-xxx
#
# 2. Check Effective Rules on ENI:
#    aws ec2 describe-network-interfaces --network-interface-ids eni-xxx
#
# 3. Enable VPC Flow Logs:
#    Shows ACCEPT/REJECT for each connection attempt
#
# 4. Use Reachability Analyzer:
#    AWS tool to test connectivity between resources
#
# 5. Common issues:
#    - Wrong port number
#    - Wrong protocol (TCP vs UDP)
#    - CIDR block doesn't include source IP
#    - NACLs blocking (less common)
#    - Route table missing routes
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "Security Groups vs NACLs - when to use each?"
# A:
# Security Groups (preferred):
# - Stateful (easier to manage)
# - Instance-level
# - Allow rules only
# - Evaluated as a set
#
# NACLs (additional layer):
# - Stateless (need inbound + outbound rules)
# - Subnet-level
# - Allow and deny rules
# - Ordered evaluation (like iptables)
# - Use for additional subnet-level protection
#
# Q: "How do you secure database access?"
# A:
# - RDS in private subnet (no internet access)
# - Security group only allows ECS tasks
# - Use security group references (not IPs)
# - Enable encryption at rest and in transit
# - Rotate credentials via Secrets Manager
# - Use IAM database authentication (advanced)
#
# Q: "How do you troubleshoot connectivity issues?"
# A:
# 1. Check security groups (ingress/egress)
# 2. Check NACLs
# 3. Check route tables
# 4. Enable VPC Flow Logs
# 5. Use Reachability Analyzer
# 6. Test with netcat: nc -zv hostname port
#
# ==============================================================================
