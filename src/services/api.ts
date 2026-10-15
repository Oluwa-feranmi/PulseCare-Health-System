/**
 * PulseCare Health System - API Client Service
 * Typed fetch wrapper handling Bearer token injection and error handling.
 */

import {
  User,
  PatientProfile,
  Clinician,
  Appointment,
  Prescription,
  ClinicalNote,
  Message,
  AuditLog,
  Medication,
  SystemMetrics,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('pulsecare_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errData = await res.json();
        errorMsg = errData.message || errData.error || errorMsg;
      } catch {}
      if (res.status === 401 && endpoint !== '/auth/login') {
        localStorage.removeItem('pulsecare_token');
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: any): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ user: User & { patient?: PatientProfile; clinician?: Clinician } }> {
    return this.request('/auth/me');
  }

  async getDemoAccounts(): Promise<{ demoAccounts: any[] }> {
    return this.request('/auth/demo-accounts');
  }

  // Patients
  async listPatients(search?: string): Promise<{ patients: PatientProfile[] }> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/patients${q}`);
  }

  async getPatientById(id: number): Promise<{ patient: PatientProfile }> {
    return this.request(`/patients/${id}`);
  }

  async getMyPatientSummary(): Promise<{ profile: PatientProfile; counts: { upcomingAppointments: number; activePrescriptions: number; unreadMessages: number } }> {
    return this.request('/patients/me/summary');
  }

  async updatePatient(id: number, data: Partial<PatientProfile>): Promise<{ message: string }> {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Appointments
  async listAppointments(params?: { status?: string; patientId?: number; timeframe?: string }): Promise<{ appointments: Appointment[] }> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.patientId) q.append('patientId', String(params.patientId));
    if (params?.timeframe) q.append('timeframe', params.timeframe);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/appointments${qs}`);
  }

  async listClinicians(): Promise<{ clinicians: Clinician[] }> {
    return this.request('/appointments/clinicians');
  }

  async createAppointment(data: Partial<Appointment>): Promise<{ message: string; appointmentId: number }> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: number, status: string, notes?: string): Promise<{ message: string }> {
    return this.request(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Prescriptions
  async listPrescriptions(params?: { patientId?: number; status?: string }): Promise<{ prescriptions: Prescription[] }> {
    const q = new URLSearchParams();
    if (params?.patientId) q.append('patientId', String(params.patientId));
    if (params?.status) q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/prescriptions${qs}`);
  }

  async listMedications(): Promise<{ medications: Medication[] }> {
    return this.request('/prescriptions/medications');
  }

  async createPrescription(data: Partial<Prescription>): Promise<{ message: string; prescriptionId: number }> {
    return this.request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePrescriptionStatus(id: number, status: string): Promise<{ message: string }> {
    return this.request(`/prescriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Clinical Notes (SOAP)
  async listClinicalNotes(patientId: number): Promise<{ notes: ClinicalNote[] }> {
    return this.request(`/clinical-notes/patient/${patientId}`);
  }

  async createClinicalNote(patientId: number, data: Partial<ClinicalNote>): Promise<{ message: string; noteId: number }> {
    return this.request(`/clinical-notes/patient/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Messages
  async listMessages(patientId?: number): Promise<{ messages: Message[] }> {
    const q = patientId ? `?patientId=${patientId}` : '';
    return this.request(`/messages${q}`);
  }

  async sendMessage(data: Partial<Message>): Promise<{ message: string; messageId: number }> {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessageRead(id: number): Promise<{ message: string }> {
    return this.request(`/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  // Regulatory Audit
  async listAuditLogs(params?: { action?: string; status?: string }): Promise<{ auditLogs: AuditLog[] }> {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.status) q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/audit${qs}`);
  }

  // Metrics & Health
  async getMetrics(): Promise<SystemMetrics> {
    const res = await fetch('/api/metrics');
    return res.json();
  }

  async getHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch('/health');
    return res.json();
  }

  async getReadyHealth(): Promise<{ status: string; database: any }> {
    const res = await fetch('/health/ready');
    return res.json();
  }
}

export const api = new ApiClient();
export default api;
