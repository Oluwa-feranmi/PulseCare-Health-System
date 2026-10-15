import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Prescription } from '../../types';
import { Pill, AlertCircle, CheckCircle, RefreshCw, Clock } from 'lucide-react';

export const PatientPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [requestSuccess, setRequestSuccess] = useState<string>('');

  const loadPrescriptions = async () => {
    try {
      const res = await api.listPrescriptions();
      setPrescriptions(res.prescriptions);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const handleRequestRepeat = async (p: Prescription) => {
    try {
      await api.sendMessage({
        subject: `Repeat Prescription Request: ${p.medication_name}`,
        content: `I would like to request an authorised refill for ${p.medication_name} (${p.dosage}, ${p.frequency}). Current remaining refills: ${p.refills_remaining}.`,
        category: 'prescription_update',
      });
      setRequestSuccess(`Repeat request sent to clinic for ${p.medication_name}. You will receive a confirmation message shortly.`);
      setTimeout(() => setRequestSuccess(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to request repeat prescription');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-600" />
            Prescriptions & Electronic Medications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View active repeat medications, clinical dosage instructions, and request pharmacy refills
          </p>
        </div>
      </div>

      {requestSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <span className="font-bold block">Patient Safety Advice</span>
          Take all medications strictly as advised by your prescribing clinician. If you experience adverse side effects, contact your GP surgery immediately or dial 111 in an emergency.
        </div>
      </div>

      {/* Prescription List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading medications...</div>
      ) : prescriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No active medications registered</p>
          <p className="text-xs text-slate-500 mt-1">You currently have no prescribed medications on your health record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{p.medication_name}</h3>
                    <span className="text-xs font-semibold text-purple-700">{p.dosage}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
                      p.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="py-3 space-y-2 text-xs text-slate-600">
                  <div>
                    <strong className="text-slate-700">Frequency:</strong> {p.frequency}
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-100">
                    <strong className="text-slate-900 block mb-0.5">Instructions:</strong>
                    {p.instructions}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Prescribed: {new Date(p.start_date).toLocaleDateString('en-GB')}</span>
                    <span>By: {p.clinician_title} {p.clinician_name}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Refills Remaining: <strong className="text-slate-900">{p.refills_remaining}</strong>
                </div>

                {p.status === 'active' && (
                  <button
                    onClick={() => handleRequestRepeat(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors border border-purple-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Request Repeat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
