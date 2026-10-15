import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Appointment, Prescription, PatientProfile } from '../../types';
import BookAppointmentModal from './BookAppointmentModal';
import {
  Calendar,
  Pill,
  Bell,
  HeartPulse,
  AlertTriangle,
  PlusCircle,
  Clock,
  MapPin,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigate: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const summaryRes = await api.getMyPatientSummary();
      setProfile(summaryRes.profile);
      setUnreadCount(summaryRes.counts.unreadMessages);

      const apptRes = await api.listAppointments({ timeframe: 'upcoming' });
      setAppointments(apptRes.appointments);

      const rxRes = await api.listPrescriptions({ status: 'active' });
      setPrescriptions(rxRes.prescriptions);
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.updateAppointmentStatus(id, 'cancelled', 'Cancelled by patient via portal');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Retrieving electronic health records...</p>
      </div>
    );
  }

  const nextAppointment = appointments.length > 0 ? appointments[0] : null;

  return (
    <div className="space-y-6">
      {/* Patient Welcome & Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">
              Welcome, {user?.full_name}
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {profile?.healthcare_identifier || 'PC-ID'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Registered Surgery: <strong className="text-slate-700">{profile?.gp_surgery_name || 'PulseCare Health Centre'}</strong> • DOB: {profile?.date_of_birth} • Blood Group: <strong className="text-slate-700">{profile?.blood_type || 'Unknown'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
          >
            <PlusCircle className="w-4 h-4" />
            Book Consultation
          </button>
        </div>
      </div>

      {/* Clinical Alert Banners: Allergies & Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-amber-900 block">Recorded Clinical Allergies</span>
            <span className="text-xs text-amber-800">
              {profile?.allergies || 'No known drug allergies or adverse reactions on file.'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
          <HeartPulse className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-blue-900 block">Diagnosed Chronic Conditions</span>
            <span className="text-xs text-blue-800">
              {profile?.medical_conditions || 'No active chronic disease management protocols.'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('patient-appointments')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Upcoming Visits</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{appointments.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">View appointments →</div>
        </button>

        <button
          onClick={() => onNavigate('patient-prescriptions')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-400 text-left transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Active Medications</span>
            <Pill className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{prescriptions.length}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Order repeats →</div>
        </button>

        <button
          onClick={() => onNavigate('patient-messages')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-left transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Clinic Messages</span>
            <Bell className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{unreadCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">View inbox →</div>
        </button>

        <button
          onClick={() => onNavigate('patient-profile')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-left transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Medical Summary</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">Verified</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Full record →</div>
        </button>
      </div>

      {/* Main Content Split: Next Appointment & Active Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Next Upcoming Consultation
              </h2>
              <button
                onClick={() => onNavigate('patient-appointments')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                All Visits
              </button>
            </div>

            {nextAppointment ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    {nextAppointment.clinician_title} {nextAppointment.clinician_name}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                    {nextAppointment.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  {nextAppointment.specialty} ({nextAppointment.department})
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(nextAppointment.appointment_date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nextAppointment.clinic_location}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-900">Reason:</strong> {nextAppointment.reason}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    onClick={() => handleCancelAppointment(nextAppointment.id)}
                    className="text-xs font-medium text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded transition-colors"
                  >
                    Cancel Consultation
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-3">No upcoming clinical appointments scheduled.</p>
                <button
                  onClick={() => setShowBookModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors"
                >
                  Schedule Appointment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Prescriptions Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-600" />
                Current Authorised Medications
              </h2>
              <button
                onClick={() => onNavigate('patient-prescriptions')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Formulary
              </button>
            </div>

            {prescriptions.length > 0 ? (
              <div className="space-y-3">
                {prescriptions.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {p.medication_name} <span className="text-xs font-normal text-slate-500">({p.dosage})</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Instructions: {p.instructions}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Prescribed by {p.clinician_title} {p.clinician_name} • Authorised Refills: <strong>{p.refills_remaining}</strong>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No active prescriptions currently registered.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Electronic Prescribing Service (EPS) Active</span>
            <button
              onClick={() => onNavigate('patient-prescriptions')}
              className="text-purple-700 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Order Repeat Medication <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default PatientDashboard;
