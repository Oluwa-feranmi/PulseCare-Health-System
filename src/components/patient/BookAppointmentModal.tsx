import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Clinician } from '../../types';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [clinicianId, setClinicianId] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:30');
  const [type, setType] = useState<'in_person' | 'video_consult' | 'telephone'>('in_person');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Default to next week day
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDate(d.toISOString().split('T')[0]);

      api.listClinicians()
        .then((res) => {
          setClinicians(res.clinicians);
          if (res.clinicians.length > 0) setClinicianId(res.clinicians[0].id);
        })
        .catch((err) => setError(err.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicianId || !date || !time || !reason.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullIsoDate = `${date}T${time}:00`;
      const selectedClinician = clinicians.find((c) => c.id === Number(clinicianId));

      await api.createAppointment({
        clinician_id: Number(clinicianId),
        appointment_date: fullIsoDate,
        duration_minutes: 30,
        appointment_type: type,
        reason: reason.trim(),
        clinic_location: selectedClinician?.room_location || 'Consulting Room 1',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold text-base">Book Clinical Consultation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Clinician / Practitioner</label>
            <select
              value={clinicianId}
              onChange={(e) => setClinicianId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              {clinicians.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.full_name} — {c.specialty} ({c.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                <option value="09:00">09:00 AM</option>
                <option value="09:30">09:30 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="14:30">02:30 PM</option>
                <option value="15:30">03:30 PM</option>
                <option value="16:00">04:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('in_person')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  type === 'in_person'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                In Person
              </button>
              <button
                type="button"
                onClick={() => setType('video_consult')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  type === 'video_consult'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Video Call
              </button>
              <button
                type="button"
                onClick={() => setType('telephone')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  type === 'telephone'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Telephone
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Consultation / Symptoms
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms or reason for scheduling..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
