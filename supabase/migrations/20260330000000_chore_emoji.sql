-- Add emoji column to chores (repurpose icon_key → emoji)
ALTER TABLE chores ADD COLUMN IF NOT EXISTS emoji text;
