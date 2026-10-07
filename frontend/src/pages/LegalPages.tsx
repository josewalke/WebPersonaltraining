import { Link } from 'react-router-dom'
import { Reveal } from '../components/Reveal'

export function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <Reveal>
        <h1 className="font-display text-4xl sm:text-5xl">Aviso legal</h1>
        <p className="mt-6 text-sm text-ink-soft sm:text-base">
          Power Up ofrece información sobre entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y
          online, y recoge solicitudes de plaza a través de este sitio. El contenido no sustituye consejo
          médico ni diagnóstico profesional.
        </p>
        <p className="mt-4 text-sm text-ink-soft sm:text-base">
          Datos identificativos del responsable (nombre completo o razón social, NIF/CIF y domicilio) se
          completarán antes de la publicación definitiva. Hasta entonces, para cualquier consulta legal o
          comercial usa el{' '}
          <Link to="/contacto" className="text-ember underline-offset-4 hover:underline">
            formulario de contacto
          </Link>
          .
        </p>
      </Reveal>
    </main>
  )
}

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <Reveal>
        <h1 className="font-display text-4xl sm:text-5xl">Privacidad</h1>
        <p className="mt-6 text-sm text-ink-soft sm:text-base">
          Cuando envías una solicitud de plaza, Power Up trata los datos que indiques (nombre, email,
          teléfono opcional, modalidad preferida y mensaje) para responderte y valorar tu plaza. El
          estudio opera en Las Palmas de Gran Canaria y también online.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-soft sm:text-base">
          <li>Base legal: tu consentimiento al marcar la casilla y enviar el formulario.</li>
          <li>
            Las cuentas de administrador y cliente las crea el estudio; el acceso usa sesión y no se
            comparte con terceros ajenos al servicio.
          </li>
          <li>
            Puedes pedir acceso, rectificación o supresión escribiendo por el{' '}
            <Link to="/contacto" className="text-ember underline-offset-4 hover:underline">
              formulario de contacto
            </Link>
            . Completaremos el correo y domicilio del responsable antes de publicar en producción.
          </li>
          <li>No usamos tus datos de contacto para publicidad de terceros.</li>
        </ul>
      </Reveal>
    </main>
  )
}
