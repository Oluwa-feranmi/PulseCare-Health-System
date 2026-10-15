-- ==============================================================================
-- PulseCare Health System - Seed Data (100% Synthetic Fictional Records)
-- Used for local development, CI/CD testing, and portfolio demonstrations
-- ==============================================================================

-- Standard Medication Formulary Catalog
INSERT INTO medications (id, name, dosage, form, common_instructions) VALUES
(1, 'Amoxicillin', '500mg', 'Capsule', 'Take one capsule three times a day with meals for 7 days'),
(2, 'Salbutamol (Ventolin)', '100mcg', 'Inhaler', 'Inhale 1-2 puffs when experiencing shortness of breath or wheezing'),
(3, 'Atorvastatin', '20mg', 'Tablet', 'Take one tablet at night with water'),
(4, 'Metformin Hydrochloride', '500mg', 'Tablet', 'Take one tablet twice daily with breakfast and evening meals'),
(5, 'Omeprazole', '20mg', 'Capsule', 'Take one capsule once daily in the morning 30 minutes before breakfast'),
(6, 'Paracetamol', '500mg', 'Tablet', 'Take 1-2 tablets every 4-6 hours as needed for pain relief (max 8 in 24h)'),
(7, 'Lisinopril', '10mg', 'Tablet', 'Take one tablet once daily in the morning with or without food'),
(8, 'Sertraline', '50mg', 'Tablet', 'Take one tablet each morning with food');
