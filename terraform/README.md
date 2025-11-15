# LockIn App - AWS Infrastructure with Terraform

## Phase 2: Production-Ready AWS Deployment

This directory contains Infrastructure as Code (IaC) for deploying the LockIn application to AWS using Terraform.

---

## 🎯 Why Terraform? (Mid→Senior Concept)

**What is Infrastructure as Code (IaC)?**
Instead of manually clicking through AWS Console to create resources, we write code that describes our infrastructure. This gives us:

1. **Version Control** - Infrastructure changes tracked in Git
2. **Reproducibility** - Deploy identical environments (dev/staging/prod)
3. **Documentation** - Code IS the documentation
4. **Automation** - No manual steps = fewer errors
5. **Review Process** - Infrastructure changes go through PR review

**Why Terraform over CloudFormation/CDK?**
- Multi-cloud support (not locked into AWS)
- Declarative syntax (describe what you want, not how)
- Large community and module ecosystem
- State management for tracking actual resources

---

## 📁 Project Structure

```
terraform/
├── README.md                    # This file
├── main.tf                      # Main infrastructure definition
├── variables.tf                 # Input variables
├── outputs.tf                   # Output values
├── terraform.tfvars.example     # Example variable values
├── backend.tf                   # Remote state configuration
├── provider.tf                  # AWS provider configuration
│
├── modules/                     # Reusable infrastructure modules
│   ├── networking/              # VPC, subnets, security groups
│   ├── database/                # RDS PostgreSQL
│   ├── compute/                 # ECS Fargate cluster
│   ├── load-balancer/           # Application Load Balancer
│   ├── monitoring/              # CloudWatch, alarms
│   └── storage/                 # S3 buckets
│
├── environments/                # Environment-specific configs
│   ├── dev/
│   ├── staging/
│   └── production/
│
└── scripts/                     # Helper scripts
    ├── deploy.sh
    └── destroy.sh
```

---

## 🏗️ Architecture Overview

### Components We'll Deploy:

1. **VPC (Virtual Private Cloud)**
   - Isolated network for our application
   - Public subnets (for load balancer)
   - Private subnets (for application and database)
   - NAT Gateway for outbound internet access

2. **RDS PostgreSQL**
   - Managed database service
   - Multi-AZ for high availability
   - Automated backups
   - Parameter groups for optimization

3. **ECS Fargate**
   - Serverless container orchestration
   - No EC2 instances to manage
   - Auto-scaling based on CPU/memory
   - Task definitions for Spring Boot app

4. **Application Load Balancer (ALB)**
   - Distributes traffic across containers
   - SSL/TLS termination
   - Health checks
   - Integration with ACM for HTTPS

5. **CloudWatch**
   - Centralized logging
   - Metrics and dashboards
   - Alarms for critical events
   - Integration with existing Prometheus metrics

6. **S3**
   - Static asset storage
   - Application logs backup
   - Terraform state storage

7. **Secrets Manager / Parameter Store**
   - Database passwords
   - JWT secrets
   - Google OAuth credentials
   - Environment variables

8. **Security Groups**
   - Firewall rules for each component
   - Principle of least privilege
   - Ingress/egress control

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. Install Terraform
brew install terraform  # macOS
# OR
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# 2. Install AWS CLI
brew install awscli  # macOS
# OR
pip install awscli

# 3. Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)

# 4. Verify
terraform version  # Should show v1.5+
aws sts get-caller-identity  # Should show your AWS account
```

### First Deployment

```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Copy example variables
cp terraform.tfvars.example terraform.tfvars

# 3. Edit variables (add your values)
nano terraform.tfvars

# 4. Initialize Terraform (downloads providers and modules)
terraform init

# 5. Preview changes (ALWAYS do this first!)
terraform plan -out=tfplan

# 6. Review the plan carefully
# Look for: resources being created, modified, or destroyed

# 7. Apply changes
terraform apply tfplan

# 8. Save outputs
terraform output > outputs.txt
```

---

## 📊 Cost Estimation

**Monthly AWS costs for production setup:**

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **RDS PostgreSQL** | db.t3.micro, 20GB | ~$15 |
| **ECS Fargate** | 0.25 vCPU, 0.5GB RAM | ~$10 |
| **ALB** | Application Load Balancer | ~$16 |
| **NAT Gateway** | 1 NAT Gateway | ~$32 |
| **CloudWatch** | Logs and metrics | ~$10 |
| **S3** | 10GB storage | ~$0.23 |
| **Data Transfer** | Estimate | ~$10 |
| **Total** | | **~$93/month** |

**Cost Optimization Tips:**
- Use `t3.micro` for dev/staging (reduce to `t4g.nano` if possible)
- Single AZ for non-prod environments
- Enable S3 lifecycle policies
- Use CloudWatch log retention (7 days for dev)
- Spot instances for non-critical workloads (advanced)

---

## 🔒 Security Best Practices

### 1. **Never Commit Secrets**
```bash
# .gitignore already includes:
*.tfvars          # Variable values
*.tfstate         # State files contain sensitive data
*.tfstate.backup
.terraform/       # Provider downloads
```

### 2. **Use Remote State**
```hcl
# Store state in S3 with encryption
terraform {
  backend "s3" {
    bucket         = "lockin-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # Prevent concurrent changes
  }
}
```

### 3. **Principle of Least Privilege**
- IAM roles with minimal permissions
- Security groups allow only necessary ports
- Private subnets for sensitive resources
- VPC endpoints to avoid internet access

### 4. **Encryption**
- RDS: Encryption at rest enabled
- S3: Default encryption
- Secrets Manager: Encrypted by default
- ALB: HTTPS only with ACM certificates

---

## 🎓 Learning Concepts (Mid→Senior)

### 1. **Terraform State Management**

**What is state?**
Terraform tracks actual AWS resources in a "state file". This maps your code to reality.

```
Code (main.tf)  →  terraform plan  →  State File  →  AWS Resources
```

**Why remote state?**
- Local state files get lost/corrupted
- Teams can't collaborate with local state
- No locking = conflicts
- Contains sensitive data

**Best practice:**
```hcl
backend "s3" {
  bucket         = "company-terraform-state"
  key            = "app/prod/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-locks"
}
```

### 2. **Modules for Reusability**

**Bad (all in one file):**
```hcl
# main.tf - 2000 lines of VPC, RDS, ECS, etc.
```

**Good (modular):**
```hcl
module "networking" {
  source = "./modules/networking"
  vpc_cidr = var.vpc_cidr
}

module "database" {
  source = "./modules/database"
  vpc_id = module.networking.vpc_id
}
```

**Benefits:**
- Reuse across environments (dev/staging/prod)
- Easier testing
- Better organization
- Share modules across projects

### 3. **Data Sources vs Resources**

**Resource** = Create new infrastructure
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
```

**Data Source** = Reference existing infrastructure
```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical
}
```

### 4. **Variables and Outputs**

**Variables** = Inputs to make code flexible
```hcl
variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}
```

**Outputs** = Values to use later or share
```hcl
output "alb_dns_name" {
  description = "Load balancer URL"
  value       = aws_lb.main.dns_name
}
```

### 5. **Count vs For_Each**

**Count** = Create multiple similar resources
```hcl
resource "aws_subnet" "private" {
  count      = 3
  cidr_block = "10.0.${count.index}.0/24"
}
```

**For_Each** = Better when you need map/set iteration
```hcl
resource "aws_subnet" "private" {
  for_each   = var.availability_zones
  cidr_block = each.value.cidr
}
```

**When to use which?**
- `count`: Simple duplication (3 identical subnets)
- `for_each`: Named resources with different configs

---

## 🔧 Common Commands

```bash
# Initialize (first time or after adding modules)
terraform init

# Format code
terraform fmt -recursive

# Validate syntax
terraform validate

# Preview changes (ALWAYS do this)
terraform plan

# Preview with specific var file
terraform plan -var-file="environments/prod/terraform.tfvars"

# Apply changes
terraform apply

# Apply without confirmation (CI/CD only!)
terraform apply -auto-approve

# Destroy everything (DANGEROUS!)
terraform destroy

# Show current state
terraform show

# List all resources
terraform state list

# Output values
terraform output

# Import existing resource
terraform import aws_vpc.main vpc-12345678

# Refresh state (sync with AWS)
terraform refresh

# Target specific resource
terraform apply -target=module.database
```

---

## 🧪 Testing Infrastructure

### 1. **terraform plan** (Always!)
```bash
# Should show what will change
terraform plan
```

### 2. **Terratest** (Advanced)
```go
// test/vpc_test.go
func TestVPCCreation(t *testing.T) {
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/networking",
    })
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)
}
```

### 3. **Checkov** (Security scanning)
```bash
pip install checkov
checkov -d terraform/
```

### 4. **tflint** (Linting)
```bash
brew install tflint
tflint --init
tflint
```

---

## 📝 Deployment Checklist

### Before First Deploy

- [ ] AWS credentials configured
- [ ] Terraform installed (v1.5+)
- [ ] Review terraform.tfvars
- [ ] S3 bucket for state created
- [ ] DynamoDB table for locks created
- [ ] ACM certificate requested (for HTTPS)
- [ ] Domain name configured in Route53

### Every Deployment

- [ ] `git pull` latest changes
- [ ] `terraform fmt` to format code
- [ ] `terraform validate` to check syntax
- [ ] `terraform plan` to preview changes
- [ ] Review plan output carefully
- [ ] `terraform apply` to deploy
- [ ] Verify outputs
- [ ] Test application endpoints
- [ ] Check CloudWatch logs

### After Deployment

- [ ] Document any manual changes
- [ ] Update CHANGELOG.md
- [ ] Tag release in Git
- [ ] Notify team
- [ ] Monitor CloudWatch alarms

---

## 🚨 Troubleshooting

### "Error: Failed to acquire state lock"
**Cause:** Another terraform process is running or crashed
**Fix:**
```bash
# Unlock (use force ID from error message)
terraform force-unlock <LOCK_ID>
```

### "Error: InvalidParameterException: The new DB instance class is not available"
**Cause:** Instance type not available in your region/AZ
**Fix:** Change `instance_class` in variables or switch region

### "Error: VPC already exists"
**Cause:** Resource created manually or state mismatch
**Fix:**
```bash
# Import existing resource
terraform import aws_vpc.main vpc-12345678
```

### Stuck in "Creating..." state
**Cause:** AWS API timeout or dependency issue
**Fix:**
```bash
# Refresh state
terraform refresh

# If still stuck, check AWS Console for actual status
```

---

## 📚 Additional Resources

### Official Documentation
- [Terraform Docs](https://www.terraform.io/docs)
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### Learning
- [HashiCorp Learn](https://learn.hashicorp.com/terraform)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [AWS ECS Workshop](https://ecsworkshop.com/)

### Community
- [Terraform Registry](https://registry.terraform.io/) - Pre-built modules
- [AWS Samples GitHub](https://github.com/aws-samples)
- [r/Terraform](https://www.reddit.com/r/Terraform/)

---

## 🎯 Interview Talking Points

When discussing this infrastructure in interviews:

1. **"Why Terraform over manual deployment?"**
   - Reproducibility, version control, automation
   - Infrastructure as code = testable, reviewable
   - Multi-environment consistency

2. **"How do you handle secrets?"**
   - Never in code or state files
   - AWS Secrets Manager for sensitive data
   - Parameter Store for configuration
   - Environment variables at runtime

3. **"How do you ensure high availability?"**
   - Multi-AZ RDS deployment
   - ECS tasks spread across AZs
   - ALB health checks and auto-recovery
   - CloudWatch alarms for proactive monitoring

4. **"What about disaster recovery?"**
   - RDS automated backups (35-day retention)
   - Point-in-time recovery enabled
   - Infrastructure can be recreated from Terraform
   - Database snapshots before major changes

5. **"How do you manage costs?"**
   - Right-sizing instances (t3.micro for low traffic)
   - Auto-scaling to match demand
   - S3 lifecycle policies
   - CloudWatch cost anomaly detection

---

**Next:** See individual module READMEs for detailed implementation
