#!/bin/bash

# Terraform Destroy Script
# Safely tears down infrastructure with multiple confirmations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "================================================"
echo -e "${RED}⚠ INFRASTRUCTURE DESTRUCTION ⚠${NC}"
echo "================================================"
echo ""
echo "This script will DESTROY all infrastructure"
echo "This action is IRREVERSIBLE"
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

# Change to terraform directory
cd "$(dirname "$0")/.."

# Environment selection
echo "Select environment to destroy:"
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
        echo ""
        echo -e "${RED}════════════════════════════════════════════${NC}"
        echo -e "${RED}⚠ WARNING: PRODUCTION ENVIRONMENT ⚠${NC}"
        echo -e "${RED}════════════════════════════════════════════${NC}"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

if [ ! -f "$VAR_FILE" ]; then
    echo -e "${RED}Error: Variable file not found: $VAR_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${RED}Environment:${NC} $ENVIRONMENT"
echo -e "${RED}Variables:${NC} $VAR_FILE"
echo ""

# First confirmation
echo "This will destroy:"
echo "- VPC and all networking"
echo "- RDS database (data will be LOST)"
echo "- ECS clusters and services"
echo "- Load balancers"
echo "- S3 buckets (if not protected)"
echo "- All monitoring and alarms"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Destruction cancelled"
    exit 0
fi

# Second confirmation for production
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo -e "${RED}SECOND CONFIRMATION REQUIRED FOR PRODUCTION${NC}"
    echo ""
    read -p "Type 'destroy-production' to confirm: " confirm

    if [ "$confirm" != "destroy-production" ]; then
        echo "Destruction cancelled"
        exit 0
    fi
fi

# Create destroy plan
echo ""
echo "Creating destruction plan..."
terraform plan -destroy -var-file="$VAR_FILE" -out=destroy.tfplan
echo ""

# Review plan
echo "================================================"
echo "Please review the destruction plan above"
echo "================================================"
echo ""
read -p "Proceed with destruction? (yes/no) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Destruction cancelled"
    rm -f destroy.tfplan
    exit 0
fi

# Final countdown
echo ""
echo "Starting destruction in:"
for i in 5 4 3 2 1; do
    echo "$i..."
    sleep 1
done
echo ""

# Destroy
echo "Destroying infrastructure..."
terraform apply destroy.tfplan
rm -f destroy.tfplan

echo ""
echo "================================================"
echo -e "${YELLOW}Infrastructure destroyed${NC}"
echo "================================================"
echo ""

# Cleanup reminders
echo "Manual cleanup required:"
echo "1. S3 buckets with deletion protection"
echo "2. RDS snapshots (if any)"
echo "3. CloudWatch log groups (retained by default)"
echo "4. Route53 records (if created manually)"
echo "5. ACM certificates (if created manually)"
echo ""
echo "To remove Terraform state backend:"
echo "  aws s3 rb s3://lockin-terraform-state-<ACCOUNT-ID> --force"
echo "  aws dynamodb delete-table --table-name terraform-state-locks"
echo ""
