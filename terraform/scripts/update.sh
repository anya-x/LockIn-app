#!/bin/bash

# Terraform Update Script
# Updates existing infrastructure with new changes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "LockIn Infrastructure Update"
echo "================================================"
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

# Change to terraform directory
cd "$(dirname "$0")/.."

# Check if terraform is initialized
if [ ! -d ".terraform" ]; then
    echo -e "${RED}Error: Terraform not initialized${NC}"
    echo "Run: terraform init"
    exit 1
fi

# Environment selection
echo "Select environment to update:"
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
        echo -e "${YELLOW}⚠ Updating PRODUCTION environment${NC}"
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
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo -e "${BLUE}Variables:${NC} $VAR_FILE"
echo ""

# Refresh state
echo "Refreshing Terraform state..."
terraform refresh -var-file="$VAR_FILE"
echo -e "${GREEN}✓${NC} State refreshed"
echo ""

# Format
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
echo "Creating update plan..."
terraform plan -var-file="$VAR_FILE" -out=update.tfplan

# Count changes
CHANGES=$(terraform show -json update.tfplan | jq -r '[.resource_changes[] | select(.change.actions[] | contains("create", "update", "delete"))] | length' 2>/dev/null || echo "unknown")

echo ""
echo "================================================"
echo "Update Summary"
echo "================================================"
if [ "$CHANGES" != "unknown" ]; then
    echo "Resources to be changed: $CHANGES"
fi
echo ""
echo "Please review the plan above carefully"
echo ""

# Apply confirmation
read -p "Do you want to apply these updates? (yes/no) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Update cancelled"
    rm -f update.tfplan
    exit 0
fi

# Apply
echo ""
echo "Applying updates..."
terraform apply update.tfplan
rm -f update.tfplan

echo ""
echo "================================================"
echo -e "${GREEN}SUCCESS!${NC} Infrastructure updated"
echo "================================================"
echo ""

# Show current state
echo "Current Infrastructure:"
echo "----------------------"
terraform output

echo ""
echo "Next steps:"
echo "1. Verify services are healthy"
echo "2. Check CloudWatch dashboards"
echo "3. Review application logs"
echo "4. Test application functionality"
echo ""
