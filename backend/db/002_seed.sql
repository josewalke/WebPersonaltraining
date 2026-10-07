-- Datos ficticios de prototipo. Sustituir cuando exista marca real.

INSERT INTO trainers (display_name, slug, bio, city)
SELECT
  'Power Up',
  'entrenador',
  'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online. Fuerza, técnica y hábitos con seguimiento cercano.',
  'Las Palmas de Gran Canaria'
WHERE NOT EXISTS (SELECT 1 FROM trainers WHERE slug = 'entrenador');

UPDATE trainers
SET display_name = 'Power Up',
    bio = 'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online. Fuerza, técnica y hábitos con seguimiento cercano.',
    city = 'Las Palmas de Gran Canaria'
WHERE slug = 'entrenador';

INSERT INTO services (
  trainer_id, name, slug, modality, description, duration_minutes, price_cents
)
SELECT
  t.id,
  s.name,
  s.slug,
  s.modality,
  s.description,
  s.duration_minutes,
  s.price_cents
FROM trainers t
CROSS JOIN (
  VALUES
    (
      'Entrenamiento personal presencial',
      'pt-presencial',
      'presencial',
      'Sesión 1 a 1 en Las Palmas de Gran Canaria.',
      60::integer,
      NULL::integer
    ),
    (
      'Entrenamiento personal online',
      'pt-online',
      'online',
      'Sesión 1 a 1 a distancia.',
      60::integer,
      NULL::integer
    )
) AS s(name, slug, modality, description, duration_minutes, price_cents)
WHERE t.slug = 'entrenador'
  AND NOT EXISTS (
    SELECT 1
    FROM services existing
    WHERE existing.trainer_id = t.id
      AND existing.slug = s.slug
  );

-- Testimonios detallados se cargan en 009_realistic_content.sql
INSERT INTO testimonials (trainer_id, author_name, quote, is_published)
SELECT
  t.id,
  'Cliente de ejemplo',
  'Texto de testimonio para maquetar la web. No es un caso real.',
  false
FROM trainers t
WHERE t.slug = 'entrenador'
  AND NOT EXISTS (
    SELECT 1 FROM testimonials WHERE author_name = 'Cliente de ejemplo'
  );
