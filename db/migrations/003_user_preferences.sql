-- User preferences table for queer-cycle
-- user_id is the UUID from auth.users (JWT sub claim); stored as text to avoid cross-schema FK complexity
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id      TEXT PRIMARY KEY,
  period_color TEXT NOT NULL DEFAULT '#C17A5A',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
