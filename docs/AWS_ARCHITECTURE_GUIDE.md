# AWS Architecture & Infrastructure Guide
## PulseCare Health System — AWS Deployment Architecture

> **Notice**: As per the separation of responsibilities, this document outlines the cloud architecture, networking topology, security controls, and resource requirements. **No Terraform or IaC code is generated** — this guide empowers you to design, implement, and maintain the Terraform configuration independently.

---

## 1. High-Level Architectural Diagram (Conceptual)

```
                       Internet
                          │
                   [ Route 53 DNS ]
                          │
                 [ HTTPS Port 443 ]
                          ▼
            [ Application Load Balancer (ALB) ]
            (Public Subnets across 2 AZs: eu-west-2a, 2b)
                          │
       ┌──────────────────┴──────────────────┐
       │ HTTP Target Group (Port 3000)       │
       ▼                                     ▼
[ ECS Task (Fargate) ]              [ ECS Task (Fargate) ]
 Container: pulsecare-app            Container: pulsecare-app
 Ingress: 3000 from ALB              Ingress: 3000 from ALB
       │                                     │
       └──────────────────┬──────────────────┘
                          │
                          │ PostgreSQL Port 5432
                          ▼
          [ AWS RDS PostgreSQL (Single-AZ) ]
          db.t4g.micro (Free-Tier Eligible)
          Private DB Subnet Group
```

---

## 2. Component-by-Component Infrastructure Specification

### A. Virtual Private Cloud (VPC) & Networking

| Component | What It Does | Why PulseCare Needs It | Connections | Terraform Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **VPC** | Creates an isolated virtual network in AWS. | Isolates clinical healthcare data from the public internet. | Parent to all subnets, route tables, and gateways. | CIDR `10.0.0.0/16`. Enable `enable_dns_hostnames = true` and `enable_dns_support = true`. |
| **Public Subnets (x2)** | Subnets with a direct route table to an Internet Gateway (`0.0.0.0/0 -> igw`). | Hosts the public-facing Application Load Balancer across two Availability Zones for high availability. | Attached to Internet Gateway; routes traffic to ALB. | `10.0.1.0/24` (eu-west-2a), `10.0.2.0/24` (eu-west-2b). |
| **Database Subnets (x2)** | Isolated private subnets with no internet gateway or NAT route. | Hosts RDS PostgreSQL. Healthcare databases must never have public IP addresses or ingress routes. | Ingress from ECS Security Group only on port 5432. | `10.0.11.0/24` (eu-west-2a), `10.0.12.0/24` (eu-west-2b). Combine into an `aws_db_subnet_group`. |

> **Cost-Saving Architecture Tip (Zero NAT Gateway)**:
> AWS NAT Gateways cost ~$32/month each plus data transfer. For an economical portfolio deployment, deploy your ECS Fargate tasks in the **public subnets** with `assign_public_ip = true`, but lock down their Security Group to **ONLY accept ingress traffic from the ALB's Security Group on port 3000**. This gives ECS internet access to pull Docker images from ECR without paying for a NAT Gateway!

---

### B. Compute & Containers (AWS ECS + Fargate)

| Component | What It Does | Why PulseCare Needs It | Connections | Terraform Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon ECR** | Container registry. | Stores the Docker image built by CI/CD. | ECS Task Definition references ECR image URI. | Create repository `pulsecare-app` with image scanning on push enabled. |
| **ECS Cluster** | Logical grouping of tasks. | Orchestrates application containers. | Hosts the ECS Service. | Use `aws_ecs_cluster` with container insights enabled. |
| **ECS Task Definition** | Blueprint defining CPU, memory, environment variables, ports, and logs. | Specifies running `node dist/server.cjs` with 0.25 vCPU and 512MB RAM. | Links to CloudWatch Logs group and IAM Task Execution Role. | Set `requires_compatibilities = ["FARGATE"]`, `cpu = "256"`, `memory = "512"`, `runtime_platform = { cpu_architecture = "ARM64" }` (AWS Graviton is 20% cheaper). |
| **ECS Service** | Maintains desired count of running tasks behind ALB. | Ensures zero-downtime rolling updates and self-healing if a container crashes. | Attached to ALB Target Group. | `desired_count = 1` (dev/portfolio) or `2` (HA). `deployment_minimum_healthy_percent = 100`. |

---

### C. Load Balancing & Traffic Ingress (ALB)

| Component | What It Does | Why PulseCare Needs It | Connections | Terraform Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Application Load Balancer** | Layer 7 load balancer distributing incoming web traffic. | Handles SSL/TLS termination, health checks, and path routing. | Public internet -> ALB -> Target Group -> ECS Tasks. | `internal = false`, `load_balancer_type = "application"`, attached to public subnets. |
| **Target Group** | Directs requests to ECS tasks on port 3000. | Monitors application liveness via `/health`. | Listens on port 3000 (HTTP). | `health_check { path = "/health", matcher = "200", interval = 30, healthy_threshold = 2 }`. |

---

### D. Relational Database (Amazon RDS PostgreSQL)

| Component | What It Does | Why PulseCare Needs It | Connections | Terraform Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon RDS PostgreSQL** | Managed relational SQL database. | Stores patients, appointments, prescriptions, SOAP notes, audit logs with ACID compliance. | Attached to DB Subnet Group; Security Group accepts port 5432 from ECS. | Engine: `postgres`, Engine Version: `16.x`, Instance Class: `db.t4g.micro` (Free Tier eligible), Allocated Storage: `20` GB gp3. Single-AZ for portfolio cost savings. |

---

### E. Security, Identity & Secrets (IAM, Secrets Manager, Security Groups)

| Component | What It Does | Why PulseCare Needs It | Connections | Terraform Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **ALB Security Group** | Ingress firewall for ALB. | Accepts public web traffic on ports 80 and 443. | Ingress: 0.0.0.0/0 on 80/443; Egress: to ECS Security Group on 3000. |
| **ECS Security Group** | Ingress firewall for application containers. | Prevents anyone except the ALB from reaching the container port. | Ingress: Port 3000 strictly from ALB SG; Egress: 0.0.0.0/0 (for DB, ECR, CloudWatch). |
| **RDS Security Group** | Ingress firewall for PostgreSQL. | Blocks all internet traffic to the database. | Ingress: Port 5432 strictly from ECS SG; Egress: none. |
| **AWS Secrets Manager** | Secure vault for credentials. | Stores `DATABASE_URL` and `JWT_SECRET`. | ECS Task Execution Role retrieves secrets at runtime. | Reference in ECS container definition via `secrets { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.db_secret.arn }`. |
| **ECS Execution Role** | IAM role for ECS agent. | Grants permission to pull ECR images and fetch secrets. | Policies: `AmazonECSTaskExecutionRolePolicy`, Secrets Manager Read policy. |

---

## 3. Observability & SRE Strategy (CloudWatch)

1. **Log Ingestion**: Create an `aws_cloudwatch_log_group` named `/ecs/pulsecare-app` with 7-day retention to avoid storage charges.
2. **Log Format**: The application automatically outputs structured JSON logs. Use CloudWatch Logs Insights to query:
   ```sql
   fields @timestamp, user_role, action, status, ip_address
   | filter log_type = "AUDIT_TRAIL"
   | sort @timestamp desc
   | limit 20
   ```
3. **Metric Filters & Alarms**:
   - `HTTPCode_Target_5XX_Count > 0` -> Triggers Amazon SNS topic -> Sends notification email.
   - `DatabaseHealthUnhealthy`: Filter for `"status": "unhealthy"` in logs.
   - `P95LatencyExceeded`: Alarm when ALB `TargetResponseTime` exceeds 1.5 seconds.
