# PulseCare Health System 🏥
### Enterprise Cloud EHR & Healthcare Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> **Portfolio Disclaimer**: PulseCare Health System is a fictional educational cloud/DevOps portfolio application inspired by modern UK digital healthcare services. It uses **100% synthetic fictional data** and is **NOT** an official NHS system or product.

---

## 🌟 Architecture & Key Capabilities

PulseCare is designed to demonstrate production-grade cloud-native engineering, full-stack TypeScript development, strict role-based access control (RBAC), and deep observability for AWS deployment.

- **Patient Portal**: Self-registration, profile management, appointment booking/cancellation, repeat prescription tracking, medical summary view (allergies, conditions, blood type), and secure communications.
- **Clinician/Staff Portal**: Clinical patient search, electronic health record (EHR) chart review, SOAP clinical encounter note documentation, electronic prescription issuance, and schedule management.
- **Security & Data Isolation**: Password hashing using `bcrypt`, tamper-proof JWT sessions, zero patient-data leakage (patients cannot view other patients' charts or appointments), and sanitized error responses.
- **Compliance & Audit Trails**: Every chart lookup, prescription issue, and authentication event is persisted to a relational audit log and emitted as structured JSON for AWS CloudWatch Logs Insights.
- **Dual-Engine Relational SQL (DAL)**: Works out of the box with zero external dependencies via embedded SQLite (`sql.js`), or seamlessly connects to **AWS RDS PostgreSQL** (or Dockerized Postgres) when `DATABASE_URL` is provided.
- **Cloud-Native Observability**: Standard `/health` (shallow liveness for ALB) and `/health/ready` (deep database readiness probe) endpoints, plus real-time latency and status code metrics.

---

## 📂 Project Repository Structure

```
pulsecare/
├── backend/
│   ├── config/              # Environment config and validation
│   ├── controllers/         # REST API route handlers
│   ├── middleware/          # JWT auth, RBAC, CloudWatch JSON logging, error handling
│   ├── routes/              # Express route declarations
│   ├── services/            # Audit trail & CloudWatch metrics services
│   └── tests/               # Automated unit & integration test suites
├── database/
│   ├── migrations/          # ANSI/PostgreSQL DDL schema migrations
│   ├── seeds/               # Safe synthetic demo datasets
│   ├── db.ts                # Unified DAL (PostgreSQL + SQLite)
│   ├── migrate.ts           # Programmatic schema migration runner
│   └── seed.ts              # Demo record seeder
├── docker/
│   ├── Dockerfile           # Multi-stage production container image
│   ├── .dockerignore        # Build context filter
│   └── docker-compose.yml   # Local multi-container stack (App + PostgreSQL 16)
├── docs/
│   ├── AWS_ARCHITECTURE_GUIDE.md  # Comprehensive AWS IaC & Terraform planning guide
│   ├── MONITORING_CLOUDWATCH.md   # CloudWatch metric filters, alarms & dashboards
│   └── CICD_PIPELINE_GUIDE.md     # GitHub Actions workflow specifications
├── scripts/
│   └── build-zip.ts         # Generates offline pulsecare-health-system.zip
├── src/                     # React 19 Frontend SPA (Vite + Tailwind)
│   ├── components/          # Patient & Clinician views, Header, Modals, Metrics
│   ├── context/             # AuthContext (JWT session) & SystemContext
│   ├── services/            # Typed API client
│   └── types/               # Shared TypeScript domain models
├── server.ts                # Express server + Vite middleware entry point
├── Dockerfile               # Production container definition
├── docker-compose.yml       # Root compose file
├── .env.example             # Documented environment variables
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm 10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database & Seed Synthetic Data
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

---

## 👥 Demo Accounts (Pre-configured)

| Role | Name | Email | Password | Primary Features |
| :--- | :--- | :--- | :--- | :--- |
| **Clinician** | Dr. Eleanor Harrison | `dr.harrison@pulsecare.nhs.uk` | `Password123!` | Lead GP: Patient search, write SOAP notes, issue prescriptions |
| **Clinician** | Dr. Tariq Patel | `dr.patel@pulsecare.nhs.uk` | `Password123!` | Consultant Cardiologist: Specialty reviews, appointments |
| **Patient** | Olivia Reed | `olivia.reed@example.com` | `Password123!` | Patient: Asthma history, active inhaler prescriptions, appointments |
| **Patient** | Marcus Chen | `marcus.chen@example.com` | `Password123!` | Patient: Type 2 Diabetes, ongoing medications, past visits |

> **Tip**: The application UI features a **"Demo Quick-Switch"** menu in the header so you can switch between Clinician and Patient views with one click without typing passwords!

---

## 🐳 Running with Docker & Docker Compose

### Option A: Complete Multi-Container Stack (App + PostgreSQL 16)
```bash
docker compose up --build
```
This boots:
- `pulsecare-postgres` on port `5432` with persistent storage volume
- `pulsecare-app` on port `3000` connected to PostgreSQL with health probes

To stop:
```bash
docker compose down
```

### Option B: Build and Run Standalone Container
```bash
docker build -t pulsecare-app .
docker run -p 3000:3000 pulsecare-app
```

---

## 🩺 Health Check & Observability Endpoints

- **GET `/health`**: Lightweight liveness probe returning HTTP 200 immediately. Used by AWS Application Load Balancer target group health checks.
- **GET `/health/ready`**: Deep readiness probe verifying active database query connectivity and latency.
- **GET `/api/metrics`**: JSON metrics summary compatible with AWS CloudWatch Metric Filters and Embedded Metric Format (EMF).
- **GET `/api/export/zip`**: Streams the complete project source code archive as a downloadable `.zip` file.

---

## 🧪 Testing Commands

```bash
# Run backend integration tests
npm test

# Run TypeScript compilation check
npm run lint

# Build production bundle
npm run build
```

---

## ☁️ AWS Deployment Planning
Refer to the detailed guides in the `docs/` folder:
- **`docs/AWS_ARCHITECTURE_GUIDE.md`**: Resource breakdown for VPC, Subnets, ALB, ECS Fargate, RDS PostgreSQL, Security Groups, and Secrets Manager.
- **`docs/MONITORING_CLOUDWATCH.md`**: CloudWatch Logs Insights queries, Metric Filters, and SNS alerting configurations.
- **`docs/CICD_PIPELINE_GUIDE.md`**: GitHub Actions pipeline steps to build, test, push to Amazon ECR, and update ECS services.
