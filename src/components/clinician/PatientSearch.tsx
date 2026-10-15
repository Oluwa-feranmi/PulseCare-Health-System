import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PatientProfile } from '../../types';
import { Search, User, ShieldAlert, ArrowRight, HeartPulse } from 'lucide-react';

interface PatientSearchProps {
  onSelectPatient: (patientId: number) => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ onSelectPatient }) => {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const res = await api.listPatients(searchTerm);
      setPatients(res.patients);
    } catch (err) {
      console.error('Failed to search patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(query);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-blue-600" />
          Clinical Patient Directory & Master Patient Index (MPI)
        </h1>
        <p className="text-xs text-slate-500 mb-4">
          Search registered patients by legal full name, healthcare identifier (e.g. PC-948-204), or DOB
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Patient Name (e.g. Olivia Reed), Healthcare Identifier, or Date of Birth..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            Search Directory
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                fetchPatients('');
              }}
              className="px-3 py-2.5 border border-slate-300 text-slate-600 text-xs rounded-xl hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Searching directory...</div>
      ) : patients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No matching patient records found</p>
          <p className="text-xs text-slate-500 mt-1">Try refining your search keyword or identifier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {p.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{p.full_name}</h3>
                      <span className="font-mono text-[11px] font-bold text-blue-700">
                        {p.healthcare_identifier}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    DOB: {p.date_of_birth}
                  </span>
                </div>

                <div className="py-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Gender:</span>
                    <span>{p.gender}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="font-semibold text-slate-800">{p.blood_type || 'Unknown'}</span>
                  </div>

                  {p.allergies && (
                    <div className="flex items-center gap-1.5 text-amber-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Allergies: {p.allergies}</span>
                    </div>
                  )}

                  {p.medical_conditions && (
                    <div className="flex items-center gap-1.5 text-blue-800">
                      <HeartPulse className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Conditions: {p.medical_conditions}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 truncate">
                    Address: {p.address}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => onSelectPatient(p.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  Open Electronic Health Record <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
