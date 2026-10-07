export type Service = {
  id: string
  name: string
  slug: string
  modality: 'presencial' | 'online' | 'hibrido'
  description: string | null
  durationMinutes: number | null
  priceCents: number | null
  currency: string
}

export type Testimonial = {
  id: string
  authorName: string
  quote: string
}

export type Trainer = {
  id: string
  displayName: string
  slug: string
  bio: string | null
  city: string | null
  personName: string | null
  photoUrl: string | null
  tagline: string | null
  story: string | null
  credentials: string[]
}

export type SiteData = {
  trainer: Trainer
  services: Service[]
  testimonials: Testimonial[]
}

export type UserRole = 'admin' | 'client'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: UserRole
}
