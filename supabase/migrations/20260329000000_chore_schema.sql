-- ============================================================
-- KRO-9: Chores, points, and kernel system schema
-- ============================================================

-- ------------------------------------------------------------
-- kids
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kids (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  emoji             text        NOT NULL,
  color             text        NOT NULL,  -- hex color token
  points_per_kernel integer     NOT NULL,
  kernel_target     integer     NOT NULL
);

-- ------------------------------------------------------------
-- chores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label          text          NOT NULL,
  icon_key       text,
  reset_cadence  text          NOT NULL CHECK (reset_cadence IN ('daily', 'weekly')),
  point_value    numeric       NOT NULL CHECK (point_value > 0),
  sort_order     integer       NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- chore_kid_assignments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chore_kid_assignments (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id  uuid NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  kid_id    uuid NOT NULL REFERENCES kids(id)   ON DELETE CASCADE,
  UNIQUE (chore_id, kid_id)
);

-- ------------------------------------------------------------
-- chore_completions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chore_completions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id     uuid        NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  kid_id       uuid        NOT NULL REFERENCES kids(id)   ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  week_start   date        NOT NULL,  -- ISO Monday, for weekly totals
  day_start    date        NOT NULL   -- Central-time date, for daily boundaries
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_completions_kid_week
  ON chore_completions (kid_id, week_start);

CREATE INDEX IF NOT EXISTS idx_completions_kid_chore_day
  ON chore_completions (kid_id, chore_id, day_start);

CREATE INDEX IF NOT EXISTS idx_completions_kid_chore_week
  ON chore_completions (kid_id, chore_id, week_start);

-- Trigger: prevent duplicate completions based on cadence
CREATE OR REPLACE FUNCTION prevent_duplicate_completions()
RETURNS TRIGGER AS $$
DECLARE
  v_cadence text;
BEGIN
  SELECT reset_cadence INTO v_cadence FROM chores WHERE id = NEW.chore_id;

  IF v_cadence = 'daily' THEN
    IF EXISTS (
      SELECT 1 FROM chore_completions
      WHERE kid_id   = NEW.kid_id
        AND chore_id = NEW.chore_id
        AND day_start = NEW.day_start
    ) THEN
      RAISE EXCEPTION 'Daily chore already completed today (kid_id=%, chore_id=%, day=%)',
        NEW.kid_id, NEW.chore_id, NEW.day_start;
    END IF;

  ELSIF v_cadence = 'weekly' THEN
    IF EXISTS (
      SELECT 1 FROM chore_completions
      WHERE kid_id    = NEW.kid_id
        AND chore_id  = NEW.chore_id
        AND week_start = NEW.week_start
    ) THEN
      RAISE EXCEPTION 'Weekly chore already completed this week (kid_id=%, chore_id=%, week=%)',
        NEW.kid_id, NEW.chore_id, NEW.week_start;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_completions
  BEFORE INSERT ON chore_completions
  FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_completions();

-- ------------------------------------------------------------
-- chore_weeks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chore_weeks (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start             date NOT NULL UNIQUE,  -- ISO Monday
  first_finisher_kid_id  uuid REFERENCES kids(id),
  friday_picker_kid_id   uuid REFERENCES kids(id),
  saturday_picker_kid_id uuid REFERENCES kids(id)
);

-- ------------------------------------------------------------
-- Row-level security
-- ------------------------------------------------------------
ALTER TABLE kids                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores                ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_kid_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_weeks           ENABLE ROW LEVEL SECURITY;

-- Allow full access via the anon/publishable key (family dashboard, no per-user auth)
CREATE POLICY "anon_all_kids"                  ON kids                  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chores"                ON chores                FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chore_kid_assignments" ON chore_kid_assignments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chore_completions"     ON chore_completions     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chore_weeks"           ON chore_weeks           FOR ALL TO anon USING (true) WITH CHECK (true);
