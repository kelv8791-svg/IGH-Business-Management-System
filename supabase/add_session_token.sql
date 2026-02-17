-- Add session_token column to users table to track active sessions
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token TEXT;
