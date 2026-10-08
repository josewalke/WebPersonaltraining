export type DoseUnit = 'repetitions' | 'seconds' | 'minutes' | 'meters'
export const DOSE_UNITS: { value: DoseUnit; label: string }[] = [
  { value: 'repetitions', label: 'Repeticiones' },
  { value: 'seconds', label: 'Segundos' },
  { value: 'minutes', label: 'Minutos' },
  { value: 'meters', label: 'Metros' },
]

export function doseMetric(value: string | null, unit: DoseUnit = 'repetitions') {
  const label = unit === 'repetitions' ? 'Repeticiones' : unit === 'meters' ? 'Distancia' : 'Duración'
  const suffix = { repetitions: '', seconds: ' s', minutes: ' min', meters: ' m' }[unit]
  return { label, value: value ? (/^[\d.,\s–-]+$/.test(value) ? value + suffix : value) : '—' }
}
