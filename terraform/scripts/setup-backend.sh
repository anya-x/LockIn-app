#!/bin/bash

# Terraform Backend Setup Script
# Creates S3 bucket and DynamoDB table for remote state management

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "================================================"
echo "Terraform Backend Setup"
echo "================================================"
echo ""

# Get AWS account ID
echo "Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to get AWS account ID${NC}"
    echo "Make sure AWS CLI is configured: aws configure"
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS Account ID: $ACCOUNT_ID"
echo ""

# Set variables
REGION="us-east-1"
BUCKET_NAME="lockin-terraform-state-${ACCOUNT_ID}"
TABLE_NAME="terraform-state-locks"

echo "Configuration:"
echo "  Region: $REGION"
echo "  Bucket: $BUCKET_NAME"
echo "  DynamoDB Table: $TABLE_NAME"
echo ""

# Create S3 bucket
echo "Creating S3 bucket for Terraform state..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Bucket already exists: $BUCKET_NAME"
else
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Created S3 bucket: $BUCKET_NAME"
    else
        echo -e "${RED}✗${NC} Failed to create S3 bucket"
        exit 1
    fi
fi
echo ""

# Enable versioning
echo "Enabling versioning on S3 bucket..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

echo -e "${GREEN}✓${NC} Enabled versioning"
echo ""

# Enable encryption
echo "Enabling encryption on S3 bucket..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": true
        }]
    }'

echo -e "${GREEN}✓${NC} Enabled encryption"
echo ""

# Block public access
echo "Blocking public access to S3 bucket..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo -e "${GREEN}✓${NC} Blocked public access"
echo ""

# Create DynamoDB table
echo "Creating DynamoDB table for state locking..."
if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} DynamoDB table already exists: $TABLE_NAME"
else
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION" >/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Created DynamoDB table: $TABLE_NAME"
    else
        echo -e "${RED}✗${NC} Failed to create DynamoDB table"
        exit 1
    fi
fi
echo ""

# Wait for table to be active
echo "Waiting for DynamoDB table to be active..."
aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
echo -e "${GREEN}✓${NC} DynamoDB table is active"
echo ""

echo "================================================"
echo -e "${GREEN}SUCCESS!${NC} Backend resources created"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Edit backend.tf and uncomment the backend block"
echo "2. Replace ACCOUNT_ID with: $ACCOUNT_ID"
echo "3. Run: terraform init"
echo ""
echo "Backend configuration:"
echo ""
echo "terraform {"
echo "  backend \"s3\" {"
echo "    bucket         = \"$BUCKET_NAME\""
echo "    key            = \"environments/dev/terraform.tfstate\""
echo "    region         = \"$REGION\""
echo "    encrypt        = true"
echo "    dynamodb_table = \"$TABLE_NAME\""
echo "  }"
echo "}"
echo ""
