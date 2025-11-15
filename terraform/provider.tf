# Provider Configuration
# Terraform requires providers to interact with cloud platforms
# The AWS provider allows us to create AWS resources

terraform {
  # Terraform version constraint
  # Using ~> means "allow patch updates but not minor/major"
  required_version = "~> 1.5"

  # Required providers with version constraints
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # AWS provider v5.x
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"  # For generating random values
    }
  }
}

# AWS Provider Configuration
# This tells Terraform how to authenticate with AWS
provider "aws" {
  region = var.aws_region

  # Default tags applied to ALL resources
  # Very important for cost tracking and organization
  default_tags {
    tags = {
      Project     = "LockIn"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner
      CostCenter  = var.cost_center
    }
  }
}

# Why default_tags? (Senior-level insight)
#
# Before default_tags, you had to add tags to EVERY resource:
#   resource "aws_vpc" "main" {
#     tags = {
#       Project = "LockIn"
#       Environment = "prod"
#     }
#   }
#
# Now with default_tags (AWS Provider v5.0+):
# - Tags automatically applied to all resources
# - No duplicated tag blocks
# - Easy to enforce tagging policies
# - Better cost allocation reporting
#
# You can still add resource-specific tags:
#   resource "aws_vpc" "main" {
#     tags = {
#       Name = "lockin-vpc"  # Merged with default_tags
#     }
#   }
