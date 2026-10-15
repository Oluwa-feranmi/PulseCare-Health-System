# CI/CD Pipeline Guide (GitHub Actions -> Amazon ECR & ECS)
## PulseCare Health System — Automated Build, Test, & Deployment Pipeline

This guide outlines the staging steps, commands, and secrets required for your future GitHub Actions workflow.

---

## 1. Pipeline Stages Overview

```
[ Developer Push ]
       │
       ▼
[ Stage 1: Quality Gate & Test ]
  ├── TypeScript Compilation (`npm run lint`)
  ├── Automated Integration Tests (`npm test`)
  └── Build Artifact Verification (`npm run build`)
       │
       ▼
[ Stage 2: Containerization ]
  ├── Authenticate with AWS via OIDC / IAM Role
  ├── Log in to Amazon ECR
  ├── Build Docker Image (`docker build -t pulsecare-app .`)
  └── Tag with Git SHA and `latest`
       │
       ▼
[ Stage 3: Registry Push ]
  └── Push Image to Amazon ECR Repository
       │
       ▼
[ Stage 4: ECS Rolling Deployment ]
  ├── Render updated ECS Task Definition with new Image URI
  ├── Deploy to AWS ECS Cluster Service
  └── Wait for Service Stability
       │
       ▼
[ Stage 5: Health Probe Verification ]
  └── Curl ALB Health Endpoint (`curl -f https://your-domain.com/health`)
```

---

## 2. Command Reference per Stage

### Stage 1: Quality Gate
```bash
npm ci
npm run lint
npm test
npm run build
```

### Stage 2 & 3: Docker & Amazon ECR Push
```bash
# Authenticate Docker to AWS ECR
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com

# Build & Tag
docker build -t pulsecare-app:latest -t <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com/pulsecare-app:$GITHUB_SHA .

# Push
docker push <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com/pulsecare-app:$GITHUB_SHA
docker push <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com/pulsecare-app:latest
```

### Stage 4: ECS Deployment Trigger
```bash
# Update ECS Service with new task definition
aws ecs update-service \
  --cluster pulsecare-cluster \
  --service pulsecare-service \
  --force-new-deployment
```

### Stage 5: Synthetic Health Check
```bash
# Verify the application liveness endpoint responds with HTTP 200
curl --fail --retry 10 --retry-delay 5 --retry-connrefused https://<ALB_DNS_NAME>/health
```

---

## 3. Recommended GitHub Secrets Configuration

| Secret Name | Value Description |
| :--- | :--- |
| `AWS_ROLE_TO_ASSUME` | ARN of the GitHub OIDC IAM Role (avoids static long-lived IAM keys). |
| `AWS_REGION` | e.g. `eu-west-2` (London) or `us-east-1`. |
| `ECR_REPOSITORY` | Name of your ECR repository (e.g. `pulsecare-app`). |
| `ECS_CLUSTER` | Name of your ECS cluster (e.g. `pulsecare-cluster`). |
| `ECS_SERVICE` | Name of your ECS service (e.g. `pulsecare-service`). |
