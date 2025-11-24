-- scripts/wipe_db.sql
-- WARNING: This will DROP AND RECREATE the public schema, deleting all data.
-- Run manually only if you really want to wipe everything.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- extensions commonly required
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- You can re-run prisma migrate or create tables after this.
