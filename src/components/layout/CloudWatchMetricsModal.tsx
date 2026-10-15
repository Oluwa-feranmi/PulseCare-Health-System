import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Activity, AlertTriangle, ShieldCheck, Clock, Layers } from 'lucide-react';
import api from '../../services/api';
import { SystemMetrics } from '../../types';

interface CloudWatchMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudWatchMetricsModal: React.FC<CloudWatchMetricsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AWS CloudWatch Observability & SRE Metrics
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Live Feed
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Application-level telemetry formatted for CloudWatch EMF & Metric Filters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {metrics ? (
            <>
              {/* Primary Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Total HTTP Requests</span>
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{metrics.metrics.totalRequests}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    {metrics.metrics.status2xx} succeeded (2xx)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Latency (Avg / p95)</span>
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {metrics.metrics.average_latency_ms} <span className="text-sm font-normal text-slate-500">/ {metrics.metrics.p95_latency_ms} ms</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">AWS Target Response Time</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Auth Success / Denied</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {metrics.metrics.authSuccesses} <span className="text-sm font-normal text-rose-500">/ {metrics.metrics.authFailures}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Brute force filter monitoring</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Error Rate</span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {metrics.metrics.error_rate_percentage}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    5xx: {metrics.metrics.status5xx} | 4xx: {metrics.metrics.status4xx}
                  </div>
                </div>
              </div>

              {/* Healthcare Clinical Domain Metrics */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Clinical Healthcare Transactions (Custom CloudWatch Metrics)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="text-xs text-slate-600 font-medium">Appointments Booked</div>
                    <div className="text-xl font-bold text-blue-700 mt-0.5">{metrics.metrics.appointmentsBooked}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600 font-medium">Appointments Cancelled</div>
                    <div className="text-xl font-bold text-slate-700 mt-0.5">{metrics.metrics.appointmentsCancelled}</div>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                    <div className="text-xs text-slate-600 font-medium">Prescriptions Authorised</div>
                    <div className="text-xl font-bold text-purple-700 mt-0.5">{metrics.metrics.prescriptionsIssued}</div>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    <div className="text-xs text-slate-600 font-medium">Clinical SOAP Notes</div>
                    <div className="text-xl font-bold text-emerald-700 mt-0.5">{metrics.metrics.clinicalNotesCreated}</div>
                  </div>
                </div>
              </div>

              {/* CloudWatch Logs Insights Query Recipe */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-100 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2 font-sans font-medium text-xs">
                  <span>CloudWatch Logs Insights Example Query:</span>
                  <span className="text-[11px] text-emerald-400">Log Group: /ecs/pulsecare-app</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-300">
                  fields @timestamp, user_role, action, status, ip_address<br />
                  | filter log_type = "AUDIT_TRAIL"<br />
                  | stats count(*) by action, status<br />
                  | sort count(*) desc
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Live Response from GET /api/metrics
                </div>
                <pre className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] font-mono text-slate-800 overflow-x-auto max-h-40">
                  {JSON.stringify(metrics, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">Loading telemetry data...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudWatchMetricsModal;
