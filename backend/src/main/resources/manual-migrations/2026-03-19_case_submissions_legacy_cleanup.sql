-- Cleanup for legacy case_submissions schema drift.
-- Hibernate ddl-auto=update will not drop or rename old columns such as answer_text.

DESCRIBE case_submissions;

ALTER TABLE case_submissions
  DROP COLUMN answer_text;

ALTER TABLE case_submissions
  MODIFY COLUMN solution_text TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN executive_summary TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN situation_analysis TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN root_cause_analysis TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN proposed_solution TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN implementation_plan TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN risks_and_constraints TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN conclusion TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN github_link VARCHAR(255) NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN pdf_file_name VARCHAR(255) NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN pdf_file_path VARCHAR(255) NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN faculty_feedback TEXT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN marks_awarded INT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN self_rating INT NULL;

ALTER TABLE case_submissions
  MODIFY COLUMN evaluated_at DATETIME NULL;

SHOW COLUMNS FROM case_submissions;
