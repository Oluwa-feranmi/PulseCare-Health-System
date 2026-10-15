import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Appointment } from '../../types';
import BookAppointmentModal from './BookAppointmentModal';
import { Calendar, PlusCircle, Clock, MapPin, Video, Phone, CheckCircle2, XCircle } from 'lucide-react';

export const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAppointments = async () => {
    try {
      const res = await api.listAppointments();
      setAppointments(res.appointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.updateAppointmentStatus(id, 'cancelled', 'Cancelled by patient');
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const filtered = appointments.filter((a) => {
    if (filter === 'upcoming') return a.status === 'scheduled' || a.status === 'confirmed';
    if (filter === 'completed') return a.status === 'completed';
    if (filter === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Clinical Appointments & Consultations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your in-person, video, and telephone clinic appointments
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
        >
          <PlusCircle className="w-4 h-4" />
          Book New Consultation
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === tab
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab} Visits
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No appointments found</p>
          <p className="text-xs text-slate-500 mt-1">You currently have no consultations in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const isUpcoming = a.status === 'scheduled' || a.status === 'confirmed';
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {a.appointment_type === 'video_consult' ? (
                        <Video className="w-5 h-5 text-blue-600" />
                      ) : a.appointment_type === 'telephone' ? (
                        <Phone className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Calendar className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {a.clinician_title} {a.clinician_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {a.specialty} • {a.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {new Date(a.appointment_date).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{a.clinic_location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="capitalize font-semibold text-slate-700">
                      Type: {a.appointment_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                  <span className="font-semibold text-slate-900">Clinical Reason:</span> {a.reason}
                </div>

                {isUpcoming && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleCancel(a.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Cancel Consultation
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BookAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={loadAppointments}
      />
    </div>
  );
};

export default PatientAppointments;
