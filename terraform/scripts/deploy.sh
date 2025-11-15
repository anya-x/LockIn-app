#!/bin/bash

# Terraform Deployment Script
# Automates the deployment process with safety checks

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "LockIn Infrastructure Deployment"
echo "================================================"
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Install from: https://www.terraform.io/downloads"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓${NC} AWS Account ID: $ACCOUNT_ID"
echo ""

# Change to terraform directory
cd "$(dirname "$0")/.."

# Check if backend is configured
if [ ! -f ".terraform/terraform.tfstate" ]; then
    echo -e "${YELLOW}⚠${NC} Terraform backend not initialized"
    echo ""
    read -p "Do you want to run backend setup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/setup-backend.sh
        echo ""
        echo "Now initializing Terraform..."
        terraform init
    else
        echo "Please run './scripts/setup-backend.sh' first"
        exit 1
    fi
fi

# Environment selection
echo "Select environment to deploy:"
echo "1) dev (Development)"
echo "2) staging (Staging)"
echo "3) production (Production)"
echo ""
read -p "Enter choice [1-3]: " env_choice

case $env_choice in
    1)
        ENVIRONMENT="dev"
        VAR_FILE="environments/dev.tfvars"
        ;;
    2)
        ENVIRONMENT="staging"
        VAR_FILE="environments/staging.tfvars"
        ;;
    3)
        ENVIRONMENT="production"
        VAR_FILE="environments/production.tfvars"
        echo -e "${RED}⚠ WARNING: Deploying to PRODUCTION${NC}"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

if [ ! -f "$VAR_FILE" ]; then
    echo -e "${RED}Error: Variable file not found: $VAR_FILE${NC}"
    echo "Create it by copying environments/dev.tfvars.example"
    exit 1
fi

echo ""
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo -e "${BLUE}Variables:${NC} $VAR_FILE"
echo ""

# Format check
echo "Checking formatting..."
terraform fmt -check -recursive || {
    echo "Running terraform fmt..."
    terraform fmt -recursive
}
echo -e "${GREEN}✓${NC} Formatting complete"
echo ""

# Validate
echo "Validating configuration..."
terraform validate
echo -e "${GREEN}✓${NC} Validation complete"
echo ""

# Plan
echo "Creating execution plan..."
terraform plan -var-file="$VAR_FILE" -out=tfplan
echo ""

# Review plan
echo "================================================"
echo "Please review the plan above carefully"
echo "================================================"
echo ""
read -p "Do you want to apply this plan? (yes/no) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Deployment cancelled"
    rm -f tfplan
    exit 0
fi

# Apply
echo ""
echo "Applying infrastructure changes..."
terraform apply tfplan
rm -f tfplan

echo ""
echo "================================================"
echo -e "${GREEN}SUCCESS!${NC} Infrastructure deployed"
echo "================================================"
echo ""

# Get outputs
echo "Infrastructure Details:"
echo "----------------------"
terraform output

echo ""
echo "Next steps:"
echo "1. Build and push Docker image (see output above)"
echo "2. Update ECS service to use new image"
echo "3. Verify deployment at ALB DNS"
echo "4. Configure custom domain (optional)"
echo "5. Set up monitoring alerts"
echo ""
