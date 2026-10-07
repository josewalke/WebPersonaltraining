-- Contenido demo más realista: categorías, fichas, solicitudes y testimonios.
-- Idempotente: no duplica si el nombre/email ya existe.

-- Categorías extra (orden alfabético en la API; sort_order ya no importa).
INSERT INTO exercise_categories (name, sort_order)
SELECT seed.name, 0
FROM (
  VALUES
    ('Movilidad'),
    ('Empujes'),
    ('Tirones'),
    ('Posterior'),
    ('Acondicionamiento')
) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_categories c WHERE c.name = seed.name
);

-- Bio y ciudad del estudio.
UPDATE trainers
SET bio = 'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online. Fuerza, técnica y hábitos: sin grupos, sin plantillas genéricas. Plazas limitadas.',
    city = 'Las Palmas de Gran Canaria'
WHERE slug = 'entrenador';

-- Servicios con copy más concreto.
UPDATE services
SET description = 'Sesión presencial en Las Palmas de Gran Canaria. Técnica, carga y progresión adaptadas a ti.',
    duration_minutes = 60,
    price_cents = 5500
WHERE slug = 'pt-presencial';

UPDATE services
SET description = 'Videollamada con seguimiento de series, vídeo de técnica y ajustes semanales.',
    duration_minutes = 45,
    price_cents = 4500
WHERE slug = 'pt-online';

INSERT INTO services (
  trainer_id, name, slug, modality, description, duration_minutes, price_cents
)
SELECT
  t.id,
  'Valoración inicial',
  'valoracion',
  'hibrido',
  'Primera cita: objetivos, historial, movilidad y prueba de fuerza básica. Define el plan de las primeras 4 semanas.',
  75,
  7000
FROM trainers t
WHERE t.slug = 'entrenador'
  AND NOT EXISTS (
    SELECT 1 FROM services s WHERE s.trainer_id = t.id AND s.slug = 'valoracion'
  );

-- Testimonios realistas (sustituyen el de maqueta si sigue solo).
UPDATE testimonials
SET is_published = false
WHERE author_name = 'Cliente de ejemplo';

-- Citas demo: existen en BD para maquetar el admin, pero no se publican en la web.
INSERT INTO testimonials (trainer_id, author_name, quote, is_published)
SELECT t.id, seed.author_name, seed.quote, false
FROM trainers t
CROSS JOIN (
  VALUES
    (
      'Laura G.',
      'En tres meses bajé de peso sin dejar de entrenar fuerte. Lo que más noto es que ya no improviso: cada sesión tiene un porqué.'
    ),
    (
      'Miguel R.',
      'Vengo de lesionarme el hombro. Aquí no me empujaron a cargar por ego: arreglamos la técnica y volví a press con cabeza.'
    ),
    (
      'Sofía V.',
      'Online funciona mejor de lo que pensaba. Me mandan correcciones por vídeo y llego a la siguiente sesión sabiendo qué mejorar.'
    ),
    (
      'Andrés P.',
      'Pasé de ir al gym a ciegas a tener un plan de lunes a viernes. Cumplo más porque sé qué toca cada día.'
    )
) AS seed(author_name, quote)
WHERE t.slug = 'entrenador'
  AND NOT EXISTS (
    SELECT 1 FROM testimonials x WHERE x.author_name = seed.author_name
  );

-- Solicitudes de plaza (leads).
INSERT INTO leads (
  trainer_id, full_name, email, phone, preferred_modality, message, status, privacy_accepted_at
)
SELECT
  t.id,
  seed.full_name,
  seed.email,
  seed.phone,
  seed.preferred_modality,
  seed.message,
  seed.status,
  now() - (seed.days_ago || ' days')::interval
FROM trainers t
CROSS JOIN (
  VALUES
    (
      'Elena Navarro',
      'elena.navarro@ejemplo.com',
      '612345001',
      'presencial',
      'Quiero ganar fuerza y mejorar la postura. Puedo entrenar martes y jueves por la tarde.',
      'nuevo',
      1
    ),
    (
      'Javier Ortega',
      'javier.ortega@ejemplo.com',
      '612345002',
      'online',
      'Viajo mucho. Busco seguimiento online 2–3 días/semana y foco en espalda y core.',
      'contactado',
      3
    ),
    (
      'Marina López',
      'marina.lopez@ejemplo.com',
      '612345003',
      'indiferente',
      'Preparación para una carrera de obstáculos en 4 meses. ¿Hay hueco para valoración?',
      'nuevo',
      0
    ),
    (
      'Pablo Díez',
      'pablo.diez@ejemplo.com',
      NULL,
      'presencial',
      'He entrenado en caja CrossFit y quiero pasar a fuerza más controlada.',
      'ganado',
      12
    ),
    (
      'Nuria Campos',
      'nuria.campos@ejemplo.com',
      '612345005',
      'online',
      'Solo puedo temprano. Me interesa perder grasa sin perder músculo.',
      'perdido',
      20
    ),
    (
      'Hugo Ferrer',
      'hugo.ferrer@ejemplo.com',
      '600112233',
      'presencial',
      'Operario de almacén. Quiero espalda fuerte y no volver a lesionarme. Disponibilidad L-X-V 19:00.',
      'nuevo',
      0
    ),
    (
      'Irene Salas',
      'irene.salas@ejemplo.com',
      '655998877',
      'online',
      'Empezando desde cero. Nunca he pisado un gym. ¿La valoración puede ser online?',
      'contactado',
      2
    ),
    (
      'Tomás Gil',
      'tomas.gil@ejemplo.com',
      '622334455',
      'presencial',
      'Prep. oposiciones: necesito fuerza general y no pasarme de 3 días/semana.',
      'nuevo',
      1
    ),
    (
      'Bea Romero',
      'bea.romero@ejemplo.com',
      NULL,
      'indiferente',
      'Trasparto hace 8 meses. Quiero volver con seguridad, foco core y glúteo.',
      'contactado',
      5
    )
) AS seed(full_name, email, phone, preferred_modality, message, status, days_ago)
WHERE t.slug = 'entrenador'
  AND NOT EXISTS (
    SELECT 1 FROM leads l WHERE l.email = seed.email
  );

-- Fichas de ejercicio completas.
WITH cat AS (
  SELECT id, name FROM exercise_categories WHERE is_active = true
),
seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'Sentadilla con barra',
        'Piernas',
        'piernas',
        'barra',
        'intermedio',
        'Cuádriceps, glúteo, core',
        'Barra alta o baja. Pies a la anchura de hombros, punta ligeramente fuera. Activa el tronco antes de bajar.',
        'Sentadilla trasera controlada. Baja hasta profundidad cómoda con control; sube empujando el suelo.',
        'Rodillas siguen la línea del pie. Pecho alto. No rebotar abajo.',
        'Rodillas que colapsan dentro. Talones que se levantan. Lumbar que se redondea.',
        '3-1-1-0'
      ),
      (
        'Peso muerto rumano',
        'Posterior',
        'piernas',
        'barra',
        'intermedio',
        'Isquiosurales, glúteo, erectores',
        'Agarre prono a la anchura de hombros. Rodillas semiflexionadas. Empuja la cadera atrás manteniendo la barra cerca.',
        'Bisagra de cadera con barra. Estira la cadena posterior sin redondear la espalda.',
        'Barra pegada al cuerpo. Empuja cadera atrás. Espalda neutra.',
        'Arrastrar la barra lejos. Bloqueo de rodillas. Mirar al techo y arquear cervical.',
        '3-0-1-0'
      ),
      (
        'Press banca',
        'Empujes',
        'pecho',
        'banco',
        'intermedio',
        'Pectoral, deltoides anterior, tríceps',
        'Escápulas juntas y abajo. Pies firmes. Agarre estable; muñecas alineadas.',
        'Empuje horizontal en banco. Baja con control al pecho y empuja hacia arriba sin rebotar.',
        'Escápulas juntas. Codos a ~45°. Pies plantados.',
        'Rebote en el pecho. Codos demasiado abiertos. Arco lumbar excesivo.',
        '2-1-1-0'
      ),
      (
        'Dominadas',
        'Tirones',
        'espalda',
        'peso_corporal',
        'avanzado',
        'Dorsal, bíceps, core',
        'Agarre prono un poco más ancho que hombros. Hombros abajo desde el inicio.',
        'Tracción vertical. Lleva el pecho hacia la barra sin balanceo.',
        'Hombros abajo. Pecho a la barra. Piernas quietas.',
        'Balanceo de cadera. Encogerse de hombros. Bajar a plomo.',
        '2-1-2-0'
      ),
      (
        'Remo con mancuerna',
        'Tirones',
        'espalda',
        'mancuernas',
        'principiante',
        'Dorsal, romboides, bíceps',
        'Una rodilla y mano en banco. Columna neutra. Mancuerna cuelga bajo el hombro.',
        'Tracción unilateral. Codo cerca del cuerpo hasta la cadera.',
        'Codo cerca. No rotar el tronco. Pausa arriba.',
        'Girar el tronco. Encoger trapecio. Tirar solo de bíceps.',
        '2-1-1-0'
      ),
      (
        'Press militar',
        'Empujes',
        'hombros',
        'barra',
        'intermedio',
        'Deltoides, tríceps, core',
        'De pie o sentado. Costillas abajo. Barra a la altura de clavícula.',
        'Empuje vertical. Bloquea arriba sin hiperextender lumbar.',
        'Costillas abajo. Cabeza ligeramente atrás al pasar la barra.',
        'Arqueo lumbar. Empujar solo con brazos. Mirar al suelo.',
        '2-0-1-0'
      ),
      (
        'Plancha',
        'Core',
        'core',
        'peso_corporal',
        'principiante',
        'Transverso, recto abdominal, glúteo',
        'Antebrazos y puntas de pies. Línea de hombros a talones.',
        'Isométrico de core. Mantén pelvis neutra sin hundir lumbar.',
        'Pelvis neutra. Glúteo activo. Respiración corta y controlada.',
        'Cadera caída. Cadera demasiado alta. Contener la respiración.',
        NULL
      ),
      (
        'Swing con kettlebell',
        'Acondicionamiento',
        'cuerpo_completo',
        'kettlebell',
        'intermedio',
        'Glúteo, isquios, core',
        'Campana a dos manos. Rodillas semiflexionadas. Activa el tronco antes del primer swing.',
        'Bisagra explosiva. La potencia sale de la cadera, no de los brazos.',
        'Empuja la campana, no la eleves. Cadera atrás y adelante.',
        'Sentadilla en vez de bisagra. Encoger hombros. Lumbar redondeada.',
        '1-0-X-0'
      ),
      (
        'Hip thrust',
        'Posterior',
        'piernas',
        'barra',
        'intermedio',
        'Glúteo mayor, isquios',
        'Espalda alta en banco. Barra sobre cadera con protección. Mentón metido.',
        'Extensión de cadera. Aprieta glúteo arriba 1 segundo.',
        'Costillas abajo. Empuja talones. No hiperextender lumbar arriba.',
        'Empujar con lumbar. Mentón al techo. Rodillas que se abren sin control.',
        '2-1-1-0'
      ),
      (
        'Zancada caminando',
        'Piernas',
        'piernas',
        'mancuernas',
        'principiante',
        'Cuádriceps, glúteo',
        'Mancuernas a los lados. Paso largo y estable. Tronco erguido.',
        'Alterna piernas en línea. Baja la rodilla trasera con control.',
        'Rodilla delantera sobre el tobillo. Empuja el suelo para avanzar.',
        'Paso demasiado corto. Tronco adelantado. Rodilla que se va dentro.',
        '2-0-1-0'
      ),
      (
        'Press inclinado mancuernas',
        'Empujes',
        'pecho',
        'mancuernas',
        'intermedio',
        'Pectoral superior, deltoides anterior, tríceps',
        'Banco a 30–45°. Escápulas apoyadas. Pies firmes.',
        'Empuje en diagonal. Baja hasta estirar sin dolor de hombro.',
        'Muñecas neutras. Codos controlados. No chocar mancuernas arriba.',
        'Banco demasiado inclinado. Abrir codos a 90°. Arquear cuello.',
        '3-1-1-0'
      ),
      (
        'Jalón al pecho',
        'Tirones',
        'espalda',
        'maquina',
        'principiante',
        'Dorsal, bíceps',
        'Agarre prono ancho. Siéntate con muslos bajo los rodillos. Pecho alto.',
        'Tira la barra al pecho alto. Controla la subida.',
        'Hombros abajo. Pecho hacia la barra. No balancear el tronco.',
        'Tirar detrás de la nuca. Encoger trapecio. Usar impulso de tronco.',
        '2-1-2-0'
      ),
      (
        'Peso muerto convencional',
        'Posterior',
        'piernas',
        'barra',
        'avanzado',
        'Cadena posterior completa, agarre, core',
        'Barra sobre mediopié. Cadera entre rodillas y hombros. Activa el tronco con fuerza.',
        'Levanta el suelo empujando. Bloquea cadera y rodillas arriba sin hiperextender.',
        'Barra cerca. Empuja el suelo. Espalda neutra todo el recorrido.',
        'Redondear lumbar. Tirar solo de espalda. Barra lejos de las piernas.',
        '2-1-1-0'
      ),
      (
        'Face pull',
        'Hombros',
        'hombros',
        'banda',
        'principiante',
        'Deltoides posterior, romboides, manguito',
        'Banda o cable a la altura de la cara. Agarre neutro.',
        'Tira hacia la cara separando manos. Rotación externa al final.',
        'Codos altos. Escápulas juntas. Sin arquear lumbar.',
        'Tirar solo de trapecio. Abrir demasiado abajo. Usar demasiado peso.',
        '2-1-2-0'
      ),
      (
        'Curl de bíceps mancuernas',
        'Brazos',
        'brazos',
        'mancuernas',
        'principiante',
        'Bíceps braquial',
        'De pie. Codos pegados al costado. Muñecas neutras.',
        'Flexión de codo sin balanceo. Baja en 2–3 segundos.',
        'Codos fijos. Sin inclinarte hacia delante. Control excéntrico.',
        'Balancear el tronco. Abrir codos. Subir con impulso.',
        '2-0-3-0'
      ),
      (
        'Fondos en paralelas asistidos',
        'Empujes',
        'pecho',
        'maquina',
        'intermedio',
        'Pectoral inferior, tríceps, deltoides anterior',
        'Agarre neutro. Hombros abajo. Ligera inclinación adelante si priorizas pecho.',
        'Baja hasta ~90° de codo o el rango cómodo de hombro. Empuja arriba.',
        'Hombros lejos de las orejas. Core firme. Sin rebotar abajo.',
        'Hombros encogidos. Bajar demasiado con dolor. Balanceo de piernas.',
        '2-1-1-0'
      ),
      (
        'Dead bug',
        'Core',
        'core',
        'peso_corporal',
        'principiante',
        'Transverso, control lumbopélvico',
        'Boca arriba. Rodillas a 90°. Brazos al techo. Lumbar pegada al suelo.',
        'Extiende brazo y pierna opuesta sin despegar lumbar. Alterna.',
        'Exhala al extender. Mantén costillas abajo.',
        'Arquear lumbar. Contener la respiración. Mover demasiado rápido.',
        NULL
      ),
      (
        'Movilidad de cadera 90/90',
        'Movilidad',
        'piernas',
        'peso_corporal',
        'principiante',
        'Cadera, rotadores',
        'Sentado en 90/90. Tronco alto. Apoya manos si hace falta.',
        'Mantén o cambia de lado con control. Respira hacia la cadera tensa.',
        'No forzar con dolor agudo. Mantén pelvis nivelada.',
        'Redondear espalda. Empujar rodilla con agresividad. Contener aire.',
        NULL
      ),
      (
        'Farmer carry',
        'Acondicionamiento',
        'cuerpo_completo',
        'mancuernas',
        'intermedio',
        'Agarre, core, trapecio, marcha',
        'Mancuernas o kettlebells a los lados. Hombros abajo. Mirada al frente.',
        'Camina con pasos cortos y estables. No balancear el peso.',
        'Costillas abajo. Pasos silenciosos. Agarre fuerte sin encogerte.',
        'Inclinarse a un lado. Arrastrar los pies. Encoger trapecio.',
        NULL
      ),
      (
        'Remo en máquina sentado',
        'Tirones',
        'espalda',
        'maquina',
        'principiante',
        'Dorsal, romboides, bíceps',
        'Pies en la plataforma. Rodillas semiflexionadas. Pecho alto. Agarre neutro o prono.',
        'Tira el agarre al abdomen. Escápulas juntas. Vuelve con control.',
        'No redondear lumbar. Pausa 1 s en contracción.',
        'Balancear el tronco. Encogerse. Usar solo brazos.',
        '2-1-2-0'
      ),
      (
        'Elevaciones laterales',
        'Hombros',
        'hombros',
        'mancuernas',
        'principiante',
        'Deltoides medio',
        'De pie. Rodillas semiflexionadas. Mancuernas al lado del cuerpo.',
        'Eleva a la altura del hombro con ligera flexión de codo. Baja lento.',
        'No subir por encima del hombro. Sin trapecio dominante.',
        'Impulso de tronco. Codos rígidos. Subir demasiado peso.',
        '2-0-3-0'
      ),
      (
        'Press francés',
        'Brazos',
        'brazos',
        'mancuernas',
        'intermedio',
        'Tríceps',
        'Boca arriba en banco. Mancuerna o barra. Codos apuntando al techo.',
        'Flexiona solo el codo bajando el peso hacia la frente/cabeza. Extiende.',
        'Codos fijos. Muñecas neutras. Rango sin dolor de codo.',
        'Abrir codos a los lados. Mover hombros. Cargar de más.',
        '3-0-1-0'
      ),
      (
        'Burpee controlado',
        'Acondicionamiento',
        'cuerpo_completo',
        'peso_corporal',
        'intermedio',
        'Condición general',
        'Espacio libre. Aterrizaje suave. Core activo en el suelo.',
        'Baja a plancha, pecho opcional al suelo, vuelve a pie y salta suave.',
        'No rebotar lumbar. Aterriza suave. Respira en cada rep.',
        'Hundir lumbar en plancha. Saltar con rodillas rígidas. Perder ritmo.',
        NULL
      ),
      (
        'Puente de glúteo a una pierna',
        'Posterior',
        'piernas',
        'peso_corporal',
        'intermedio',
        'Glúteo, isquios, estabilidad pélvica',
        'Boca arriba. Una pierna flexionada, la otra extendida. Brazos al suelo.',
        'Empuja el talón y eleva cadera. Mantén pelvis nivelada.',
        'Costillas abajo. No rotar la cadera. Baja con control.',
        'Empujar con lumbar. Pelvis torcida. Mentón al techo.',
        '2-1-2-0'
      ),
      (
        'Cat-cow + respiración',
        'Movilidad',
        'core',
        'peso_corporal',
        'principiante',
        'Columna, respiración diafragmática',
        'Cuadrupedia. Muñecas bajo hombros. Rodillas bajo cadera.',
        'Alterna flexión y extensión suave de columna coordinada con la respiración.',
        'Movimiento lento. Sin forzar cervical. Nariz–boca o nasal.',
        'Empujar de golpe. Contener aire. Hiperextender cuello.',
        NULL
      )
  ) AS v(
    name, category_name, muscle_group, equipment, difficulty, primary_muscles,
    setup, description, cues, mistakes, tempo
  )
)
INSERT INTO exercises (
  name, description, muscle_group, equipment, cues, video_url,
  category_id, difficulty, primary_muscles, setup, mistakes, tempo
)
SELECT
  seed.name,
  seed.description,
  seed.muscle_group,
  seed.equipment,
  seed.cues,
  NULL,
  cat.id,
  seed.difficulty,
  seed.primary_muscles,
  seed.setup,
  seed.mistakes,
  seed.tempo
FROM seed
JOIN cat ON cat.name = seed.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = seed.name
);

-- Completar fichas antiguas del seed inicial si aún no tienen detalle.
UPDATE exercises
SET
  difficulty = COALESCE(difficulty, 'intermedio'),
  primary_muscles = COALESCE(
    NULLIF(primary_muscles, 'Grupo principal según categoría'),
    CASE muscle_group
      WHEN 'pecho' THEN 'Pectoral, deltoides anterior, tríceps'
      WHEN 'espalda' THEN 'Dorsal, romboides, bíceps'
      WHEN 'piernas' THEN 'Cuádriceps, glúteo, isquiosurales'
      WHEN 'hombros' THEN 'Deltoides, tríceps'
      WHEN 'brazos' THEN 'Bíceps, tríceps'
      WHEN 'core' THEN 'Recto abdominal, oblicuos, estabilizadores'
      WHEN 'cardio' THEN 'Sistema cardiovascular'
      ELSE 'Cuerpo completo'
    END
  ),
  setup = COALESCE(setup, 'Colócate con control. Activa el tronco antes de la primera repetición.'),
  mistakes = COALESCE(mistakes, 'Perder la postura. Usar impulso. Acortar el rango.'),
  tempo = COALESCE(tempo, '2-0-1-0')
WHERE is_active = true
  AND (
    difficulty IS NULL
    OR primary_muscles IS NULL
    OR primary_muscles = 'Grupo principal según categoría'
    OR setup IS NULL
    OR mistakes IS NULL
  );

-- Sacar de Movilidad las fichas de fuerza mal clasificadas.
UPDATE exercises e
SET category_id = c.id
FROM exercise_categories bad, exercise_categories c
WHERE e.is_active = true
  AND e.category_id = bad.id
  AND bad.name = 'Movilidad'
  AND c.is_active = true
  AND c.name = CASE e.muscle_group
    WHEN 'pecho' THEN 'Empujes'
    WHEN 'espalda' THEN 'Tirones'
    WHEN 'piernas' THEN 'Piernas'
    WHEN 'hombros' THEN 'Empujes'
    WHEN 'brazos' THEN 'Brazos'
    WHEN 'core' THEN 'Core'
    WHEN 'cardio' THEN 'Acondicionamiento'
    ELSE 'Cuerpo completo'
  END;

-- Fallback si Empujes/Tirones no existen: categorías base.
UPDATE exercises e
SET category_id = c.id
FROM exercise_categories bad, exercise_categories c
WHERE e.is_active = true
  AND e.category_id = bad.id
  AND bad.name = 'Movilidad'
  AND c.is_active = true
  AND c.name = CASE e.muscle_group
    WHEN 'pecho' THEN 'Pecho'
    WHEN 'espalda' THEN 'Espalda'
    WHEN 'hombros' THEN 'Hombros'
    WHEN 'cardio' THEN 'Cardio'
    ELSE 'Cuerpo completo'
  END;

UPDATE exercises e
SET category_id = c.id
FROM exercise_categories c
WHERE e.is_active = true
  AND e.name = 'Press banca'
  AND c.name = 'Empujes'
  AND c.is_active = true;

-- Desactivar duplicados por nombre (conserva la ficha más completa / reciente).
UPDATE exercises e
SET is_active = false
WHERE e.is_active = true
  AND e.id NOT IN (
    SELECT DISTINCT ON (lower(name)) id
    FROM exercises
    WHERE is_active = true
    ORDER BY lower(name),
      (primary_muscles IS NOT NULL AND primary_muscles <> 'Grupo principal según categoría') DESC,
      updated_at DESC NULLS LAST,
      created_at DESC
  );

UPDATE exercises
SET
  cues = replace(cues, 'Codillos', 'Codos'),
  setup = replace(setup, 'Codillos', 'Codos'),
  mistakes = replace(mistakes, 'Codillos', 'Codos'),
  description = replace(description, 'Codillos', 'Codos')
WHERE cues ILIKE '%Codillos%'
   OR setup ILIKE '%Codillos%'
   OR mistakes ILIKE '%Codillos%'
   OR description ILIKE '%Codillos%';

-- No publicar testimonios demo en la web pública.
UPDATE testimonials
SET is_published = false
WHERE author_name IN ('Cliente de ejemplo', 'Laura G.', 'Miguel R.', 'Sofía V.', 'Andrés P.');


-- Limpieza editorial de fichas (ES)
UPDATE exercises SET
  setup = replace(replace(replace(replace(replace(coalesce(setup,''), 'Brace el tronco', 'Activa el tronco'), 'Soft knees', 'Rodillas semiflexionadas'), 'Brace antes', 'Activa el tronco antes'), 'Brace fuerte', 'Activa el tronco con fuerza'), 'Soft landing', 'Aterrizaje suave'),
  cues = replace(replace(replace(replace(replace(replace(coalesce(cues,''), 'Brace el tronco', 'Activa el tronco'), 'Soft knees', 'Rodillas semiflexionadas'), 'Brace antes', 'Activa el tronco antes'), 'Brace fuerte', 'Activa el tronco con fuerza'), 'No forward lean', 'Sin inclinarte hacia delante'), 'Soft landing', 'Aterrizaje suave'),
  mistakes = replace(replace(replace(replace(coalesce(mistakes,''), 'Brace', 'Activa el tronco'), 'Soft knees', 'Rodillas semiflexionadas'), 'forward lean', 'inclinarte hacia delante'), 'Soft landing', 'Aterrizaje suave'),
  description = replace(replace(replace(coalesce(description,''), 'Soft knees', 'Rodillas semiflexionadas'), 'Brace', 'Activa el tronco'), 'Soft landing', 'Aterrizaje suave')
WHERE setup ILIKE '%brace%' OR setup ILIKE '%soft %'
   OR cues ILIKE '%brace%' OR cues ILIKE '%soft %' OR cues ILIKE '%forward lean%'
   OR mistakes ILIKE '%brace%' OR mistakes ILIKE '%soft %' OR mistakes ILIKE '%forward%'
   OR description ILIKE '%brace%' OR description ILIKE '%soft %';

UPDATE exercises
SET
  primary_muscles = 'Pectoral inferior, tríceps, deltoides anterior',
  setup = 'Agarre neutro. Hombros abajo. Ligera inclinación adelante si priorizas pecho.',
  description = 'Baja hasta unos 90° de codo o el rango cómodo de hombro. Empuja arriba sin balanceo.',
  cues = 'Hombros lejos de las orejas. Core firme. Sin rebotar abajo.',
  mistakes = 'Hombros encogidos. Bajar demasiado con dolor. Balanceo de piernas.',
  tempo = COALESCE(tempo, '2-1-1-0')
WHERE name = 'Fondos en paralelas asistidos' AND is_active = true;
