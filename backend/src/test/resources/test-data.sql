MERGE INTO roles (id, name) KEY(id) VALUES
  (1, 'ADMIN'),
  (2, 'FACULTY'),
  (3, 'STUDENT');

MERGE INTO users (
  id, full_name, email, password, role_id, status, department, specialization,
  requested_faculty_id, approved_by, approved_at, deleted, created_at, updated_at
) KEY(id) VALUES
  (101, 'Admin Test', 'admin@test.com', '$2b$12$eP1n9/akZluHWdBPTWOENuPzCV0Eo38onRAmdOlf2Lj8ZnKn8o6hy', 1, 'APPROVED', 'CSE', 'Administration', NULL, NULL, NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (102, 'Faculty Test', 'faculty@test.com', '$2b$12$Gzsl/06yHnR/ga3TW9wG1eCsMJP7JiYArqHpkxoKFusmi.PKZhkvm', 2, 'APPROVED', 'CSE', 'Software Engineering', NULL, 101, CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (103, 'Student Test', 'student@test.com', '$2b$12$v6zIbrlaBEvdVOb2ulIaUemzOyVmLE.oSA4fVwX2FBw6yDs4wPJbC', 3, 'APPROVED', 'CSE', NULL, 102, 102, CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO courses (id, course_code, course_name, created_by, created_at) KEY(id) VALUES
  (201, 'CS500', 'Case Study Engineering', 102, CURRENT_TIMESTAMP);

MERGE INTO case_studies (
  id, title, description, difficulty, status, category, submission_type,
  course_id, created_by, created_at, updated_at, group_submission_enabled, teaching_notes_text, expected_outcome
) KEY(id) VALUES
  (301, 'Seed Published Case', 'Seeded published case for integration tests', 'MEDIUM', 'PUBLISHED', 'STRATEGY', 'TEXT',
   201, 102, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 'Faculty Notes', 'Expected learning outcome');

MERGE INTO course_outcomes (id, code, description, course_id) KEY(id) VALUES
  (401, 'CO1', 'Analyze complex case-study scenarios', 201);

MERGE INTO case_co_mapping (id, case_id, co_id, mapped_at) KEY(id) VALUES
  (501, 301, 401, CURRENT_TIMESTAMP);

MERGE INTO program_outcomes (id, code, description) KEY(id) VALUES
  (601, 'PO1', 'Apply engineering and management fundamentals');

MERGE INTO course_outcome_po_mapping (id, course_outcome_id, program_outcome_id, created_at) KEY(id) VALUES
  (701, 401, 601, CURRENT_TIMESTAMP);

-- HARDENED: Added deterministic baseline test seed data for auth, case, CO, and PO integration coverage.
