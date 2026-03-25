-- DEPLOY: Ensure ADMIN role exists before inserting bootstrap admin user.
INSERT INTO roles (name)
SELECT 'ADMIN'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'ADMIN'
);

-- DEPLOY: Idempotent admin bootstrap record aligned with current users schema.
INSERT INTO users (full_name, email, password, role_id, status, deleted, created_at, updated_at)
SELECT
  'Admin',
  'admin@icr.edu',
  '$2a$12$REPLACE_WITH_BCRYPT_HASH_OF_YOUR_ADMIN_PASSWORD',
  r.id,
  'APPROVED',
  b'0',
  NOW(),
  NOW()
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@icr.edu'
  );

-- DEPLOY: Generate hash locally and replace placeholder before production use:
-- DEPLOY: new BCryptPasswordEncoder(12).encode("YourAdminPassword")
