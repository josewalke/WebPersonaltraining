-- Categorías de ejercicios (gestionables por el administrador).

CREATE TABLE IF NOT EXISTS exercise_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercise_categories_active_idx
  ON exercise_categories (is_active, sort_order, name);

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES exercise_categories (id);

INSERT INTO exercise_categories (name, sort_order)
SELECT seed.name, seed.sort_order
FROM (
  VALUES
    ('Pecho', 10),
    ('Espalda', 20),
    ('Piernas', 30),
    ('Hombros', 40),
    ('Brazos', 50),
    ('Core', 60),
    ('Cardio', 70),
    ('Cuerpo completo', 80)
) AS seed(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_categories c WHERE c.name = seed.name
);

UPDATE exercises e
SET category_id = c.id
FROM exercise_categories c
WHERE e.category_id IS NULL
  AND (
    (e.muscle_group = 'pecho' AND c.name = 'Pecho')
    OR (e.muscle_group = 'espalda' AND c.name = 'Espalda')
    OR (e.muscle_group = 'piernas' AND c.name = 'Piernas')
    OR (e.muscle_group = 'hombros' AND c.name = 'Hombros')
    OR (e.muscle_group = 'brazos' AND c.name = 'Brazos')
    OR (e.muscle_group = 'core' AND c.name = 'Core')
    OR (e.muscle_group = 'cardio' AND c.name = 'Cardio')
    OR (e.muscle_group = 'cuerpo_completo' AND c.name = 'Cuerpo completo')
  );

UPDATE exercises
SET category_id = (
  SELECT id FROM exercise_categories WHERE is_active = true ORDER BY sort_order, name LIMIT 1
)
WHERE category_id IS NULL
  AND EXISTS (SELECT 1 FROM exercise_categories WHERE is_active = true);

ALTER TABLE exercises ALTER COLUMN category_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS exercises_category_idx ON exercises (category_id);
