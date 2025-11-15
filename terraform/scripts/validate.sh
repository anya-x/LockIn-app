#!/bin/bash

# Terraform Validation Script
# Validates and formats Terraform configuration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "================================================"
echo "Terraform Validation"
echo "================================================"
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Install from: https://www.terraform.io/downloads"
    exit 1
fi

echo -e "${GREEN}✓${NC} Terraform is installed"
terraform version
echo ""

# Change to terraform directory
cd "$(dirname "$0")/.."

# Format check
echo "Checking Terraform formatting..."
if terraform fmt -check -recursive; then
    echo -e "${GREEN}✓${NC} All files are properly formatted"
else
    echo -e "${YELLOW}⚠${NC} Some files need formatting"
    echo "Running terraform fmt..."
    terraform fmt -recursive
    echo -e "${GREEN}✓${NC} Files formatted"
fi
echo ""

# Initialize (if needed)
if [ ! -d ".terraform" ]; then
    echo "Terraform not initialized. Run 'terraform init' first."
    echo "If this is your first time, run './scripts/setup-backend.sh' first."
    exit 1
fi

# Validate
echo "Validating Terraform configuration..."
if terraform validate; then
    echo -e "${GREEN}✓${NC} Configuration is valid"
else
    echo -e "${RED}✗${NC} Validation failed"
    exit 1
fi
echo ""

echo "================================================"
echo -e "${GREEN}SUCCESS!${NC} Validation complete"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Review the configuration files"
echo "2. Run: terraform plan -out=tfplan"
echo "3. Review the plan carefully"
echo "4. Run: terraform apply tfplan"
echo ""
