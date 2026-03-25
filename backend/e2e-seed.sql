-- TESTFIX: Seed deterministic E2E bootstrap users/roles/courses for Playwright flows.
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
