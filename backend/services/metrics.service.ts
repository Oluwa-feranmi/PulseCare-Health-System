/**
 * PulseCare Health System - CloudWatch Observability & Metrics Service
 * Tracks application operational health, throughput, error rates, and clinical metrics.
 * Integrates directly with AWS CloudWatch Metric Filters and Embedded Metric Format (EMF).
 */

interface MetricCounts {
  totalRequests: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  authSuccesses: number;
  authFailures: number;
  appointmentsBooked: number;
  appointmentsCancelled: number;
  prescriptionsIssued: number;
  clinicalNotesCreated: number;
  activeSessions: number;
}

class MetricsService {
  private startTime: number = Date.now();
  private counts: MetricCounts = {
    totalRequests: 0,
    status2xx: 0,
    status4xx: 0,
    status5xx: 0,
    authSuccesses: 0,
    authFailures: 0,
    appointmentsBooked: 0,
    appointmentsCancelled: 0,
    prescriptionsIssued: 0,
    clinicalNotesCreated: 0,
    activeSessions: 0,
  };

  private latencies: number[] = [];
  private maxLatencyHistory: number = 100;

  public recordRequest(statusCode: number, durationMs: number): void {
    this.counts.totalRequests++;
    if (statusCode >= 200 && statusCode < 300) this.counts.status2xx++;
    else if (statusCode >= 400 && statusCode < 500) this.counts.status4xx++;
    else if (statusCode >= 500) this.counts.status5xx++;

    this.latencies.push(durationMs);
    if (this.latencies.length > this.maxLatencyHistory) {
      this.latencies.shift();
    }
  }

  public recordAuthSuccess(): void {
    this.counts.authSuccesses++;
    this.counts.activeSessions++;
  }

  public recordAuthFailure(): void {
    this.counts.authFailures++;
  }

  public recordAppointmentBooked(): void {
    this.counts.appointmentsBooked++;
  }

  public recordAppointmentCancelled(): void {
    this.counts.appointmentsCancelled++;
  }

  public recordPrescriptionIssued(): void {
    this.counts.prescriptionsIssued++;
  }

  public recordClinicalNoteCreated(): void {
    this.counts.clinicalNotesCreated++;
  }

  public getSummary(): Record<string, any> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const avgLatency = this.latencies.length > 0
      ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length)
      : 0;

    const p95Latency = this.latencies.length > 0
      ? [...this.latencies].sort((a, b) => a - b)[Math.floor(this.latencies.length * 0.95)] || avgLatency
      : 0;

    return {
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      cloudwatch_namespace: 'PulseCare/Production',
      dimensions: {
        Environment: process.env.NODE_ENV || 'development',
        Application: 'PulseCare-Health-System',
      },
      metrics: {
        ...this.counts,
        average_latency_ms: avgLatency,
        p95_latency_ms: p95Latency,
        error_rate_percentage: this.counts.totalRequests > 0
          ? Number(((this.counts.status5xx / this.counts.totalRequests) * 100).toFixed(2))
          : 0,
      },
    };
  }
}

export const metricsService = new MetricsService();
export default metricsService;
