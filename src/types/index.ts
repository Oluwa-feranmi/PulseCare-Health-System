/**
 * PulseCare Health System - Frontend Type Definitions
 */

export type UserRole = 'patient' | 'clinician' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  patient_id?: number;
  clinician_id?: number;
  healthcare_identifier?: string;
  staff_identifier?: string;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  healthcare_identifier: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies?: string;
  medical_conditions?: string;
  gp_surgery_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface Clinician {
  id: number;
  user_id: number;
  staff_identifier: string;
  specialty: string;
  department: string;
  title: string;
  room_location: string;
  full_name: string;
  email?: string;
  phone?: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentType = 'in_person' | 'video_consult' | 'telephone';

export interface Appointment {
  id: number;
  patient_id: number;
  clinician_id: number;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  clinic_location: string;
  notes?: string;
  patient_name?: string;
  patient_phone?: string;
  healthcare_identifier?: string;
  date_of_birth?: string;
  clinician_name?: string;
  clinician_title?: string;
  specialty?: string;
  department?: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  clinician_id: number;
  medication_id?: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  refills_remaining: number;
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
  patient_name?: string;
  healthcare_identifier?: string;
  clinician_name?: string;
  clinician_title?: string;
}

export interface ClinicalNote {
  id: number;
  patient_id: number;
  clinician_id: number;
  appointment_id?: number;
  encounter_type: 'consultation' | 'follow_up' | 'emergency' | 'routine_review';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  is_confidential: boolean;
  created_at: string;
  clinician_name?: string;
  clinician_title?: string;
  specialty?: string;
}

export interface Message {
  id: number;
  patient_id: number;
  clinician_id?: number;
  sender_type: 'patient' | 'clinician' | 'system';
  subject: string;
  content: string;
  is_read: boolean;
  category: 'appointment_reminder' | 'prescription_update' | 'general' | 'lab_result';
  created_at: string;
  patient_name?: string;
  clinician_name?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'denied';
  details_json?: string;
  timestamp: string;
}

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  form: string;
  common_instructions?: string;
}

export interface SystemMetrics {
  timestamp: string;
  uptime_seconds: number;
  cloudwatch_namespace: string;
  metrics: {
    totalRequests: number;
    status2xx: number;
    status4xx: number;
    status5xx: number;
    authSuccesses: number;
    authFailures: number;
    appointmentsBooked: number;
    appointmentsCancelled: number;
    prescriptionsIssued: number;
    clinicalNotesCreated: number;
    activeSessions: number;
    average_latency_ms: number;
    p95_latency_ms: number;
    error_rate_percentage: number;
  };
}
