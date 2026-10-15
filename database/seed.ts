/**
 * PulseCare Health System - Realistic Seed Data Generator
 * Populates fictional NHS-style patient, clinician, appointment, prescription,
 * and clinical note records for local testing and portfolio demonstrations.
 */

import bcrypt from 'bcryptjs';
import db from './db.js';
import { runMigrations } from './migrate.js';

export async function runSeeds(): Promise<void> {
  console.log('[SEED] Ensuring database schema is migrated before seeding...');
  await runMigrations();

  console.log('[SEED] Checking if database is already seeded...');
  const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
  const userCount = Number(existingUsers.rows[0]?.count || 0);

  if (userCount > 0) {
    console.log(`[SEED] Database already has ${userCount} users. Skipping seed.`);
    return;
  }

  console.log('[SEED] Generating realistic fictional healthcare seed data...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Medications Catalog
  console.log('[SEED] Seeding medications formulary...');
  const medications = [
    { name: 'Amoxicillin', dosage: '500mg', form: 'Capsule', instructions: 'Take one capsule three times daily with water for 7 days' },
    { name: 'Salbutamol (Ventolin)', dosage: '100mcg', form: 'Inhaler', instructions: 'Inhale 1-2 puffs when experiencing wheezing or shortness of breath' },
    { name: 'Atorvastatin', dosage: '20mg', form: 'Tablet', instructions: 'Take one tablet once daily at night' },
    { name: 'Metformin Hydrochloride', dosage: '500mg', form: 'Tablet', instructions: 'Take one tablet twice daily with morning and evening meals' },
    { name: 'Omeprazole', dosage: '20mg', form: 'Capsule', instructions: 'Take one capsule once daily in the morning 30 minutes before breakfast' },
    { name: 'Paracetamol', dosage: '500mg', form: 'Tablet', instructions: 'Take 1-2 tablets every 4-6 hours as needed for pain relief (max 8 per 24h)' },
    { name: 'Lisinopril', dosage: '10mg', form: 'Tablet', instructions: 'Take one tablet once daily each morning' },
    { name: 'Sertraline', dosage: '50mg', form: 'Tablet', instructions: 'Take one tablet each morning with food' },
  ];

  for (const med of medications) {
    await db.execute(
      'INSERT INTO medications (name, dosage, form, common_instructions) VALUES (?, ?, ?, ?)',
      [med.name, med.dosage, med.form, med.instructions]
    );
  }

  // 2. Seed Clinicians
  console.log('[SEED] Seeding clinicians...');
  const clinician1Res = await db.execute(
    'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
    ['dr.harrison@pulsecare.nhs.uk', passwordHash, 'clinician', 'Dr. Eleanor Harrison', '+44 7700 900142']
  );
  const clinician1UserId = clinician1Res.lastInsertId || 1;
  const clinician1DocRes = await db.execute(
    'INSERT INTO clinicians (user_id, staff_identifier, specialty, department, title, room_location) VALUES (?, ?, ?, ?, ?, ?)',
    [clinician1UserId, 'GMC-7491023', 'General Practice', 'Primary Care Services', 'Lead General Practitioner', 'Consulting Suite 3B']
  );
  const clinician1Id = clinician1DocRes.lastInsertId || 1;

  const clinician2Res = await db.execute(
    'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
    ['dr.patel@pulsecare.nhs.uk', passwordHash, 'clinician', 'Dr. Tariq Patel', '+44 7700 900881']
  );
  const clinician2UserId = clinician2Res.lastInsertId || 2;
  const clinician2DocRes = await db.execute(
    'INSERT INTO clinicians (user_id, staff_identifier, specialty, department, title, room_location) VALUES (?, ?, ?, ?, ?, ?)',
    [clinician2UserId, 'GMC-8319405', 'Cardiology', 'Cardiovascular Medicine', 'Consultant Cardiologist', 'Cardiology Clinic Rm 12']
  );
  const clinician2Id = clinician2DocRes.lastInsertId || 2;

  // 3. Seed Patients
  console.log('[SEED] Seeding patients...');
  // Patient 1: Olivia Reed
  const p1UserRes = await db.execute(
    'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
    ['olivia.reed@example.com', passwordHash, 'patient', 'Olivia Reed', '+44 7700 900451']
  );
  const p1UserId = p1UserRes.lastInsertId || 3;
  const p1DocRes = await db.execute(
    `INSERT INTO patients (user_id, healthcare_identifier, date_of_birth, gender, blood_type, address, 
      emergency_contact_name, emergency_contact_phone, allergies, medical_conditions, gp_surgery_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p1UserId,
      '482 910 3912',
      '1988-04-14',
      'Female',
      'A+',
      '14 Primrose Terrace, Highbury, London N5 2UT',
      'David Reed (Spouse)',
      '+44 7700 900992',
      'Penicillin (severe rash/anaphylactoid), Tree nuts',
      'Asthma (moderate persistent), Seasonal allergic rhinitis',
      'Highbury Community Medical Practice',
    ]
  );
  const patient1Id = p1DocRes.lastInsertId || 1;

  // Patient 2: Marcus Chen
  const p2UserRes = await db.execute(
    'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
    ['marcus.chen@example.com', passwordHash, 'patient', 'Marcus Chen', '+44 7700 900723']
  );
  const p2UserId = p2UserRes.lastInsertId || 4;
  const p2DocRes = await db.execute(
    `INSERT INTO patients (user_id, healthcare_identifier, date_of_birth, gender, blood_type, address, 
      emergency_contact_name, emergency_contact_phone, allergies, medical_conditions, gp_surgery_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p2UserId,
      '719 304 8821',
      '1974-11-29',
      'Male',
      'O+',
      '88 Nightingale Way, Islington, London N1 3QD',
      'Mei Chen (Sister)',
      '+44 7700 900331',
      'No known drug allergies (NKDA)',
      'Type 2 Diabetes Mellitus, Essential Hypertension, Hypercholesterolemia',
      'St. Jude Health Centre',
    ]
  );
  const patient2Id = p2DocRes.lastInsertId || 2;

  // Patient 3: Sarah Jenkins
  const p3UserRes = await db.execute(
    'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
    ['sarah.jenkins@example.com', passwordHash, 'patient', 'Sarah Jenkins', '+44 7700 900612']
  );
  const p3UserId = p3UserRes.lastInsertId || 5;
  const p3DocRes = await db.execute(
    `INSERT INTO patients (user_id, healthcare_identifier, date_of_birth, gender, blood_type, address, 
      emergency_contact_name, emergency_contact_phone, allergies, medical_conditions, gp_surgery_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p3UserId,
      '902 441 5567',
      '1995-08-03',
      'Female',
      'B+',
      '22 Victoria Crescent, Camden, London NW1 7PB',
      'Arthur Jenkins (Father)',
      '+44 7700 900119',
      'Latex, Aspirin',
      'Mild Atopic Eczema, Tension Headaches',
      'Camden Town Health Partnership',
    ]
  );
  const patient3Id = p3DocRes.lastInsertId || 3;

  // 4. Seed Appointments
  console.log('[SEED] Seeding appointments...');
  // Upcoming appointment for Olivia
  const appt1Res = await db.execute(
    `INSERT INTO appointments (patient_id, clinician_id, appointment_date, duration_minutes, reason, appointment_type, status, clinic_location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      clinician1Id,
      new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      30,
      'Annual Asthma & Inhaler Technique Review',
      'in_person',
      'confirmed',
      'Highbury Clinic - Room 3B',
      'Please bring your current blue and brown inhalers and peak flow diary.',
    ]
  );
  const appt1Id = appt1Res.lastInsertId || 1;

  // Past appointment for Olivia
  const appt2Res = await db.execute(
    `INSERT INTO appointments (patient_id, clinician_id, appointment_date, duration_minutes, reason, appointment_type, status, clinic_location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      clinician1Id,
      new Date(Date.now() - 86400000 * 45).toISOString().slice(0, 16),
      20,
      'Recurrent nocturnal cough and chest tightness',
      'in_person',
      'completed',
      'Highbury Clinic - Room 3B',
      'Prescribed inhaled corticosteroid step-up. Reviewed spirometry results.',
    ]
  );
  const appt2Id = appt2Res.lastInsertId || 2;

  // Upcoming appointment for Marcus
  await db.execute(
    `INSERT INTO appointments (patient_id, clinician_id, appointment_date, duration_minutes, reason, appointment_type, status, clinic_location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician2Id,
      new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 16),
      45,
      'Routine Cardiology & Blood Pressure Review',
      'in_person',
      'scheduled',
      'Islington Cardiovascular Centre - Clinic Rm 12',
      'Fasting blood tests to be completed 48 hours prior at pathology lab.',
    ]
  );

  // Past completed appointment for Marcus
  await db.execute(
    `INSERT INTO appointments (patient_id, clinician_id, appointment_date, duration_minutes, reason, appointment_type, status, clinic_location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician1Id,
      new Date(Date.now() - 86400000 * 90).toISOString().slice(0, 16),
      30,
      'Type 2 Diabetes Routine HbA1c Follow-up',
      'in_person',
      'completed',
      'Highbury Clinic - Room 3B',
      'HbA1c stable at 52 mmol/mol. Foot sensation intact.',
    ]
  );

  // 5. Seed Prescriptions
  console.log('[SEED] Seeding prescriptions...');
  // Olivia's prescriptions
  await db.execute(
    `INSERT INTO prescriptions (patient_id, clinician_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      clinician1Id,
      2,
      'Salbutamol (Ventolin)',
      '100mcg',
      '1-2 puffs as needed for breathlessness',
      '2026-01-10',
      '2026-12-31',
      3,
      'Rinse mouth after inhalation. Use spacer device if available.',
      'active',
    ]
  );

  await db.execute(
    `INSERT INTO prescriptions (patient_id, clinician_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      clinician1Id,
      8,
      'Sertraline',
      '50mg',
      'One tablet once daily',
      '2026-02-01',
      '2026-08-01',
      2,
      'Take in the morning with food. Do not discontinue without medical consultation.',
      'active',
    ]
  );

  // Marcus's prescriptions
  await db.execute(
    `INSERT INTO prescriptions (patient_id, clinician_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician1Id,
      4,
      'Metformin Hydrochloride',
      '500mg',
      'One tablet twice daily with meals',
      '2025-09-15',
      '2026-09-15',
      5,
      'Swallow whole with food to minimise gastrointestinal side-effects.',
      'active',
    ]
  );

  await db.execute(
    `INSERT INTO prescriptions (patient_id, clinician_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician2Id,
      7,
      'Lisinopril',
      '10mg',
      'One tablet once daily in the morning',
      '2025-10-01',
      '2026-10-01',
      4,
      'Monitor blood pressure weekly. Report any persistent dry cough.',
      'active',
    ]
  );

  await db.execute(
    `INSERT INTO prescriptions (patient_id, clinician_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician2Id,
      3,
      'Atorvastatin',
      '20mg',
      'One tablet at bedtime',
      '2025-10-01',
      '2026-10-01',
      4,
      'Avoid excessive grapefruit juice intake.',
      'active',
    ]
  );

  // 6. Seed SOAP Clinical Notes
  console.log('[SEED] Seeding clinical encounter notes...');
  await db.execute(
    `INSERT INTO clinical_notes (patient_id, clinician_id, appointment_id, encounter_type, subjective, objective, assessment, plan, is_confidential)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      clinician1Id,
      appt2Id,
      'consultation',
      'Patient reports 3-week history of nocturnal coughing and tightness in chest after climbing stairs. Has been using Salbutamol rescue inhaler 4-5 times weekly. No fever, hemoptysis or purulent sputum.',
      'Chest examination: Bilateral expiratory wheeze heard at bases, clear lung apices. RR: 16 bpm, SpO2: 98% on room air. Peak Expiratory Flow: 380 L/min (baseline predicted 420 L/min). Heart sounds I + II heard clearly with regular rhythm.',
      'Suboptimally controlled moderate persistent asthma, likely exacerbated by seasonal pollen count elevation.',
      '1. Step-up asthma management with inhaled corticosteroid regular preventer. 2. Continue Salbutamol PRN. 3. Patient education on spacer technique. 4. Follow-up clinic review in 6 weeks.',
      false,
    ]
  );

  await db.execute(
    `INSERT INTO clinical_notes (patient_id, clinician_id, appointment_id, encounter_type, subjective, objective, assessment, plan, is_confidential)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician1Id,
      null,
      'routine_review',
      'Marcus attended for 6-month diabetic metabolic check. Adherent with Metformin 500mg BD. Self-monitoring fasting glucose averaging 6.8 - 7.4 mmol/L. No hypoglycemia episodes or peripheral paresthesia.',
      'BP: 128/82 mmHg. BMI: 27.4 kg/m². Monofilament foot sensation intact bilaterally. Bilateral dorsalis pedis pulses palpable. Urinalysis: negative for microalbuminuria.',
      'Type 2 Diabetes Mellitus with satisfactory glycemic control and well-managed blood pressure.',
      '1. Continue Metformin 500mg BD and Lisinopril 10mg OD. 2. Pathology requisition for fasting lipid panel and HbA1c. 3. Book annual retinal screening appointment. 4. Review with Dr. Patel in Cardiology.',
      false,
    ]
  );

  // 7. Seed Messages
  console.log('[SEED] Seeding secure patient messages...');
  await db.execute(
    `INSERT INTO messages (patient_id, clinician_id, sender_type, subject, content, is_read, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      clinician1Id,
      'clinician',
      'Asthma Review Reminder & Questionnaire',
      'Dear Ms. Reed, your annual Asthma technique and peak flow review is scheduled for next week. Please remember to record your morning and evening peak flow readings for 3 days leading up to the appointment.',
      false,
      'appointment_reminder',
    ]
  );

  await db.execute(
    `INSERT INTO messages (patient_id, clinician_id, sender_type, subject, content, is_read, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1Id,
      null,
      'system',
      'Electronic Prescription Authorised',
      'Your repeat prescription request for Salbutamol (Ventolin) 100mcg has been authorised by Highbury Practice and dispatched to your nominated community pharmacy.',
      true,
      'prescription_update',
    ]
  );

  await db.execute(
    `INSERT INTO messages (patient_id, clinician_id, sender_type, subject, content, is_read, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2Id,
      clinician2Id,
      'clinician',
      'Pathology Blood Test Results - Satisfactory',
      'Dear Mr. Chen, Dr. Patel has reviewed your recent blood tests. Your fasting lipid panel and kidney function markers are within expected clinical parameters. We will discuss these in detail at your upcoming clinic appointment.',
      false,
      'lab_result',
    ]
  );

  // 8. Initial Audit Logs
  console.log('[SEED] Seeding baseline audit logs...');
  await db.execute(
    `INSERT INTO audit_logs (user_id, user_role, action, resource_type, resource_id, ip_address, user_agent, status, details_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clinician1UserId,
      'clinician',
      'SYSTEM_BOOTSTRAP',
      'system',
      'initial_dataset',
      '127.0.0.1',
      'PulseCare-Bootstrap-Worker/1.0',
      'success',
      JSON.stringify({ event: 'Initial synthetic seed database populated successfully' }),
    ]
  );

  console.log('[SEED] Realistic fictional healthcare seed data populated successfully!');
}

// Run directly if called as main script
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Fatal error during database seed:', err);
      process.exit(1);
    });
}
