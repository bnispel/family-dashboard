-- Shared family heart jar — one row per heart tap, resets daily
CREATE TABLE IF NOT EXISTS heart_jar (
  id          text        PRIMARY KEY,  -- client-generated stable id
  date        date        NOT NULL,     -- Central-time date (for daily grouping)
  tx          numeric     NOT NULL,
  ty          numeric     NOT NULL,
  s           numeric     NOT NULL,
  rot         numeric     NOT NULL,
  color       text        NOT NULL,
  drift_x     numeric     NOT NULL,
  spawn_dy    numeric     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_heart_jar_date ON heart_jar (date);

ALTER TABLE heart_jar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_heart_jar" ON heart_jar FOR ALL TO anon USING (true) WITH CHECK (true);
