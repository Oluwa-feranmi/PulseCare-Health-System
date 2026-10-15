import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, 
  UserCheck, 
  Stethoscope, 
  User, 
  LogOut, 
  Download, 
  BarChart2, 
  ChevronDown,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenMetrics: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMetrics, activeTab, setActiveTab }) => {
  const { user, logout, quickSwitch } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const demoUsers = [
    { name: 'Dr. Eleanor Harrison (Lead GP)', email: 'dr.harrison@pulsecare.nhs.uk', role: 'clinician' },
    { name: 'Dr. Tariq Patel (Cardiologist)', email: 'dr.patel@pulsecare.nhs.uk', role: 'clinician' },
    { name: 'Olivia Reed (Patient - Asthma)', email: 'olivia.reed@example.com', role: 'patient' },
    { name: 'Marcus Chen (Patient - Diabetes)', email: 'marcus.chen@example.com', role: 'patient' },
  ];

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Advisory Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            AWS ECS Target Active
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="text-slate-400">Cloud & DevOps Portfolio Project (100% Synthetic Fictional Data)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <a href="/health" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
            GET /health
          </a>
          <a href="/health/ready" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
            GET /health/ready
          </a>
          <a href="/api/metrics" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
            GET /api/metrics
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">PulseCare</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Health System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Clinical EHR & Patient Care Portal
              </p>
            </div>
          </div>

          {/* Center Role Navigation (When Logged In) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {user.role === 'patient' ? (
                <>
                  <button
                    id="nav-patient-dashboard"
                    onClick={() => setActiveTab('patient-dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'patient-dashboard'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Health Dashboard
                  </button>
                  <button
                    id="nav-patient-appointments"
                    onClick={() => setActiveTab('patient-appointments')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'patient-appointments'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Appointments
                  </button>
                  <button
                    id="nav-patient-prescriptions"
                    onClick={() => setActiveTab('patient-prescriptions')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'patient-prescriptions'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Prescriptions
                  </button>
                  <button
                    id="nav-patient-messages"
                    onClick={() => setActiveTab('patient-messages')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'patient-messages'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Messages
                  </button>
                  <button
                    id="nav-patient-profile"
                    onClick={() => setActiveTab('patient-profile')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'patient-profile'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Medical Record
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="nav-clinician-dashboard"
                    onClick={() => setActiveTab('clinician-dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'clinician-dashboard'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Staff Overview
                  </button>
                  <button
                    id="nav-clinician-search"
                    onClick={() => setActiveTab('clinician-search')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'clinician-search'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Patient Directory & EHR
                  </button>
                  <button
                    id="nav-clinician-audit"
                    onClick={() => setActiveTab('clinician-audit')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'clinician-audit'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Security Audit Trail
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* CloudWatch Observability Button */}
            <button
              id="btn-open-cloudwatch"
              onClick={onOpenMetrics}
              title="Inspect Live CloudWatch Metrics & SRE Observability"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>CloudWatch Metrics</span>
            </button>

            {/* Download Source Code ZIP button */}
            <a
              id="btn-download-zip"
              href="/api/export/zip"
              download="pulsecare-health-system.zip"
              title="Download Complete Project ZIP Archive"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export ZIP</span>
            </a>

            {/* Quick Role Switcher Dropdown */}
            {user && (
              <div className="relative">
                <button
                  id="btn-role-switcher"
                  onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${user.role === 'clinician' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
                  <span className="max-w-[120px] truncate font-medium">{user.full_name}</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {user.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showSwitchMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Demo Account Switcher
                      </p>
                      <p className="text-xs text-slate-500">
                        Switch between Clinician and Patient roles instantly:
                      </p>
                    </div>

                    <div className="py-1">
                      {demoUsers.map((d) => (
                        <button
                          key={d.email}
                          onClick={() => {
                            quickSwitch(d.email);
                            setShowSwitchMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                            user.email === d.email ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {d.role === 'clinician' ? (
                              <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{d.name}</div>
                              <div className="text-[10px] text-slate-400">{d.email}</div>
                            </div>
                          </div>
                          {user.email === d.email && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 px-3">
                      <button
                        onClick={() => {
                          logout();
                          setShowSwitchMenu(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium py-1 hover:bg-rose-50 rounded"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
