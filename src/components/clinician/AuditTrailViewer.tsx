import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AuditLog } from '../../types';
import { ShieldCheck, RefreshCw, Filter, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const AuditTrailViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.listAuditLogs({
        action: actionFilter || undefined,
        status: statusFilter || undefined,
      });
      setLogs(res.auditLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Regulatory Clinical Audit Trail & Access Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of chart access, prescription authorisations, and authentication events (Caldicott Principles & GDPR compliant)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Event:</span>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
        >
          <option value="">All Clinical Actions</option>
          <option value="PATIENT_CHART_ACCESSED">Patient Chart Accessed</option>
          <option value="PRESCRIPTION_ISSUED">Prescription Issued</option>
          <option value="CLINICAL_NOTE_CREATED">SOAP Note Documented</option>
          <option value="APPOINTMENT_CREATED">Appointment Scheduled</option>
          <option value="AUTH_LOGIN_SUCCESS">User Login Success</option>
          <option value="AUTH_LOGIN_FAILED">User Login Failure</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="denied">Access Denied</option>
          <option value="failure">Failure</option>
        </select>

        <span className="text-slate-400 ml-auto">
          Showing <strong>{logs.length}</strong> recorded audit events
        </span>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {l.action}
                    </td>
                    <td className="py-2.5 px-4">
                      {l.user_name || l.user_email || 'Anonymous'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="capitalize text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {l.user_role || 'system'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {l.resource_type}:{l.resource_id || '-'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                      {l.ip_address || '::1'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          l.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'denied'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {l.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailViewer;
