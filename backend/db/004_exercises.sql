-- Biblioteca de ejercicios del entrenador y asignación a clientes.

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  muscle_group text NOT NULL,
  equipment text NOT NULL,
  cues text,
  video_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercises_muscle_idx ON exercises (muscle_group);

CREATE TABLE IF NOT EXISTS client_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  sets integer,
  reps text,
  rest_seconds integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS client_exercises_client_idx ON client_exercises (client_id);

INSERT INTO exercises (name, description, muscle_group, equipment, cues, video_url)
SELECT * FROM (
  VALUES
    (
      'Sentadilla con barra',
      'Sentadilla trasera para fuerza de piernas. Profundidad controlada, tronco estable.',
      'piernas',
      'barra',
      'Pies a la anchura de hombros. Rodillas siguen la línea del pie. Pecho alto.',
      NULL
    ),
    (
      'Peso muerto rumano',
      'Bisagra de cadera con barra. Enfatiza isquios y glúteo.',
      'piernas',
      'barra',
      'Barra pegada al cuerpo. Empuja la cadera atrás. Espalda neutra.',
      NULL
    ),
    (
      'Press banca',
      'Empuje horizontal en banco. Pecho, hombro anterior y tríceps.',
      'pecho',
      'banco',
      'Escápulas juntas. Pies firmes. Barra baja al pecho con control.',
      NULL
    ),
    (
      'Dominadas',
      'Tracción vertical con peso corporal. Espalda y bíceps.',
      'espalda',
      'peso_corporal',
      'Hombros abajo. Pecho hacia la barra. Sin balanceo.',
      NULL
    ),
    (
      'Remo con mancuerna',
      'Tracción unilateral apoyado en banco.',
      'espalda',
      'mancuernas',
      'Codo cerca del cuerpo. No rotar el tronco. Pausa arriba.',
      NULL
    ),
    (
      'Press militar',
      'Empuje vertical de hombros, de pie o sentado.',
      'hombros',
      'barra',
      'Costillas abajo. No hiperextender lumbar. Bloquea arriba.',
      NULL
    ),
    (
      'Plancha',
      'Isométrico de core. Línea de hombros a talones.',
      'core',
      'peso_corporal',
      'Pelvis neutra. Glúteo activo. No hundir lumbar.',
      NULL
    ),
    (
      'Swing con kettlebell',
      'Bisagra explosiva. Potencia de cadera.',
      'cuerpo_completo',
      'kettlebell',
      'Empuja la campana, no la eleves con los brazos. Cadera atrás y adelante.',
      NULL
    )
) AS seed(name, description, muscle_group, equipment, cues, video_url)
WHERE NOT EXISTS (SELECT 1 FROM exercises LIMIT 1);
