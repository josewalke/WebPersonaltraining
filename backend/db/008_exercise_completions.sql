-- Seguimiento hecho / no hecho por ejercicio y fecha (semana en curso).

CREATE TABLE IF NOT EXISTS client_exercise_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_exercise_id uuid NOT NULL REFERENCES client_exercises (id) ON DELETE CASCADE,
  completed_on date NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_exercise_id, completed_on)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_exercise_completions_status_check'
  ) THEN
    ALTER TABLE client_exercise_completions
      ADD CONSTRAINT client_exercise_completions_status_check
      CHECK (status IN ('done', 'missed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_exercise_completions_date_idx
  ON client_exercise_completions (completed_on);
