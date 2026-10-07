-- Día de la semana en el plan del cliente (1 = lunes … 7 = domingo).

ALTER TABLE client_exercises
  ADD COLUMN IF NOT EXISTS weekday smallint NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_exercises_weekday_check'
  ) THEN
    ALTER TABLE client_exercises
      ADD CONSTRAINT client_exercises_weekday_check
      CHECK (weekday BETWEEN 1 AND 7);
  END IF;
END $$;

ALTER TABLE client_exercises
  DROP CONSTRAINT IF EXISTS client_exercises_client_id_exercise_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_exercises_client_exercise_weekday_key'
  ) THEN
    ALTER TABLE client_exercises
      ADD CONSTRAINT client_exercises_client_exercise_weekday_key
      UNIQUE (client_id, exercise_id, weekday);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_exercises_client_weekday_idx
  ON client_exercises (client_id, weekday);
