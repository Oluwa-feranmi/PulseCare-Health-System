/**
 * PulseCare Health System - Main Application Component
 * Manages view routing, user session lifecycle, and SRE observability overlay.
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CloudWatchMetricsModal from './components/layout/CloudWatchMetricsModal';

// Auth Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Patient Components
import PatientDashboard from './components/patient/PatientDashboard';
import PatientAppointments from './components/patient/PatientAppointments';
import PatientPrescriptions from './components/patient/PatientPrescriptions';
import PatientMessages from './components/patient/PatientMessages';
import PatientProfile from './components/patient/PatientProfile';

// Clinician Components
import ClinicianDashboard from './components/clinician/ClinicianDashboard';
import PatientSearch from './components/clinician/PatientSearch';
import PatientDetailView from './components/clinician/PatientDetailView';
import AuditTrailViewer from './components/clinician/AuditTrailViewer';

function MainContent() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState<boolean>(false);

  // Synchronize default tab on role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'patient') {
        setActiveTab('patient-dashboard');
      } else {
        setActiveTab('clinician-dashboard');
      }
      setSelectedPatientId(null);
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-600">Initializing PulseCare Clinical Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedPatientId(null);
        }}
        onOpenMetrics={() => setIsMetricsModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <div className="py-8">
            {authView === 'login' ? (
              <LoginForm onSwitchToRegister={() => setAuthView('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
            )}
          </div>
        ) : user.role === 'patient' ? (
          // ================= PATIENT WORKSPACE =================
          <>
            {activeTab === 'patient-dashboard' && (
              <PatientDashboard onNavigate={(tab) => setActiveTab(tab)} />
            )}
            {activeTab === 'patient-appointments' && <PatientAppointments />}
            {activeTab === 'patient-prescriptions' && <PatientPrescriptions />}
            {activeTab === 'patient-messages' && <PatientMessages />}
            {activeTab === 'patient-profile' && <PatientProfile />}
          </>
        ) : (
          // ================= CLINICIAN WORKSPACE =================
          <>
            {selectedPatientId ? (
              <PatientDetailView
                patientId={selectedPatientId}
                onBack={() => setSelectedPatientId(null)}
              />
            ) : (
              <>
                {activeTab === 'clinician-dashboard' && (
                  <ClinicianDashboard
                    onNavigate={(tab) => setActiveTab(tab)}
                    onSelectPatient={(pId) => setSelectedPatientId(pId)}
                  />
                )}
                {activeTab === 'clinician-search' && (
                  <PatientSearch onSelectPatient={(pId) => setSelectedPatientId(pId)} />
                )}
                {activeTab === 'clinician-audit' && <AuditTrailViewer />}
              </>
            )}
          </>
        )}
      </main>

      <Footer />

      <CloudWatchMetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
