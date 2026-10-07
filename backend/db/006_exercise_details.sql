-- Ficha completa del ejercicio: nivel, músculos, montaje, errores y tempo.

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS primary_muscles text,
  ADD COLUMN IF NOT EXISTS setup text,
  ADD COLUMN IF NOT EXISTS mistakes text,
  ADD COLUMN IF NOT EXISTS tempo text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exercises_difficulty_check'
  ) THEN
    ALTER TABLE exercises
      ADD CONSTRAINT exercises_difficulty_check
      CHECK (difficulty IS NULL OR difficulty IN ('principiante', 'intermedio', 'avanzado'));
  END IF;
END $$;
