import pg from 'pg'

export const pool = new pg.Pool()

export async function getSiteByTrainerSlug(slug) {
  const trainerResult = await pool.query(
    `SELECT id, display_name, slug, bio, city,
            person_name, photo_url, tagline, story, credentials
     FROM trainers
     WHERE slug = $1
     LIMIT 1`,
    [slug],
  )
  const trainer = trainerResult.rows[0]
  if (!trainer) {
    return null
  }

  const [servicesResult, testimonialsResult] = await Promise.all([
    pool.query(
      `SELECT id, name, slug, modality, description, duration_minutes, price_cents, currency
       FROM services
       WHERE trainer_id = $1 AND is_active = true
       ORDER BY slug`,
      [trainer.id],
    ),
    pool.query(
      `SELECT id, author_name, quote
       FROM testimonials
       WHERE trainer_id = $1 AND is_published = true
       ORDER BY created_at DESC`,
      [trainer.id],
    ),
  ])

  return {
    trainer: {
      id: trainer.id,
      displayName: trainer.display_name,
      slug: trainer.slug,
      bio: trainer.bio,
      city: trainer.city,
      personName: trainer.person_name,
      photoUrl: trainer.photo_url,
      tagline: trainer.tagline,
      story: trainer.story,
      credentials: Array.isArray(trainer.credentials) ? trainer.credentials : [],
    },
    services: servicesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      modality: row.modality,
      description: row.description,
      durationMinutes: row.duration_minutes,
      priceCents: row.price_cents,
      currency: row.currency,
    })),
    testimonials: testimonialsResult.rows.map((row) => ({
      id: row.id,
      authorName: row.author_name,
      quote: row.quote,
    })),
  }
}

export async function insertLead({
  trainerId,
  fullName,
  email,
  phone,
  preferredModality,
  message,
}) {
  const result = await pool.query(
    `INSERT INTO leads (
       trainer_id, full_name, email, phone, preferred_modality, message, privacy_accepted_at
     ) VALUES ($1, $2, $3, $4, $5, $6, now())
     RETURNING id`,
    [trainerId, fullName, email, phone, preferredModality, message],
  )
  return result.rows[0].id
}
