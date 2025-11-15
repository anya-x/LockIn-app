# GitHub Secrets Reference Guide

Complete reference for all secrets required by the CI/CD pipeline.

---

## 📋 Overview

This document lists all secrets needed for the GitHub Actions workflows to function correctly.

### Secret Types

1. **Repository Secrets** - Available to all workflows
2. **Environment Secrets** - Specific to dev/staging/production environments
3. **Organization Secrets** - Shared across multiple repositories (optional)

---

## 🔐 Repository Secrets

Add these in: **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**

### Required Secrets

| Secret Name | Description | Example Value | How to Get |
|-------------|-------------|---------------|------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication | `arn:aws:iam::123456789012:role/GitHubActionsRole` | See [AWS IAM Configuration](#aws-iam-configuration) |
| `AWS_ACCOUNT_ID` | Your AWS account ID | `123456789012` | Run: `aws sts get-caller-identity --query Account --output text` |

### Optional Secrets

| Secret Name | Description | When Needed | How to Get |
|-------------|-------------|-------------|------------|
| `INFRACOST_API_KEY` | Infracost API key for cost estimates | Terraform cost estimation | Sign up at [infracost.io](https://www.infracost.io) |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Deployment notifications | Create in Slack app settings |
| `SONAR_TOKEN` | SonarCloud token | Code quality analysis | Generate in SonarCloud project |
| `CODECOV_TOKEN` | Codecov token | Test coverage reporting | Get from codecov.io |
| `SNYK_TOKEN` | Snyk token | Security vulnerability scanning | Get from snyk.io |

---

## 🌍 Environment Secrets

Add these for each environment: **Settings** → **Environments** → **{environment}** → **Add secret**

### Development Environment (`dev`)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DB_PASSWORD` | PostgreSQL password | `dev_password_123` |
| `JWT_SECRET` | JWT signing secret | `dev_jwt_secret_key` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `123456-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | `GOCSPX-abc123` |
| `ENCRYPTION_KEY` | Data encryption key | `random_32_char_string` |

### Staging Environment (`staging`)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DB_PASSWORD` | PostgreSQL password | `staging_password_456` |
| `JWT_SECRET` | JWT signing secret | `staging_jwt_secret_key` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `789012-def.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | `GOCSPX-def456` |
| `ENCRYPTION_KEY` | Data encryption key | `random_32_char_string` |

### Production Environment (`production`)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DB_PASSWORD` | PostgreSQL password | `use_aws_secrets_manager` |
| `JWT_SECRET` | JWT signing secret | `use_aws_secrets_manager` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `345678-ghi.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | `GOCSPX-ghi789` |
| `ENCRYPTION_KEY` | Data encryption key | `use_aws_secrets_manager` |

**Note:** For production, secrets should be managed in AWS Secrets Manager and referenced by ARN in environment variables.

---

## 🔧 AWS IAM Configuration

### Step 1: Create OIDC Provider

```bash
# Create OIDC provider (one-time setup)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Step 2: Create IAM Role

Create `github-actions-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/LockIn-app:*"
        }
      }
    }
  ]
}
```

**Replace:**
- `YOUR_ACCOUNT_ID` with your AWS account ID
- `YOUR_GITHUB_USERNAME` with your GitHub username

Create the role:

```bash
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://github-actions-trust-policy.json
```

### Step 3: Attach Policies

```bash
# ECS permissions
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

# ECR permissions
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

# CloudWatch Logs
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# Terraform (for infrastructure workflows)
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

### Step 4: Get Role ARN

```bash
aws iam get-role --role-name GitHubActionsRole --query Role.Arn --output text
```

Add this ARN as `AWS_ROLE_ARN` secret in GitHub.

---

## 🔑 Generating Secrets

### Database Password

```bash
# Generate strong password
openssl rand -base64 32
```

### JWT Secret

```bash
# Generate JWT secret (at least 256 bits)
openssl rand -base64 64
```

### Encryption Key

```bash
# Generate 32-character encryption key
openssl rand -hex 32
```

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Dev: `http://localhost:8080/login/oauth2/code/google`
   - Staging: `https://staging.yourdomain.com/login/oauth2/code/google`
   - Production: `https://yourdomain.com/login/oauth2/code/google`
6. Copy Client ID and Client Secret

---

## 🔒 Security Best Practices

### Secret Management

1. **Never commit secrets to version control**
   ```bash
   # Add to .gitignore
   *.env
   *.env.local
   .env.*.local
   secrets/
   *.key
   *.pem
   ```

2. **Use different secrets for each environment**
   - Development secrets can be weaker (for convenience)
   - Staging should mimic production security
   - Production must use strongest security

3. **Rotate secrets regularly**
   - Production: Every 90 days
   - Staging: Every 180 days
   - Development: Annually or when compromised

4. **Use AWS Secrets Manager for production**
   ```bash
   # Store secret in AWS
   aws secretsmanager create-secret \
     --name prod/lockin/db-password \
     --secret-string "your-secure-password"

   # Reference in ECS task definition
   "secrets": [
     {
       "name": "DB_PASSWORD",
       "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/lockin/db-password"
     }
   ]
   ```

5. **Limit secret access**
   - Only required workflows should access secrets
   - Use environment secrets for sensitive data
   - Regular review of secret access logs

### Monitoring

1. **Enable secret scanning**
   - Go to **Settings** → **Code security and analysis**
   - Enable "Secret scanning"
   - Enable "Push protection"

2. **Audit secret usage**
   ```bash
   # Check which workflows used secrets
   gh api repos/OWNER/REPO/actions/runs | \
     jq '.workflow_runs[] | select(.conclusion == "success") | .name'
   ```

3. **Set up alerts**
   - Failed authentication attempts
   - Unusual secret access patterns
   - Secret exposure in logs

---

## 🧪 Testing Secrets

### Verify AWS Authentication

```bash
# Test locally with AWS CLI
aws sts get-caller-identity

# Should output your account details
```

### Test in GitHub Actions

Create a test workflow:

```yaml
name: Test Secrets

on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Test AWS access
        run: |
          aws sts get-caller-identity
          echo "AWS authentication successful!"

      - name: Verify account ID
        run: |
          ACTUAL_ID=$(aws sts get-caller-identity --query Account --output text)
          if [ "$ACTUAL_ID" != "${{ secrets.AWS_ACCOUNT_ID }}" ]; then
            echo "Account ID mismatch!"
            exit 1
          fi
          echo "Account ID verified!"
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Secret Not Found

**Error:** `secret not found`

**Solution:**
- Verify secret name matches exactly (case-sensitive)
- Check secret is added to correct environment
- Ensure workflow has access to environment

#### 2. AWS Authentication Fails

**Error:** `Unable to locate credentials`

**Solution:**
- Verify `AWS_ROLE_ARN` is correct
- Check OIDC provider exists
- Verify trust policy allows your repository

#### 3. Secret Value is Empty

**Error:** Value is empty or null

**Solution:**
- Re-create the secret with proper value
- Ensure no trailing whitespace
- Check for proper encoding

#### 4. Environment Secret Not Available

**Error:** Secret not accessible in workflow

**Solution:**
```yaml
jobs:
  deploy:
    environment: production  # Must specify environment
    steps:
      - name: Use secret
        run: echo ${{ secrets.DB_PASSWORD }}
```

---

## 📋 Secret Checklist

Use this checklist during setup:

### Repository Secrets
- [ ] `AWS_ROLE_ARN` added
- [ ] `AWS_ACCOUNT_ID` added
- [ ] Optional secrets added (if needed)

### Development Environment
- [ ] Environment created
- [ ] `DB_PASSWORD` added
- [ ] `JWT_SECRET` added
- [ ] `GOOGLE_CLIENT_ID` added
- [ ] `GOOGLE_CLIENT_SECRET` added
- [ ] `ENCRYPTION_KEY` added

### Staging Environment
- [ ] Environment created
- [ ] Required reviewers configured
- [ ] All secrets added
- [ ] Secrets different from dev

### Production Environment
- [ ] Environment created
- [ ] Branch restrictions set
- [ ] Required reviewers configured (2+)
- [ ] All secrets added
- [ ] Secrets using AWS Secrets Manager
- [ ] Rotation schedule documented

### Security
- [ ] Secret scanning enabled
- [ ] Push protection enabled
- [ ] `.gitignore` configured
- [ ] Rotation schedule set
- [ ] Team members trained

### Testing
- [ ] Test workflow created
- [ ] AWS authentication verified
- [ ] All secrets tested
- [ ] Workflows run successfully

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [OIDC with GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Secret Rotation Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

---

## 🔄 Secret Rotation Schedule

| Secret | Frequency | Process |
|--------|-----------|---------|
| DB_PASSWORD | 90 days | Update in AWS Secrets Manager → ECS picks up automatically |
| JWT_SECRET | 90 days | Update in GitHub → Re-deploy application |
| OAuth Credentials | 180 days | Regenerate in Google Cloud Console → Update GitHub |
| Encryption Key | Never* | Only rotate if compromised (requires data re-encryption) |
| AWS IAM Role | 180 days | Review and update policies as needed |

*Encryption key rotation requires re-encrypting all encrypted data

---

*Last updated: 2025-11-15*
*Keep this document updated when adding new secrets*
