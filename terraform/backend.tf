# Terraform Backend Configuration
# Stores Terraform state in S3 with DynamoDB locking

# ==============================================================================
# WHY REMOTE STATE? (Mid→Senior Concept)
# ==============================================================================
#
# Local State Problems:
# 1. Lost if computer crashes
# 2. Can't collaborate with team
# 3. No locking = race conditions
# 4. Contains sensitive data in plain text
#
# Remote State Benefits:
# 1. Stored in S3 (durable, encrypted)
# 2. DynamoDB locking prevents concurrent modifications
# 3. Team can share state
# 4. Automatic backups via S3 versioning
#
# ==============================================================================

# IMPORTANT: You must create these resources BEFORE using this backend:
#
# 1. Create S3 bucket:
#    aws s3api create-bucket \
#      --bucket lockin-terraform-state-<YOUR-AWS-ACCOUNT-ID> \
#      --region us-east-1
#
# 2. Enable versioning:
#    aws s3api put-bucket-versioning \
#      --bucket lockin-terraform-state-<YOUR-AWS-ACCOUNT-ID> \
#      --versioning-configuration Status=Enabled
#
# 3. Enable encryption:
#    aws s3api put-bucket-encryption \
#      --bucket lockin-terraform-state-<YOUR-AWS-ACCOUNT-ID> \
#      --server-side-encryption-configuration '{
#        "Rules": [{
#          "ApplyServerSideEncryptionByDefault": {
#            "SSEAlgorithm": "AES256"
#          }
#        }]
#      }'
#
# 4. Block public access:
#    aws s3api put-public-access-block \
#      --bucket lockin-terraform-state-<YOUR-AWS-ACCOUNT-ID> \
#      --public-access-block-configuration \
#        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
#
# 5. Create DynamoDB table for locking:
#    aws dynamodb create-table \
#      --table-name terraform-state-locks \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST \
#      --region us-east-1
#
# OR use the helper script: ./scripts/setup-backend.sh

terraform {
  backend "s3" {
    # S3 bucket for state storage
    # REPLACE <YOUR-AWS-ACCOUNT-ID> with your actual AWS account ID
    # bucket = "lockin-terraform-state-<YOUR-AWS-ACCOUNT-ID>"

    # Key is the path within the bucket
    # Different environments should use different keys
    # key    = "environments/dev/terraform.tfstate"

    # AWS region where bucket exists
    # region = "us-east-1"

    # Enable encryption at rest
    # encrypt = true

    # DynamoDB table for state locking
    # dynamodb_table = "terraform-state-locks"

    # Workspace-aware key (optional - for terraform workspaces)
    # workspace_key_prefix = "workspaces"

    # UNCOMMENT the above after creating S3 bucket and DynamoDB table
    # For first run, comment this whole backend block
  }
}

# ==============================================================================
# BACKEND MIGRATION WORKFLOW
# ==============================================================================
#
# Step 1: Initial setup (local state)
# - Comment out entire backend block
# - Run: terraform init
# - Run: terraform apply
#
# Step 2: Create backend resources
# - Run: ./scripts/setup-backend.sh
# - OR manually create S3 bucket and DynamoDB table
#
# Step 3: Migrate to remote state
# - Uncomment backend block
# - Update bucket name with your AWS account ID
# - Run: terraform init -migrate-state
# - Terraform will prompt to copy local state to S3
# - Answer: yes
#
# Step 4: Verify
# - Check S3 bucket for state file
# - Local terraform.tfstate should be empty/deleted
# - Run: terraform plan (should see no changes)
#
# ==============================================================================
# MULTIPLE ENVIRONMENTS
# ==============================================================================
#
# Option 1: Different Keys (Recommended)
# Each environment uses different key in same bucket:
#
# dev.backend.hcl:
#   bucket = "lockin-terraform-state-123456789"
#   key    = "environments/dev/terraform.tfstate"
#
# prod.backend.hcl:
#   bucket = "lockin-terraform-state-123456789"
#   key    = "environments/prod/terraform.tfstate"
#
# Usage:
#   terraform init -backend-config=environments/dev/backend.hcl
#   terraform init -backend-config=environments/prod/backend.hcl
#
# Option 2: Terraform Workspaces
# Same key, different workspace:
#
#   terraform workspace new dev
#   terraform workspace new prod
#   terraform workspace select dev
#
# State stored at: workspaces/dev/terraform.tfstate
#
# ==============================================================================
# STATE LOCKING EXPLAINED
# ==============================================================================
#
# Without locking:
# Developer A: terraform apply (starts)
# Developer B: terraform apply (starts at same time)
# Both read same state, both make changes
# Last one to finish wins, other changes lost!
#
# With DynamoDB locking:
# Developer A: terraform apply (acquires lock)
# Developer B: terraform apply (waits for lock)
# Developer A: finishes (releases lock)
# Developer B: acquires lock, sees A's changes
# No conflicts!
#
# Lock table schema:
#   LockID (String, Primary Key) = MD5(bucket/key)
#   Info (String) = JSON with user, operation, timestamp
#
# ==============================================================================
# COST BREAKDOWN
# ==============================================================================
#
# S3 Storage: ~$0.023/GB/month
#   Typical state file: <1MB = ~$0.00
#
# S3 Requests:
#   Read: $0.0004 per 1000 requests
#   Write: $0.005 per 1000 requests
#   Typical usage: <100 requests/day = ~$0.01/month
#
# DynamoDB (PAY_PER_REQUEST mode):
#   Read: $0.25 per million requests
#   Write: $1.25 per million requests
#   Typical usage: <1000 requests/day = ~$0.04/month
#
# Total: ~$0.05/month (essentially free!)
#
# ==============================================================================
