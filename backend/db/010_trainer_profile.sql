-- Perfil público del entrenador (foto, nombre personal, formación).
ALTER TABLE trainers
  ADD COLUMN IF NOT EXISTS person_name text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS story text,
  ADD COLUMN IF NOT EXISTS credentials text[] NOT NULL DEFAULT '{}';

-- Estructura lista: rellenar person_name, photo_url, tagline, story y credentials
-- con datos reales antes de publicar. photo_url típico: /media/trainer.jpg
UPDATE trainers
SET tagline = COALESCE(
      tagline,
      'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online'
    ),
    story = COALESCE(
      story,
      'Trabajo sin grupos ni plantillas genéricas: cada plan se diseña para tu objetivo, tu semana y tu técnica. Presencial en Las Palmas de Gran Canaria o por videollamada, con el mismo seguimiento.'
    )
WHERE slug = 'entrenador';
