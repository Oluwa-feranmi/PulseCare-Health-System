import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PatientProfile, ClinicalNote, Prescription, Appointment } from '../../types';
import ClinicalNotesEditor from './ClinicalNotesEditor';
import IssuePrescriptionModal from './IssuePrescriptionModal';
import {
  ArrowLeft,
  User,
  ShieldAlert,
  FileText,
  Pill,
  Calendar,
  PlusCircle,
  MapPin,
  Clock,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

interface PatientDetailViewProps {
  patientId: number;
  onBack: () => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);

  const loadPatientChart = async () => {
    try {
      const [pRes, nRes, rxRes, aRes] = await Promise.all([
        api.getPatientById(patientId),
        api.listClinicalNotes(patientId),
        api.listPrescriptions({ patientId }),
        api.listAppointments({ patientId }),
      ]);
      setPatient(pRes.patient);
      setNotes(nRes.notes);
      setPrescriptions(rxRes.prescriptions);
      setAppointments(aRes.appointments);
    } catch (err) {
      console.error('Failed to load patient chart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientChart();
  }, [patientId]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading electronic health record...</div>;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Patient chart not found.</p>
        <button onClick={onBack} className="mt-2 text-xs text-blue-600 font-semibold hover:underline">
          Return to directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNoteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Document SOAP Note
          </button>
          <button
            onClick={() => setShowRxModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 transition-colors shadow-xs"
          >
            <Pill className="w-3.5 h-3.5" />
            Prescribe Medication
          </button>
        </div>
      </div>

      {/* Patient Master Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg">
              {patient.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {patient.healthcare_identifier}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                DOB: <strong>{patient.date_of_birth}</strong> • Gender: {patient.gender} • Blood Group: <strong className="text-slate-700">{patient.blood_type || 'Unknown'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{patient.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{patient.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Demographics & Clinical Cautions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Recorded Allergies
            </div>
            <p className="text-amber-800">{patient.allergies || 'No known allergies'}</p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="font-bold text-blue-900 mb-1">Chronic Conditions</div>
            <p className="text-blue-800">{patient.medical_conditions || 'None'}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-700 mb-1">Emergency Contact</div>
            <p className="text-slate-600">
              {patient.emergency_contact_name} ({patient.emergency_contact_phone})
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Notes (SOAP) Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Encounter Clinical Notes (SOAP EHR Records)
          </h2>
          <button
            onClick={() => setShowNoteModal(true)}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            + New Encounter
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No clinical SOAP encounter notes documented for this patient yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {n.encounter_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-600">
                      Documented by <strong>{n.clinician_title} {n.clinician_name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {n.is_confidential && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Lock className="w-3 h-3" /> Confidential Clinician-Only
                      </span>
                    )}
                    <span>{new Date(n.created_at).toLocaleString('en-GB')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">[S] Subjective:</span>
                    <p className="text-slate-700">{n.subjective}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">[O] Objective:</span>
                    <p className="text-slate-700">{n.objective}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">[A] Assessment:</span>
                    <p className="text-slate-700">{n.assessment}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">[P] Plan:</span>
                    <p className="text-slate-700">{n.plan}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Prescriptions & Past Consultations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              Medication History
            </h2>
            <button
              onClick={() => setShowRxModal(true)}
              className="text-xs text-purple-700 font-semibold hover:underline"
            >
              + Prescribe
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No medications currently prescribed.
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{p.medication_name} ({p.dosage})</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{p.instructions}</p>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>Refills remaining: {p.refills_remaining}</span>
                    <span>By {p.clinician_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-600" />
            Appointment History
          </h2>

          {appointments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No consultation appointments scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{new Date(a.appointment_date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">Reason: {a.reason}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Location: {a.clinic_location} • Clinician: {a.clinician_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ClinicalNotesEditor
        patientId={patientId}
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSuccess={loadPatientChart}
      />

      <IssuePrescriptionModal
        patientId={patientId}
        isOpen={showRxModal}
        onClose={() => setShowRxModal(false)}
        onSuccess={loadPatientChart}
      />
    </div>
  );
};

export default PatientDetailView;
