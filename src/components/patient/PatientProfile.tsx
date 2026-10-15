import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { PatientProfile as IPatientProfile } from '../../types';
import { User, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<IPatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [allergies, setAllergies] = useState('');

  const loadProfile = async () => {
    try {
      const res = await api.getMyPatientSummary();
      setProfile(res.profile);
      setAddress(res.profile.address || '');
      setEmergencyContactName(res.profile.emergency_contact_name || '');
      setEmergencyContactPhone(res.profile.emergency_contact_phone || '');
      setAllergies(res.profile.allergies || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSuccess('');
    try {
      await api.updatePatient(profile.id, {
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        allergies,
      });
      setSuccess('Patient record updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading patient records...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Electronic Health Record Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal clinical demographics, healthcare identifier, and emergency contacts
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Patient Data Isolated</span>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Read-Only Clinical Identifiers */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Core System Identifiers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Healthcare ID:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{profile?.healthcare_identifier}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of Birth:</span>
              <span className="font-bold text-slate-900 text-sm">{profile?.date_of_birth}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Blood Group:</span>
              <span className="font-bold text-slate-900 text-sm">{profile?.blood_type || 'O+'}</span>
            </div>
          </div>
        </div>

        {/* Editable Demographics */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Contact & Address Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  required
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  required
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical History & Allergies */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Clinical Safety Records
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recorded Drug Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Always notify clinic staff verbally of any immediate allergic reaction symptoms.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosed Chronic Conditions</label>
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 border border-slate-200">
                {profile?.medical_conditions || 'None recorded'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Record...' : 'Save Demographics'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfile;
