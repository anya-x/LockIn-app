# Storage Module - S3 Buckets
# Durable object storage for application assets and logs

# ==============================================================================
# S3 CONCEPTS (Mid→Senior Learning)
# ==============================================================================
#
# What is S3?
# - Simple Storage Service
# - Object storage (not file system or block storage)
# - 99.999999999% (11 nines) durability
# - Unlimited storage
# - Pay for what you use
#
# Key Concepts:
#
# 1. BUCKETS
#    - Top-level containers
#    - Globally unique names
#    - Region-specific
#
# 2. OBJECTS
#    - Files stored in buckets
#    - Max size: 5TB per object
#    - Key = path + filename
#    - Metadata + data
#
# 3. STORAGE CLASSES
#    - Standard: Frequent access (~$0.023/GB/month)
#    - IA (Infrequent Access): Cheaper storage, retrieval fee
#    - Glacier: Archive (pennies per GB)
#    - Intelligent-Tiering: Automatic optimization
#
# 4. VERSIONING
#    - Keep multiple versions of objects
#    - Protect against accidental deletion
#    - Can restore previous versions
#
# 5. LIFECYCLE POLICIES
#    - Automatically transition to cheaper storage
#    - Delete old versions
#    - Example: logs -> IA after 30 days -> delete after 90
#
# 6. ENCRYPTION
#    - At rest: SSE-S3, SSE-KMS, SSE-C
#    - In transit: HTTPS
#    - Default encryption recommended
#
# Use Cases:
# - Static website hosting
# - Application logs
# - User uploads
# - Backup and archive
# - Data lakes
# - Terraform state
#
# ==============================================================================

# ==============================================================================
# S3 BUCKET
# ==============================================================================

resource "aws_s3_bucket" "main" {
  bucket_prefix = "${var.name_prefix}-"

  # Force destroy (allows deletion of non-empty bucket)
  # Set to false for production!
  force_destroy = var.environment != "production"

  tags = merge(
    var.tags,
    {
      Name        = "${var.name_prefix}-bucket"
      Environment = var.environment
    }
  )
}

# ==============================================================================
# VERSIONING
# ==============================================================================
# Keep history of object modifications

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

# ==============================================================================
# ENCRYPTION
# ==============================================================================
# Encrypt all objects at rest

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # Or use "aws:kms" for KMS encryption
    }
    bucket_key_enabled = true  # Reduces KMS costs
  }
}

# ==============================================================================
# BLOCK PUBLIC ACCESS
# ==============================================================================
# Prevent accidental public exposure

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==============================================================================
# LIFECYCLE RULES
# ==============================================================================
# Automatically manage object lifecycle

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count = length(var.lifecycle_rules) > 0 ? 1 : 0

  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.lifecycle_rules

    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      # Filter by prefix (optional)
      dynamic "filter" {
        for_each = lookup(rule.value, "prefix", null) != null ? [1] : []
        content {
          prefix = rule.value.prefix
        }
      }

      # Transition to Infrequent Access
      dynamic "transition" {
        for_each = lookup(rule.value, "transition_ia_days", null) != null ? [1] : []
        content {
          days          = rule.value.transition_ia_days
          storage_class = "STANDARD_IA"
        }
      }

      # Transition to Glacier
      dynamic "transition" {
        for_each = lookup(rule.value, "transition_glacier_days", null) != null ? [1] : []
        content {
          days          = rule.value.transition_glacier_days
          storage_class = "GLACIER"
        }
      }

      # Expiration (delete objects)
      dynamic "expiration" {
        for_each = lookup(rule.value, "expiration_days", null) != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }

      # Expire old versions
      dynamic "noncurrent_version_expiration" {
        for_each = lookup(rule.value, "noncurrent_version_expiration_days", null) != null ? [1] : []
        content {
          noncurrent_days = rule.value.noncurrent_version_expiration_days
        }
      }
    }
  }
}

# ==============================================================================
# CORS CONFIGURATION (if needed for frontend uploads)
# ==============================================================================

resource "aws_s3_bucket_cors_configuration" "main" {
  count = var.enable_cors ? 1 : 0

  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ==============================================================================
# LOGGING CONFIGURATION (Optional)
# ==============================================================================
# Log all S3 access requests

resource "aws_s3_bucket" "logs" {
  count = var.enable_access_logging ? 1 : 0

  bucket_prefix = "${var.name_prefix}-logs-"
  force_destroy = var.environment != "production"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-logs-bucket"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "logs" {
  count = var.enable_access_logging ? 1 : 0

  bucket = aws_s3_bucket.logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "main" {
  count = var.enable_access_logging ? 1 : 0

  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.logs[0].id
  target_prefix = "s3-access-logs/"
}

# ==============================================================================
# S3 BUCKET POLICY (Optional)
# ==============================================================================
# Define who can access the bucket

# Example: Allow CloudFront to read objects
# Uncomment and customize if needed

# data "aws_iam_policy_document" "bucket_policy" {
#   statement {
#     principals {
#       type        = "Service"
#       identifiers = ["cloudfront.amazonaws.com"]
#     }
#
#     actions = [
#       "s3:GetObject"
#     ]
#
#     resources = [
#       "${aws_s3_bucket.main.arn}/*"
#     ]
#
#     condition {
#       test     = "StringEquals"
#       variable = "AWS:SourceArn"
#       values   = [var.cloudfront_distribution_arn]
#     }
#   }
# }
#
# resource "aws_s3_bucket_policy" "main" {
#   bucket = aws_s3_bucket.main.id
#   policy = data.aws_iam_policy_document.bucket_policy.json
# }

# ==============================================================================
# S3 BEST PRACTICES
# ==============================================================================
#
# 1. SECURITY
#    - Always block public access (unless hosting website)
#    - Enable default encryption
#    - Use bucket policies for access control
#    - Enable MFA delete for critical buckets
#    - Use VPC endpoints to avoid NAT costs
#
# 2. COST OPTIMIZATION
#    - Use lifecycle policies
#    - Delete incomplete multipart uploads
#    - Use Intelligent-Tiering for unknown patterns
#    - S3 Inventory for large buckets
#    - S3 Analytics to understand access patterns
#
# 3. PERFORMANCE
#    - Use CloudFront for global distribution
#    - Multipart upload for large files
#    - Transfer Acceleration for global uploads
#    - Avoid sequential key names (use randomized prefixes)
#
# 4. DATA PROTECTION
#    - Enable versioning for critical data
#    - Cross-region replication for DR
#    - Object Lock for compliance
#    - Regular backup testing
#
# 5. MONITORING
#    - Enable S3 access logging
#    - CloudWatch metrics
#    - S3 Storage Lens (advanced)
#    - Set up alerts for unusual access patterns
#
# ==============================================================================
# COMMON USE CASES
# ==============================================================================
#
# 1. APPLICATION LOGS
#    lifecycle: Delete after 90 days
#    versioning: Not needed
#    encryption: Yes
#
# 2. USER UPLOADS
#    lifecycle: Move to IA after 30 days
#    versioning: Yes (for recovery)
#    encryption: Yes
#    CORS: Yes
#
# 3. BACKUPS
#    lifecycle: Move to Glacier after 7 days
#    versioning: Yes
#    encryption: Yes with KMS
#    Cross-region replication: Yes
#
# 4. STATIC WEBSITE
#    lifecycle: Not needed
#    versioning: Yes
#    CloudFront: Yes
#    Public access: Yes (with CloudFront)
#
# ==============================================================================
# INTERVIEW TALKING POINTS
# ==============================================================================
#
# Q: "S3 vs EBS vs EFS - when to use each?"
# A:
# S3 (Object Storage):
# - File storage, backups, archives
# - Unlimited capacity
# - Web access (HTTP)
# - Most cost-effective
#
# EBS (Block Storage):
# - Database volumes
# - Low latency required
# - Single EC2 instance
# - SSD or HDD options
#
# EFS (File System):
# - Shared file system
# - Multiple EC2 instances
# - NFS protocol
# - More expensive than S3
#
# Q: "How do you reduce S3 costs?"
# A:
# - Lifecycle policies (transition to IA, Glacier)
# - Delete old versions
# - Use Intelligent-Tiering
# - Compress files before upload
# - Use S3 Analytics to understand patterns
# - Clean up incomplete multipart uploads
#
# Q: "How do you secure S3 buckets?"
# A:
# - Block public access (default)
# - Bucket policies and IAM
# - Encryption at rest (default)
# - HTTPS only
# - MFA delete for critical data
# - VPC endpoints
# - Access logging and monitoring
#
# ==============================================================================
