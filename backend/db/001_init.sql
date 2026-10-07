-- Prototipo: vitrina de entrenamiento personal (1 entrenador, PT 1 a 1).
-- Sin datos de salud ni área de cliente.

CREATE TABLE IF NOT EXISTS trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  modality text NOT NULL CHECK (modality IN ('presencial', 'online', 'hibrido')),
  description text,
  duration_minutes integer,
  price_cents integer,
  currency char(3) NOT NULL DEFAULT 'EUR',
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (trainer_id, slug)
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  preferred_modality text CHECK (
    preferred_modality IS NULL
    OR preferred_modality IN ('presencial', 'online', 'indiferente')
  ),
  message text,
  status text NOT NULL DEFAULT 'nuevo' CHECK (
    status IN ('nuevo', 'contactado', 'ganado', 'perdido')
  ),
  privacy_accepted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_trainer_created_idx
  ON leads (trainer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers (id) ON DELETE CASCADE,
  author_name text NOT NULL,
  quote text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
