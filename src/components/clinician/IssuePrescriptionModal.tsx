import React, { useState, useEffect } from 'react';
import { X, Pill, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Medication } from '../../types';

interface IssuePrescriptionModalProps {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const IssuePrescriptionModal: React.FC<IssuePrescriptionModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [refillsRemaining, setRefillsRemaining] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.listMedications()
        .then((res) => {
          setMedications(res.medications);
          if (res.medications.length > 0) {
            handleSelectMedication(res.medications[0]);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSelectMedication = (med: Medication) => {
    setMedicationName(med.name);
    setDosage(med.dosage);
    setFrequency('Once daily');
    setInstructions(med.common_instructions || 'Take as directed');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim() || !dosage.trim() || !frequency.trim()) {
      setError('Please provide complete medication details.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createPrescription({
        patient_id: patientId,
        medication_name: medicationName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        instructions: instructions.trim(),
        refills_remaining: refillsRemaining,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            <h3 className="font-bold text-base">Issue Electronic Prescription (EPS)</h3>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select from Formulary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select from Practice Formulary
            </label>
            <select
              onChange={(e) => {
                const med = medications.find((m) => m.name === e.target.value);
                if (med) handleSelectMedication(med);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
            >
              {medications.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.dosage} - {m.form})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medication Name</label>
              <input
                type="text"
                required
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="e.g. Salbutamol"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage / Strength</label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 100mcg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency / Regimen</label>
              <input
                type="text"
                required
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Inhale 2 puffs every 4-6h prn"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorised Repeats</label>
              <input
                type="number"
                min={0}
                max={12}
                value={refillsRemaining}
                onChange={(e) => setRefillsRemaining(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Instructions / Cautions
            </label>
            <textarea
              required
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with food. Do not discontinue without clinical consultation..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm shadow-purple-200"
            >
              {loading ? 'Authorising...' : 'Authorise Electronic Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssuePrescriptionModal;
