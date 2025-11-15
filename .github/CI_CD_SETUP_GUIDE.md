# CI/CD Setup Guide - GitHub Actions

Complete guide to setting up and using the CI/CD pipeline for the LockIn application.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Repository Setup](#github-repository-setup)
4. [AWS IAM Configuration](#aws-iam-configuration)
5. [GitHub Secrets Configuration](#github-secrets-configuration)
6. [Workflow Overview](#workflow-overview)
7. [Testing the Pipeline](#testing-the-pipeline)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 🎯 Overview

The CI/CD pipeline automates the entire software delivery process:

```
Code Push → CI Tests → Build Docker → Push to ECR → Deploy to ECS → Health Check → Success/Rollback
```

### Workflows Included

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push, PR | Build, test, lint code |
| **CD** | Push to main/develop | Deploy to AWS |
| **Terraform** | Push to terraform/ | Manage infrastructure |
| **PR Checks** | Pull requests | Validate PRs |
| **Scheduled Tasks** | Daily (2 AM UTC) | Maintenance, security scans |
| **Release** | Git tags | Create releases |

---

## ✅ Prerequisites

Before setting up CI/CD, ensure you have:

- [ ] GitHub repository with admin access
- [ ] AWS account with appropriate permissions
- [ ] AWS CLI installed and configured locally
- [ ] Terraform state backend set up (S3 + DynamoDB)
- [ ] ECS cluster and ECR repository created

---

## 🔧 GitHub Repository Setup

### Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under "Actions permissions", select **Allow all actions and reusable workflows**
4. Click **Save**

### Step 2: Set Up Environments

Create the following environments for deployment protection:

1. Go to **Settings** → **Environments**
2. Create three environments:

#### Development Environment
```
Name: dev
Protection rules: None (auto-deploy)
```

#### Staging Environment
```
Name: staging
Protection rules:
  - Required reviewers: 1
  - Wait timer: 5 minutes
```

#### Production Environment
```
Name: production
Protection rules:
  - Required reviewers: 2
  - Wait timer: 10 minutes
  - Restrict deployments to main branch
```

### Step 3: Configure Branch Protection

Protect the `main` branch:

1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`:
   - Require pull request before merging
   - Require status checks to pass: CI, Terraform Validate
   - Require branches to be up to date
   - Require conversation resolution before merging
   - Include administrators: Checked

---

## 🔐 AWS IAM Configuration

### Step 1: Create OIDC Identity Provider

This allows GitHub Actions to authenticate with AWS without storing long-term credentials.

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Step 2: Create IAM Role for GitHub Actions

Create a file `github-actions-role.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR-GITHUB-USERNAME/LockIn-app:*"
        }
      }
    }
  ]
}
```

**Replace** `YOUR-GITHUB-USERNAME` with your actual GitHub username.

Create the role:

```bash
# Create trust policy
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://github-actions-role.json

# Attach policies (adjust as needed)
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# For Terraform
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

### Step 3: Create Custom Policy (Optional but Recommended)

For better security, create a custom policy with only required permissions:

```bash
cat > github-actions-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:ListImages",
        "ecr:BatchDeleteImage",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:UpdateService",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "logs:GetLogEvents",
        "logs:DescribeLogStreams",
        "logs:PutRetentionPolicy",
        "elbv2:DescribeTargetGroups",
        "elbv2:DescribeLoadBalancers",
        "rds:DescribeDBInstances",
        "rds:DescribeDBSnapshots",
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create policy
aws iam create-policy \
  --policy-name GitHubActionsPolicy \
  --policy-document file://github-actions-policy.json

# Attach to role
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/GitHubActionsPolicy
```

### Step 4: Get Role ARN

```bash
aws iam get-role --role-name GitHubActionsRole --query Role.Arn --output text
```

Save this ARN - you'll need it for GitHub secrets.

---

## 🔑 GitHub Secrets Configuration

### Required Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

#### AWS Credentials

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole` | IAM role for OIDC auth |
| `AWS_ACCOUNT_ID` | Your AWS account ID | For backend S3 bucket name |

#### Optional Secrets (for enhanced features)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `INFRACOST_API_KEY` | Your Infracost API key | Cost estimation on PRs |
| `SLACK_WEBHOOK_URL` | Your Slack webhook | Deployment notifications |
| `SONAR_TOKEN` | SonarCloud token | Code quality analysis |

### Environment-Specific Secrets

For each environment (dev, staging, production), add:

1. Go to **Settings** → **Environments** → Select environment
2. Add environment secrets:

| Secret Name | Value |
|-------------|-------|
| `DB_PASSWORD` | Database password for this environment |
| `JWT_SECRET` | JWT secret for this environment |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |

---

## 📊 Workflow Overview

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to any branch
- Pull requests to main/develop

**Jobs:**
1. **Code Quality** - Checkstyle, SpotBugs
2. **Build & Test** - Maven build, unit tests
3. **Integration Tests** - Tests with PostgreSQL
4. **Security Scan** - OWASP dependency check
5. **Docker Build** - Test Docker image build

**Duration:** ~5-10 minutes

### CD Workflow (`.github/workflows/cd.yml`)

**Triggers:**
- Push to main (production)
- Push to develop (staging)
- Manual dispatch

**Jobs:**
1. **Setup** - Determine environment
2. **Build & Push** - Build Docker, push to ECR
3. **Deploy to ECS** - Update ECS service
4. **Verify** - Health checks
5. **Rollback** - Auto-rollback on failure

**Duration:** ~10-15 minutes

### Terraform Workflow (`.github/workflows/terraform.yml`)

**Triggers:**
- Push to terraform/ directory
- Pull requests
- Manual dispatch

**Jobs:**
1. **Validate** - Format check, validate
2. **Security Scan** - Checkov, tfsec
3. **Plan** - Generate terraform plan
4. **Apply** - Apply changes (main branch only)
5. **Cost Estimate** - Infracost analysis

**Duration:** ~5-8 minutes

### PR Checks Workflow (`.github/workflows/pr-checks.yml`)

**Triggers:**
- Pull request opened/updated

**Jobs:**
1. **PR Validation** - Title, branch name
2. **Code Size** - Analyze changes
3. **Dependency Review** - Security check
4. **Auto Label** - Apply labels

**Duration:** ~2-3 minutes

### Scheduled Tasks Workflow (`.github/workflows/scheduled-tasks.yml`)

**Triggers:**
- Daily at 2 AM UTC
- Manual dispatch

**Jobs:**
1. **Dependency Updates** - Check for outdated deps
2. **Security Scan** - Trivy vulnerability scan
3. **ECR Cleanup** - Delete old images
4. **Log Cleanup** - Set retention policies
5. **Cost Monitoring** - Track AWS costs
6. **Health Check** - Verify services
7. **Backup Verification** - Check RDS snapshots

**Duration:** ~10-15 minutes

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push tag matching `v*.*.*`
- Manual dispatch with version

**Jobs:**
1. **Validate** - Check version format
2. **Build** - Create release artifacts
3. **Docker Release** - Build release image
4. **Changelog** - Generate from commits
5. **Create Release** - GitHub release
6. **Deploy Production** - Deploy to prod

**Duration:** ~15-20 minutes

---

## 🧪 Testing the Pipeline

### Step 1: Test CI Pipeline

```bash
# Make a small change
echo "# Test CI" >> README.md

# Commit and push
git add README.md
git commit -m "test: Verify CI pipeline"
git push origin your-branch

# Check GitHub Actions tab for running workflow
```

### Step 2: Test PR Workflow

```bash
# Create a feature branch
git checkout -b feature/test-pipeline

# Make changes
echo "Test change" > test.txt
git add test.txt
git commit -m "feat: Test PR workflow"
git push origin feature/test-pipeline

# Create PR on GitHub and observe checks
```

### Step 3: Test CD Pipeline (Dev)

```bash
# Push to develop branch (or configured dev branch)
git checkout develop
git merge feature/test-pipeline
git push origin develop

# Watch deployment in Actions tab
```

### Step 4: Test Terraform Workflow

```bash
# Modify terraform file
cd terraform
echo "# Test" >> README.md

git add .
git commit -m "docs(terraform): Test workflow"
git push

# Check for terraform plan in PR comments
```

### Step 5: Test Release

```bash
# Create a release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Watch release workflow
# Check GitHub Releases for created release
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. AWS Authentication Fails

**Error:** `Unable to locate credentials`

**Solution:**
```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Verify role ARN in GitHub secrets
# Check trust policy allows your repository
```

#### 2. ECR Push Fails

**Error:** `denied: User not authorized to perform ecr:PutImage`

**Solution:**
```bash
# Add ECR permissions to GitHubActionsRole
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

#### 3. ECS Deployment Timeout

**Error:** `wait services-stable timed out`

**Solution:**
- Check ECS task logs in CloudWatch
- Verify security groups allow ALB → ECS communication
- Check task definition has correct resources
- Increase wait timeout in workflow

#### 4. Health Check Fails

**Error:** `Health check failed after 10 attempts`

**Solution:**
```bash
# Check application logs
aws logs tail /ecs/lockin-service --follow

# Test health endpoint manually
ALB_DNS=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[0].DNSName' --output text)
curl http://$ALB_DNS/actuator/health

# Verify environment variables in ECS task
aws ecs describe-task-definition --task-definition lockin-service
```

#### 5. Terraform State Lock

**Error:** `Error locking state: ConditionalCheckFailedException`

**Solution:**
```bash
# List locks
aws dynamodb scan --table-name terraform-state-locks

# Force unlock (use with caution!)
terraform force-unlock LOCK_ID
```

### Debugging Workflows

#### Enable Debug Logging

Add these secrets to your repository:

```
ACTIONS_RUNNER_DEBUG = true
ACTIONS_STEP_DEBUG = true
```

#### View Detailed Logs

1. Go to Actions tab
2. Click on failed workflow
3. Click on failed job
4. Expand step to see detailed logs
5. Download logs for offline analysis

#### Re-run Failed Jobs

1. Go to failed workflow run
2. Click "Re-run failed jobs"
3. Or "Re-run all jobs" to start fresh

---

## 🎯 Best Practices

### Code Quality

1. **Always run CI locally before pushing:**
   ```bash
   # Run tests
   cd backend && mvn clean test

   # Build Docker image
   docker build -t lockin-app:test ./backend
   ```

2. **Keep PRs small** - Easier to review and faster CI
3. **Write meaningful commit messages** - Follow conventional commits
4. **Add tests for new features** - Maintain test coverage

### Security

1. **Never commit secrets** - Use GitHub Secrets or AWS Secrets Manager
2. **Review dependency updates** - Check for breaking changes
3. **Monitor security scan results** - Fix vulnerabilities promptly
4. **Rotate secrets regularly** - Update IAM credentials quarterly

### Deployment

1. **Test in dev first** - Validate changes before production
2. **Monitor deployments** - Watch CloudWatch dashboards
3. **Have rollback plan** - Know how to revert quickly
4. **Communicate deployments** - Notify team of production deploys

### Cost Optimization

1. **Clean up old images** - Let scheduled workflow handle this
2. **Set log retention** - Don't keep logs forever
3. **Monitor costs** - Review daily cost reports
4. **Use caching** - Docker build cache, Maven cache

### Workflow Optimization

1. **Use workflow caching:**
   ```yaml
   - uses: actions/setup-java@v4
     with:
       cache: maven
   ```

2. **Run jobs in parallel when possible**
3. **Fail fast** - Stop on first failure
4. **Use artifacts** - Pass data between jobs efficiently

---

## 📚 Additional Resources

### GitHub Actions
- [Official Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

### AWS
- [ECS Deployment](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [ECR Best Practices](https://docs.aws.amazon.com/AmazonECR/latest/userguide/best-practices.html)
- [IAM OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

### Docker
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Image Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🎓 Learning Outcomes

After setting up this CI/CD pipeline, you'll understand:

- GitHub Actions workflow syntax and triggers
- AWS OIDC authentication for secure credential-less deployments
- Docker image building and ECR management
- ECS deployment strategies and health checks
- Terraform automation with GitHub Actions
- Security scanning and dependency management
- Release management and versioning
- Automated testing strategies
- Cost monitoring and optimization

---

## ✅ Checklist

Use this checklist to ensure complete setup:

- [ ] GitHub Actions enabled
- [ ] Environments created (dev, staging, production)
- [ ] Branch protection rules configured
- [ ] AWS OIDC provider created
- [ ] IAM role created with correct trust policy
- [ ] IAM policies attached to role
- [ ] `AWS_ROLE_ARN` secret added to GitHub
- [ ] `AWS_ACCOUNT_ID` secret added to GitHub
- [ ] Environment-specific secrets configured
- [ ] CI workflow tested
- [ ] CD workflow tested
- [ ] Terraform workflow tested
- [ ] PR checks workflow tested
- [ ] Scheduled tasks workflow enabled
- [ ] Release workflow tested
- [ ] Team members added to required reviewers
- [ ] CloudWatch dashboard configured
- [ ] Alerts set up for failed deployments

---

*CI/CD pipeline powered by GitHub Actions*
*Last updated: 2025-11-15*
