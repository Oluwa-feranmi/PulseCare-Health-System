import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Appointment } from '../../types';
import {
  Calendar,
  Users,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface ClinicianDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectPatient: (patientId: number) => void;
}

export const ClinicianDashboard: React.FC<ClinicianDashboardProps> = ({
  onNavigate,
  onSelectPatient,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedule = async () => {
    try {
      const res = await api.listAppointments();
      setAppointments(res.appointments);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const scheduledAppointments = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  );

  return (
    <div className="space-y-6">
      {/* Clinician Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">
              {user?.full_name}
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Staff ID: {user?.staff_identifier || 'STF-01'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Consultant Role • PulseCare Health System Clinical Electronic Workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('clinician-search')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
          >
            <Search className="w-4 h-4" />
            Search Patient Directory
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Scheduled Consultations</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{scheduledAppointments.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Pending clinic sessions</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>All Consultations</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{appointments.length}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Total recorded encounters</div>
        </div>

        <button
          onClick={() => onNavigate('clinician-audit')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-left transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Regulatory Audit Trail</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">Access Logs Active</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Inspect compliance trail →</div>
        </button>
      </div>

      {/* Clinical Schedule Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Clinic Appointment Roster
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">No scheduled patient visits on file.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectPatient(a.patient_id)}
                      className="font-bold text-sm text-blue-700 hover:underline text-left"
                    >
                      {a.patient_name || `Patient #${a.patient_id}`}
                    </button>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {a.healthcare_identifier}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'scheduled' || a.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : a.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    <strong className="text-slate-700">Reason:</strong> {a.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>
                      {new Date(a.appointment_date).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{a.appointment_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{a.clinic_location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectPatient(a.patient_id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors border border-blue-200"
                  >
                    Open Chart
                  </button>

                  {a.status !== 'completed' && a.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'completed')}
                        title="Mark Consultation Completed"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'cancelled')}
                        title="Cancel Appointment"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianDashboard;
