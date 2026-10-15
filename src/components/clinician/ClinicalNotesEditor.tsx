import React, { useState } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface ClinicalNotesEditorProps {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClinicalNotesEditor: React.FC<ClinicalNotesEditorProps> = ({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [encounterType, setEncounterType] = useState<'consultation' | 'follow_up' | 'emergency' | 'routine_review'>('consultation');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective.trim() || !objective.trim() || !assessment.trim() || !plan.trim()) {
      setError('All four SOAP sections (Subjective, Objective, Assessment, Plan) are mandatory for clinical compliance.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createClinicalNote(patientId, {
        encounter_type: encounterType,
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim(),
        plan: plan.trim(),
        is_confidential: isConfidential,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record clinical note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Document Clinical Encounter (SOAP Note)</h3>
              <p className="text-xs text-slate-400">Electronic Health Record Compliance Documentation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Encounter Type</label>
            <select
              value={encounterType}
              onChange={(e: any) => setEncounterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="consultation">General Consultation</option>
              <option value="follow_up">Follow-up Review</option>
              <option value="routine_review">Chronic Disease Routine Review</option>
              <option value="emergency">Urgent / Emergency Encounter</option>
            </select>
          </div>

          {/* S: Subjective */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              [S] Subjective <span className="font-normal text-slate-500">(Chief complaint, history of presenting illness, patient symptoms)</span>
            </label>
            <textarea
              required
              rows={2}
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              placeholder="e.g. Patient presents with 4-day history of dry persistent cough and mild exertional dyspnea..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* O: Objective */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              [O] Objective <span className="font-normal text-slate-500">(Vital signs, physical examination, diagnostic measurements)</span>
            </label>
            <textarea
              required
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. BP: 124/80 mmHg, HR: 74 bpm regular, SpO2: 98% on room air. Chest auscultation: clear bilateral breath sounds..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* A: Assessment */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              [A] Assessment <span className="font-normal text-slate-500">(Clinical differential diagnosis, evaluation)</span>
            </label>
            <textarea
              required
              rows={2}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="e.g. Mild viral upper respiratory tract infection with transient bronchial hyperreactivity. No red flags..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* P: Plan */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              [P] Plan <span className="font-normal text-slate-500">(Medications prescribed, lifestyle advice, follow-up timeline)</span>
            </label>
            <textarea
              required
              rows={2}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="e.g. Prescribed Salbutamol 100mcg inhaler prn. Advised hydration and rest. Review in 14 days if unresolved..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_confidential"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <label htmlFor="is_confidential" className="text-xs text-slate-700">
              Mark as Confidential Clinician-Only Record (Hidden from patient portal summary)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm shadow-blue-200"
            >
              {loading ? 'Recording...' : 'Authorise & Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicalNotesEditor;
