-- ==============================================================================
-- PulseCare Health System - Relational Database Schema Migration 001
-- Target: PostgreSQL (AWS RDS / Aurora) & SQLite (Local / Dev)
-- Standard ANSI SQL DDL with Foreign Keys, Constraints, and B-Tree Indexes
-- ==============================================================================

-- 1. Users Table (Core identity & credentials)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('patient', 'clinician', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patients Table (Demographics, identifiers, GP registration)
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  healthcare_identifier VARCHAR(50) UNIQUE NOT NULL, -- Fictional 10-digit ID (e.g. 482 910 3912)
  date_of_birth VARCHAR(20) NOT NULL,                -- YYYY-MM-DD
  gender VARCHAR(20) NOT NULL,
  blood_type VARCHAR(10),
  address TEXT NOT NULL,
  emergency_contact_name VARCHAR(255) NOT NULL,
  emergency_contact_phone VARCHAR(50) NOT NULL,
  allergies TEXT,
  medical_conditions TEXT,
  gp_surgery_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clinicians / Healthcare Staff Table
CREATE TABLE IF NOT EXISTS clinicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_identifier VARCHAR(50) UNIQUE NOT NULL, -- Fictional professional registration (e.g. GMC-891024)
  specialty VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  title VARCHAR(50) NOT NULL,                   -- e.g. Dr., Consultant, Lead GP
  room_location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Medication Formulary Catalog
CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  form VARCHAR(50) NOT NULL,                    -- Tablet, Inhaler, Capsule, Injection, Liquid
  common_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id INTEGER NOT NULL REFERENCES clinicians(id) ON DELETE RESTRICT,
  appointment_date VARCHAR(50) NOT NULL,        -- ISO 8601 string: YYYY-MM-DDTHH:mm
  duration_minutes INTEGER DEFAULT 30,
  reason TEXT NOT NULL,
  appointment_type VARCHAR(50) DEFAULT 'in_person' CHECK(appointment_type IN ('in_person', 'video_consult', 'telephone')),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  clinic_location VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id INTEGER NOT NULL REFERENCES clinicians(id) ON DELETE RESTRICT,
  medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  start_date VARCHAR(30) NOT NULL,
  end_date VARCHAR(30),
  refills_remaining INTEGER DEFAULT 0,
  instructions TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'completed', 'discontinued')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Clinical Notes Table (SOAP format: Subjective, Objective, Assessment, Plan)
CREATE TABLE IF NOT EXISTS clinical_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id INTEGER NOT NULL REFERENCES clinicians(id) ON DELETE RESTRICT,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  encounter_type VARCHAR(50) DEFAULT 'consultation' CHECK(encounter_type IN ('consultation', 'follow_up', 'emergency', 'routine_review')),
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Messages & Patient Notifications Table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id INTEGER REFERENCES clinicians(id) ON DELETE SET NULL,
  sender_type VARCHAR(50) NOT NULL CHECK(sender_type IN ('patient', 'clinician', 'system')),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  category VARCHAR(50) DEFAULT 'general' CHECK(category IN ('appointment_reminder', 'prescription_update', 'general', 'lab_result')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Regulatory & Security Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  ip_address VARCHAR(100),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success' CHECK(status IN ('success', 'failure', 'denied')),
  details_json TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B-Tree Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_identifier ON patients(healthcare_identifier);
CREATE INDEX IF NOT EXISTS idx_clinicians_user_id ON clinicians(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_id ON appointments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient_id ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
