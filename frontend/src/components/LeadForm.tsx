import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, CircleNotch } from '@phosphor-icons/react'
import { api, ApiError } from '../api'
import { useSite } from '../use-site'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MODALITIES = [
  { value: 'presencial', label: 'Presencial (Las Palmas)' },
  { value: 'online', label: 'Online' },
  { value: 'indiferente', label: 'Me da igual' },
] as const

type Status = 'idle' | 'sending' | 'ok' | 'error'
type FieldName = 'fullName' | 'email' | 'phone' | 'preferredModality' | 'message' | 'privacyAccepted'
type FieldErrors = Partial<Record<FieldName, string>>

function validateLead(data: FormData): FieldErrors {
  const errors: FieldErrors = {}
  const fullName = String(data.get('fullName') ?? '').trim()
  const email = String(data.get('email') ?? '').trim().toLowerCase()
  const phone = String(data.get('phone') ?? '').trim()
  const preferredModality = String(data.get('preferredModality') ?? '')
  const message = String(data.get('message') ?? '').trim()
  const privacyAccepted = data.get('privacyAccepted') === 'on'

  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = 'Indica tu nombre (entre 2 y 120 caracteres).'
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    errors.email = 'Indica un email válido.'
  }
  if (phone.length > 40) {
    errors.phone = 'El teléfono es demasiado largo.'
  }
  if (!['presencial', 'online', 'indiferente'].includes(preferredModality)) {
    errors.preferredModality = 'Elige una modalidad.'
  }
  if (message.length > 2000) {
    errors.message = 'El mensaje es demasiado largo.'
  }
  if (!privacyAccepted) {
    errors.privacyAccepted = 'Necesitamos tu consentimiento de privacidad.'
  }
  return errors
}

export function LeadForm() {
  const site = useSite()
  const formId = useId()
  const [searchParams] = useSearchParams()
  const requestedService = searchParams.get('servicio') ?? ''
  const services = site.status === 'ready' ? site.data.services : []
  const serviceAvailable = !requestedService || services.some((service) => service.id === requestedService)
  const defaultModality = useMemo(() => {
    const value = searchParams.get('modalidad') ?? ''
    return MODALITIES.some((item) => item.value === value) ? value : ''
  }, [searchParams])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [chars, setChars] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const successRef = useRef<HTMLDivElement>(null)

  function bumpShake() {
    setShaking(false)
    requestAnimationFrame(() => setShaking(true))
  }

  function syncField(form: HTMLFormElement, name: FieldName, force = false) {
    if (!force && !attempted) {
      return
    }
    const next = validateLead(new FormData(form))
    setFieldErrors((current) => {
      const updated = { ...current }
      if (next[name]) {
        updated[name] = next[name]
      } else {
        delete updated[name]
      }
      return updated
    })
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    const data = new FormData(form)
    setAttempted(true)
    const nextErrors = validateLead(data)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      bumpShake()
      const focusId = nextErrors.fullName
        ? `${formId}-name`
        : nextErrors.email
          ? `${formId}-email`
          : nextErrors.phone
            ? `${formId}-phone`
            : nextErrors.message
              ? `${formId}-message`
              : null
      queueMicrotask(() => {
        if (focusId) {
          document.getElementById(focusId)?.focus()
        }
      })
      return
    }

    const payload = {
      serviceId: String(data.get('serviceId') ?? '') || null,
      fullName: String(data.get('fullName') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      preferredModality: String(data.get('preferredModality') ?? ''),
      message: String(data.get('message') ?? ''),
      privacyAccepted: data.get('privacyAccepted') === 'on',
    }

    setStatus('sending')
    try {
      await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setStatus('ok')
      form.reset()
      setChars(0)
      queueMicrotask(() => successRef.current?.focus())
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : 'No hay conexión con el servidor. Inténtalo de nuevo.')
      bumpShake()
    }
  }

  if (status === 'ok') {
    return (
      <div className="grid gap-4">
        <div
          ref={successRef}
          tabIndex={-1}
          className="pop-in rounded-[1.5rem] brand-fill p-8 text-ink outline-none"
          role="status"
        >
          <CheckCircle weight="fill" className="size-8" aria-hidden />
          <p className="mt-4 font-display text-3xl">Solicitud enviada</p>
          <p className="mt-2 text-ink/80">
            Tu solicitud está registrada en el estudio. El acceso de
            cliente lo crea el estudio después; no se genera solo al pedir plaza.
          </p>
        </div>
        <button
          type="button"
          className="tap justify-self-start text-sm text-ember underline-offset-4 hover:underline"
          onClick={() => {
            setStatus('idle')
            setFieldErrors({})
            setError(null)
            setAttempted(false)
          }}
        >
          Enviar otra solicitud
        </button>
      </div>
    )
  }

  const inputClass = (invalid?: boolean) =>
    [
      'w-full rounded-2xl border-0 bg-ink px-4 py-3 text-paper ring-1 transition duration-300 ease-soft',
      invalid ? 'ring-ember' : 'ring-white/15 focus-visible:ring-2 focus-visible:ring-ember',
    ].join(' ')

  return (
    <form
      className={`grid gap-5 ${shaking ? 'form-shake' : ''}`}
      onAnimationEnd={() => setShaking(false)}
      onSubmit={onSubmit}
      noValidate
      aria-busy={status === 'sending'}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id={`${formId}-name`}
          name="fullName"
          label="Nombre"
          autoComplete="name"
          required
          error={fieldErrors.fullName}
          className={inputClass(Boolean(fieldErrors.fullName))}
          onLiveChange={syncField}
        />
        <Field
          id={`${formId}-email`}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={fieldErrors.email}
          className={inputClass(Boolean(fieldErrors.email))}
          onLiveChange={syncField}
        />
      </div>
      <Field
        id={`${formId}-phone`}
        name="phone"
        label="Teléfono (opcional)"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        error={fieldErrors.phone}
        className={inputClass(Boolean(fieldErrors.phone))}
        onLiveChange={syncField}
      />
      <div>
        <label htmlFor={`${formId}-service`} className="mb-2 block text-sm">Servicio que te interesa</label>
        <select
          key={requestedService + site.status}
          id={`${formId}-service`}
          name="serviceId"
          defaultValue={serviceAvailable ? requestedService : ''}
          className={inputClass()}
          disabled={site.status === 'loading'}
        >
          <option value="">Quiero orientación para elegir</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
        {requestedService && !serviceAvailable && site.status === 'ready' ? (
          <p className="mt-2 text-sm text-ember" role="status">El servicio del enlace ya no está disponible. Puedes elegir otro.</p>
        ) : null}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm">Modalidad</legend>
        <div className="flex flex-wrap gap-3">
          {MODALITIES.map((option, index) => (
            <label
              key={option.value}
              className="tap inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2 ring-1 ring-white/10 transition has-[:checked]:bg-white/5 has-[:checked]:ring-ember"
            >
              <input
                type="radio"
                name="preferredModality"
                value={option.value}
                defaultChecked={defaultModality ? option.value === defaultModality : index === 2}
                aria-invalid={Boolean(fieldErrors.preferredModality)}
                className="accent-ember"
                onChange={(event) => syncField(event.currentTarget.form!, 'preferredModality')}
              />
              {option.label}
            </label>
          ))}
        </div>
        {fieldErrors.preferredModality ? (
          <p className="mt-2 text-sm text-ember" role="alert">
            {fieldErrors.preferredModality}
          </p>
        ) : null}
      </fieldset>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor={`${formId}-message`} className="block text-sm">
            Cuéntame un poco <span className="text-ink-soft">(opcional)</span>
          </label>
          <span className="text-xs text-ink-soft tabular-nums">{chars}/2000</span>
        </div>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={4}
          maxLength={2000}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? `${formId}-message-error` : undefined}
          className={inputClass(Boolean(fieldErrors.message))}
          onChange={(event) => {
            setChars(event.currentTarget.value.length)
            if (event.currentTarget.form) {
              syncField(event.currentTarget.form, 'message')
            }
          }}
        />
        {fieldErrors.message ? (
          <p id={`${formId}-message-error`} className="mt-2 text-sm text-ember" role="alert">
            {fieldErrors.message}
          </p>
        ) : null}
      </div>
      <div className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          id={`${formId}-privacy`}
          type="checkbox"
          name="privacyAccepted"
          aria-invalid={Boolean(fieldErrors.privacyAccepted)}
          className="mt-1 size-4 shrink-0 accent-ember"
          onChange={(event) => {
            if (event.currentTarget.form) {
              syncField(event.currentTarget.form, 'privacyAccepted')
            }
          }}
        />
        <p>
          <label htmlFor={`${formId}-privacy`} className="cursor-pointer">
            Acepto el tratamiento de mis datos para responder a esta solicitud, según la{' '}
          </label>
          <Link
            className="underline underline-offset-4 hover:text-ember"
            to="/privacidad"
            onClick={(event) => event.stopPropagation()}
          >
            política de privacidad
          </Link>
          .
        </p>
      </div>
      {fieldErrors.privacyAccepted ? (
        <p className="text-sm text-ember" role="alert">
          {fieldErrors.privacyAccepted}
        </p>
      ) : null}
      {error ? (
        <p className="text-ember" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="tap inline-flex min-h-12 items-center gap-2 rounded-full brand-fill px-8 py-3 font-medium text-ink disabled:opacity-60"
      >
        {status === 'sending' ? (
          <>
            <CircleNotch className="size-4 animate-spin" aria-hidden />
            Enviando…
          </>
        ) : (
          'Enviar solicitud'
        )}
      </button>
    </form>
  )
}

function Field({
  id,
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  inputMode,
  error,
  className,
  onLiveChange,
}: {
  id: string
  name: FieldName
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'tel' | 'email' | 'text'
  error?: string
  className: string
  onLiveChange: (form: HTMLFormElement, name: FieldName, force?: boolean) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm">
        {label}
        {required ? <span className="sr-only"> (obligatorio)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={className}
        onBlur={(event) => {
          if (event.currentTarget.form && event.currentTarget.value.trim()) {
            onLiveChange(event.currentTarget.form, name, true)
          }
        }}
        onChange={(event) => {
          if (event.currentTarget.form) {
            onLiveChange(event.currentTarget.form, name)
          }
        }}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
