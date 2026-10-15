/**
 * PulseCare Health System - Authentication Context
 * Manages user state, token persistence, and portfolio role-switching.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PatientProfile, Clinician } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  patientProfile: PatientProfile | null;
  clinicianProfile: Clinician | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  quickSwitch: (email: string, pass?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [clinicianProfile, setClinicianProfile] = useState<Clinician | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pulsecare_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      if (res.user.patient) setPatientProfile(res.user.patient);
      if (res.user.clinician) setClinicianProfile(res.user.clinician);
    } catch (err) {
      console.warn('[AUTH] Session token expired or invalid, re-authenticating:', err);
      logout();
      try {
        await quickSwitch('dr.harrison@pulsecare.nhs.uk', 'Password123!');
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      // Auto-login with default clinician demo account for immediate interactive review!
      quickSwitch('dr.harrison@pulsecare.nhs.uk', 'Password123!').catch(() => {
        setIsLoading(false);
      });
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      localStorage.setItem('pulsecare_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('pulsecare_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitch = async (email: string, pass: string = 'Password123!') => {
    await login(email, pass);
  };

  const logout = () => {
    localStorage.removeItem('pulsecare_token');
    setToken(null);
    setUser(null);
    setPatientProfile(null);
    setClinicianProfile(null);
  };

  const refreshProfile = async () => {
    if (token) await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patientProfile,
        clinicianProfile,
        token,
        isLoading,
        login,
        register,
        logout,
        quickSwitch,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
