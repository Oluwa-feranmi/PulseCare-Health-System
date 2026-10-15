import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, Mail, ArrowRight, Stethoscope, User, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, quickSwitch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Dr. Harrison (Lead GP)', email: 'dr.harrison@pulsecare.nhs.uk', pass: 'Password123!', role: 'clinician' },
    { label: 'Dr. Patel (Cardiology)', email: 'dr.patel@pulsecare.nhs.uk', pass: 'Password123!', role: 'clinician' },
    { label: 'Olivia Reed (Patient - Asthma)', email: 'olivia.reed@example.com', pass: 'Password123!', role: 'patient' },
    { label: 'Marcus Chen (Patient - Diabetes)', email: 'marcus.chen@example.com', pass: 'Password123!', role: 'patient' },
  ];

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-200">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">PulseCare Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your NHS-inspired healthcare record or clinical workspace
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Account Quick-Fill Buttons */}
      <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          1-Click Demo Accounts (Click to Test Roles):
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                quickSwitch(acc.email, acc.pass).catch((e) => setError(e.message));
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white hover:bg-blue-50/70 hover:border-blue-300 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {acc.role === 'clinician' ? (
                  <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-600" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">{acc.label}</div>
                  <div className="text-[10px] text-slate-400">{acc.email}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {acc.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dr.harrison@pulsecare.nhs.uk"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        New patient?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-blue-700 font-semibold hover:underline"
        >
          Register for PulseCare Access
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
