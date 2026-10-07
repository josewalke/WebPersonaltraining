/** Días ISO: 1 = lunes … 7 = domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const WEEKDAYS: { value: Weekday; short: string; label: string }[] = [
  { value: 1, short: 'Lun', label: 'Lunes' },
  { value: 2, short: 'Mar', label: 'Martes' },
  { value: 3, short: 'Mié', label: 'Miércoles' },
  { value: 4, short: 'Jue', label: 'Jueves' },
  { value: 5, short: 'Vie', label: 'Viernes' },
  { value: 6, short: 'Sáb', label: 'Sábado' },
  { value: 7, short: 'Dom', label: 'Domingo' },
]

export function todayWeekday(): Weekday {
  const day = new Date().getDay()
  return (day === 0 ? 7 : day) as Weekday
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((item) => item.value === value)?.label ?? 'Día'
}
