# Phase 2: AWS Infrastructure Deployment Guide

## 🎯 Complete Step-by-Step Deployment

This guide will walk you through deploying the entire AWS infrastructure from scratch.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured
- [ ] Terraform v1.5+ installed
- [ ] Docker installed (for building application image)
- [ ] Domain name (optional, for HTTPS)
- [ ] ACM certificate (optional, for HTTPS)

### Install Required Tools

```bash
# Check if tools are installed
aws --version        # Should be 2.x+
terraform --version  # Should be 1.5+
docker --version     # Should be 20.x+

# If not installed:

# AWS CLI (macOS)
brew install awscli

# AWS CLI (Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform (macOS)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Terraform (Linux)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json

# Verify configuration
aws sts get-caller-identity
# Should show your AWS account ID
```

---

## 🚀 Deployment Steps

### Step 1: Set Up Terraform Backend (One-Time Setup)

The backend stores Terraform state in S3 with DynamoDB locking.

```bash
# Navigate to terraform directory
cd terraform

# Run backend setup script
./scripts/setup-backend.sh

# This creates:
# - S3 bucket: lockin-terraform-state-<ACCOUNT-ID>
# - DynamoDB table: terraform-state-locks
```

**Manual backend setup (if script fails):**

```bash
# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create S3 bucket for state
aws s3api create-bucket \
  --bucket "lockin-terraform-state-${ACCOUNT_ID}" \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "lockin-terraform-state-${ACCOUNT_ID}" \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket "lockin-terraform-state-${ACCOUNT_ID}" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket "lockin-terraform-state-${ACCOUNT_ID}" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB table
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 2: Configure Variables

```bash
# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables to customize:**

```hcl
# terraform.tfvars

# General Configuration
aws_region   = "us-east-1"
environment  = "dev"  # or "staging", "production"
project_name = "lockin"

# Database (IMPORTANT: Change these!)
db_password = "CHANGE_ME_STRONG_PASSWORD_MIN_16_CHARS"  # Use strong password!

# Application Secrets (IMPORTANT: Generate these!)
jwt_secret = "GENERATE_RANDOM_32_CHARS_HERE"  # See below for generation

# Google OAuth (Optional - leave empty if not using)
google_client_id     = ""  # From Google Cloud Console
google_client_secret = ""  # From Google Cloud Console

# Email for alarms
alarm_email = "your-email@example.com"  # You'll receive CloudWatch alarms

# Domain (Optional - for HTTPS)
domain_name      = ""  # e.g., "app.example.com"
route53_zone_id  = ""  # From Route53
alb_certificate_arn = ""  # From ACM
```

**Generate secure secrets:**

```bash
# Generate strong database password (16+ characters)
openssl rand -base64 24

# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Save these securely! You'll need them later.
```

### Step 3: Update Backend Configuration

```bash
# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Edit backend.tf
nano backend.tf

# Uncomment and update the backend block:
terraform {
  backend "s3" {
    bucket         = "lockin-terraform-state-${ACCOUNT_ID}"  # Replace ${ACCOUNT_ID}
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}
```

### Step 4: Initialize Terraform

```bash
# Initialize Terraform (downloads providers)
terraform init

# You should see:
# "Terraform has been successfully initialized!"
```

### Step 5: Validate Configuration

```bash
# Validate Terraform syntax
terraform validate

# Format code (optional)
terraform fmt -recursive

# Check for syntax errors
# Should output: "Success! The configuration is valid."
```

### Step 6: Plan Infrastructure

```bash
# Generate execution plan
terraform plan -out=tfplan

# Review the plan carefully!
# Look for:
# - Resources being created (should be ~40-50 resources)
# - No unexpected deletions or changes
# - Correct variable values
```

**What you should see:**

```
Plan: 47 to add, 0 to change, 0 to destroy.
```

### Step 7: Deploy Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# This will take 10-15 minutes
# Resources are created in order:
# 1. VPC and networking (2-3 min)
# 2. Security groups (< 1 min)
# 3. RDS database (5-10 min) ← Slowest
# 4. Load balancer (2-3 min)
# 5. ECS cluster and service (1-2 min)
# 6. Monitoring and storage (< 1 min)
```

**Expected output:**

```
Apply complete! Resources: 47 added, 0 changed, 0 destroyed.

Outputs:

alb_dns_name = "lockin-dev-alb-1234567890.us-east-1.elb.amazonaws.com"
ecr_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com/lockin-dev-app"
db_endpoint = "lockin-dev-db.abc123.us-east-1.rds.amazonaws.com:5432"
...
```

### Step 8: Save Outputs

```bash
# Save outputs to file
terraform output > ../terraform-outputs.txt

# View specific output
terraform output alb_dns_name
terraform output ecr_repository_url
```

---

## 🐳 Build and Deploy Application

### Step 9: Build Docker Image

```bash
# Navigate to project root
cd ..

# Build Docker image
cd backend
docker build -t lockin-app .

# Test locally (optional)
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e DB_HOST=localhost \
  lockin-app
```

### Step 10: Push to ECR

```bash
# Get ECR repository URL from Terraform output
ECR_URL=$(cd ../terraform && terraform output -raw ecr_repository_url)
echo $ECR_URL

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URL

# Tag image
docker tag lockin-app:latest ${ECR_URL}:latest

# Push to ECR
docker push ${ECR_URL}:latest

# Verify image is in ECR
aws ecr describe-images \
  --repository-name lockin-dev-app \
  --region us-east-1
```

### Step 11: Deploy to ECS

```bash
# ECS will automatically pull the latest image
# Force new deployment to pick up the image
cd terraform

aws ecs update-service \
  --cluster lockin-dev-cluster \
  --service lockin-dev-service \
  --force-new-deployment \
  --region us-east-1

# Monitor deployment
aws ecs describe-services \
  --cluster lockin-dev-cluster \
  --services lockin-dev-service \
  --query 'services[0].deployments' \
  --region us-east-1
```

### Step 12: Verify Deployment

```bash
# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name)

# Wait for tasks to be healthy (2-3 minutes)
# Check ECS service
aws ecs describe-services \
  --cluster lockin-dev-cluster \
  --services lockin-dev-service \
  --query 'services[0].runningCount' \
  --region us-east-1

# Should show: 2 (or your desired_count)

# Test health endpoint
curl http://${ALB_DNS}/actuator/health

# Should return:
# {"status":"UP"}

# Test application
curl http://${ALB_DNS}/actuator/info
```

---

## 📊 Post-Deployment Verification

### Check CloudWatch Logs

```bash
# View application logs
aws logs tail /ecs/lockin-dev-cluster/lockin-dev-service --follow
```

### Check Grafana Dashboard

```bash
# Get Grafana URL (if deployed locally)
echo "http://localhost:3001"

# Login: admin / lockin123
# Navigate to LockIn dashboard
```

### Check CloudWatch Dashboard

```bash
# Open in browser
echo "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=lockin-dev-dashboard"
```

### Verify Database Connection

```bash
# Get database endpoint
DB_ENDPOINT=$(terraform output -raw db_endpoint)

# Connect with psql (from bastion or local with VPN)
psql -h ${DB_ENDPOINT} -U lockin_admin -d lockin
```

---

## 🔧 Common Post-Deployment Tasks

### Update Environment Variables

```bash
# Update secrets in Secrets Manager
aws secretsmanager update-secret \
  --secret-id lockin-dev-app-secrets \
  --secret-string '{
    "DB_PASSWORD": "new-password",
    "JWT_SECRET": "new-jwt-secret"
  }'

# Force new ECS deployment to pick up changes
aws ecs update-service \
  --cluster lockin-dev-cluster \
  --service lockin-dev-service \
  --force-new-deployment
```

### Scale ECS Tasks

```bash
# Scale up
aws ecs update-service \
  --cluster lockin-dev-cluster \
  --service lockin-dev-service \
  --desired-count 4

# Scale down
aws ecs update-service \
  --cluster lockin-dev-cluster \
  --service lockin-dev-service \
  --desired-count 2
```

### Deploy New Version

```bash
# Build new image
docker build -t lockin-app:v2 ./backend

# Tag and push
docker tag lockin-app:v2 ${ECR_URL}:v2
docker push ${ECR_URL}:v2

# Update task definition to use v2
# Then force new deployment
aws ecs update-service \
  --cluster lockin-dev-cluster \
  --service lockin-dev-service \
  --force-new-deployment
```

---

## 🛡️ Security Checklist

After deployment, verify:

- [ ] RDS is not publicly accessible
- [ ] Security groups follow least privilege
- [ ] All S3 buckets block public access
- [ ] Secrets are in Secrets Manager (not code)
- [ ] HTTPS enabled (if using domain)
- [ ] CloudWatch alarms configured
- [ ] IAM roles follow least privilege
- [ ] Database backups enabled
- [ ] Multi-AZ enabled for production

---

## 💰 Cost Management

### Monitor Costs

```bash
# Enable AWS Cost Explorer in AWS Console
# Set up budget alerts

# Estimated monthly costs:
# - RDS db.t3.micro: ~$15
# - ECS Fargate (2 tasks): ~$20
# - ALB: ~$16
# - NAT Gateway: ~$32
# - CloudWatch/Logs: ~$10
# Total: ~$93/month
```

### Cost Optimization

```bash
# For dev/staging, consider:
# 1. Single NAT Gateway (vs one per AZ)
# 2. Stop environment overnight
# 3. Use smaller RDS instance
# 4. Reduce log retention
# 5. Use Fargate Spot for non-critical tasks
```

---

## 🔄 Infrastructure Updates

### Updating Infrastructure

```bash
# Make changes to .tf files
nano main.tf

# Plan changes
terraform plan -out=tfplan

# Review carefully!
# Apply changes
terraform apply tfplan
```

### Destroy Infrastructure (DANGER!)

```bash
# ONLY for dev/test environments!
# This deletes EVERYTHING

# Disable deletion protection first
nano terraform.tfvars
# Set: db_deletion_protection = false

terraform apply

# Then destroy
terraform destroy

# Type 'yes' to confirm
```

---

## 🐛 Troubleshooting

### ECS Tasks Not Starting

```bash
# Check ECS service events
aws ecs describe-services \
  --cluster lockin-dev-cluster \
  --services lockin-dev-service \
  --query 'services[0].events[0:5]'

# Common issues:
# - Image not found in ECR
# - Insufficient memory/CPU
# - Secrets not accessible
# - VPC/subnet misconfiguration
```

### ALB Health Checks Failing

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)

# Check application logs
aws logs tail /ecs/lockin-dev-cluster/lockin-dev-service --follow

# Common issues:
# - App not listening on correct port (8080)
# - Health endpoint not responding
# - Security group blocking traffic
# - App startup time > health check grace period
```

### Database Connection Issues

```bash
# Check security group allows ECS -> RDS
# Check connection string in Secrets Manager
# Check database is running

aws rds describe-db-instances \
  --db-instance-identifier lockin-dev-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Should be: "available"
```

### Terraform State Lock

```bash
# If terraform is stuck with state lock:
terraform force-unlock <LOCK_ID>

# Get lock ID from error message
```

---

## 📚 Next Steps

After successful deployment:

1. **Set up CI/CD** - Automate deployments with GitHub Actions
2. **Configure Domain** - Point your domain to ALB
3. **Enable HTTPS** - Get ACM certificate and update ALB
4. **Set up Monitoring** - Configure CloudWatch alarms email
5. **Database Backups** - Test restore procedure
6. **Disaster Recovery** - Document recovery procedures
7. **Load Testing** - Test with realistic traffic
8. **Security Audit** - Run AWS Security Hub

---

## 🎓 Learning Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [ECS Workshop](https://ecsworkshop.com/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check CloudWatch Logs
2. Review AWS Console for resource status
3. Check Terraform state: `terraform show`
4. Review module READMEs in `terraform/modules/`
5. Check AWS Service Health Dashboard
6. Post in AWS forums or Stack Overflow

---

**Congratulations! 🎉**

Your production-ready AWS infrastructure is now deployed!
