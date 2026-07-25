ALTER TABLE invites
  DROP CONSTRAINT invites_created_by_fkey;

ALTER TABLE invites
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE invites
  ADD CONSTRAINT invites_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
