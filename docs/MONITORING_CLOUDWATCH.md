# CloudWatch Monitoring & SRE Operations Guide
## PulseCare Health System — Metrics, Alarms, and Logs Insights

The PulseCare application is engineered with cloud observability as a first-class citizen. It emits structured JSON logs compatible with CloudWatch Metric Filters, Embedded Metric Format (EMF), and CloudWatch Logs Insights.

---

## 1. Application-Emitted Log Schemas

### Standard HTTP Request Log
Every incoming request generates a JSON record upon completion:
```json
{
  "log_level": "INFO",
  "timestamp": "2026-09-18T10:00:00.000Z",
  "request_id": "8fa8b2a3-f9d2-430b-a0ea-42bb502a9018",
  "http_method": "POST",
  "request_path": "/api/appointments",
  "status_code": 201,
  "duration_ms": 42,
  "client_ip": "82.165.197.1",
  "user_id": 3,
  "user_role": "patient",
  "user_agent": "Mozilla/5.0..."
}
```

### Regulatory Healthcare Audit Log
Sensitive clinical events emit an explicit `AUDIT_TRAIL` entry:
```json
{
  "log_type": "AUDIT_TRAIL",
  "timestamp": "2026-09-18T10:01:23.000Z",
  "user_id": 1,
  "user_role": "clinician",
  "action": "PRESCRIPTION_ISSUED",
  "resource_type": "prescription",
  "resource_id": "14",
  "status": "success",
  "ip_address": "194.72.10.4",
  "details": {
    "patient_id": 1,
    "medication_name": "Salbutamol",
    "dosage": "100mcg"
  }
}
```

---

## 2. CloudWatch Metric Filters to Configure

Create the following Metric Filters in your `/ecs/pulsecare-app` Log Group:

| Filter Name | Pattern | Metric Name | Metric Value | Unit |
| :--- | :--- | :--- | :--- | :--- |
| **Http5xxErrors** | `{ $.status_code >= 500 }` | `HTTP5xxErrorCount` | `1` | Count |
| **AuthFailures** | `{ $.action = "AUTH_LOGIN_FAILED" }` | `AuthFailureCount` | `1` | Count |
| **PatientIsolationViolations** | `{ $.action = "*_BLOCKED" }` | `SecurityAccessDenials` | `1` | Count |
| **AppointmentsBooked** | `{ $.action = "APPOINTMENT_CREATED" }` | `AppointmentsCreatedCount` | `1` | Count |
| **PrescriptionsIssued** | `{ $.action = "PRESCRIPTION_ISSUED" }` | `PrescriptionsIssuedCount` | `1` | Count |

---

## 3. High-Priority CloudWatch Alarms

### Alarm 1: Critical Server Errors (5xx Spike)
- **Metric**: `PulseCare/Production -> HTTP5xxErrorCount`
- **Statistic**: Sum
- **Period**: 1 minute
- **Threshold**: `>= 3` for 1 consecutive period
- **Action**: Publish to SNS Topic `pulsecare-critical-alerts`

### Alarm 2: Brute Force / Auth Failure Alert
- **Metric**: `PulseCare/Production -> AuthFailureCount`
- **Statistic**: Sum
- **Period**: 5 minutes
- **Threshold**: `>= 10`
- **Action**: Publish to SNS Topic `pulsecare-security-alerts`

### Alarm 3: Target Response Time (Latency Degraded)
- **Metric**: `AWS/ApplicationELB -> TargetResponseTime`
- **Statistic**: Average
- **Period**: 5 minutes
- **Threshold**: `>= 1.5` seconds
- **Action**: Publish to SNS Topic `pulsecare-performance-alerts`

---

## 4. Useful CloudWatch Logs Insights Queries

### Query 1: Top 10 Slowest Endpoints
```sql
fields @timestamp, http_method, request_path, duration_ms, status_code
| filter duration_ms > 200
| sort duration_ms desc
| limit 20
```

### Query 2: Regulatory Access History for a Patient
```sql
fields @timestamp, user_id, user_role, action, resource_type, ip_address
| filter log_type = "AUDIT_TRAIL" and details.patient_id = 1
| sort @timestamp desc
| limit 50
```

### Query 3: Security & Authorization Block Events
```sql
fields @timestamp, user_id, user_role, action, ip_address, details
| filter action like /_BLOCKED/ or status = "denied"
| sort @timestamp desc
| limit 25
```
