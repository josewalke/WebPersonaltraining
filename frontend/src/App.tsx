import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireRole } from './components/RequireRole'
const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })))
const AdminLibraryPage = lazy(() => import('./pages/AdminLibraryPage').then((module) => ({ default: module.AdminLibraryPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))
const AdminShell = lazy(() => import('./pages/AdminShell').then((module) => ({ default: module.AdminShell })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })))
import { HomePage } from './pages/HomePage'
const LegalPage = lazy(() => import('./pages/LegalPages').then((module) => ({ default: module.LegalPage })))
const PrivacyPage = lazy(() => import('./pages/LegalPages').then((module) => ({ default: module.PrivacyPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const ResultsPage = lazy(() => import('./pages/ResultsPage').then((module) => ({ default: module.ResultsPage })))
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((module) => ({ default: module.ServicesPage })))
const TrainerPage = lazy(() => import('./pages/TrainerPage').then((module) => ({ default: module.TrainerPage })))

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/entrenador', element: <TrainerPage /> },
        { path: '/servicios', element: <ServicesPage /> },
        { path: '/resultados', element: <ResultsPage /> },
        { path: '/contacto', element: <ContactPage /> },
        { path: '/acceso', element: <LoginPage /> },
        {
          path: '/admin',
          element: (
            <RequireRole role="admin">
              <AdminShell />
            </RequireRole>
          ),
          children: [
            { index: true, element: <AdminPage /> },
            { path: 'ejercicios', element: <AdminLibraryPage /> },
          ],
        },
        {
          path: '/cuenta',
          element: (
            <RequireRole role="client">
              <AccountPage />
            </RequireRole>
          ),
        },
        { path: '/aviso-legal', element: <LegalPage /> },
        { path: '/privacidad', element: <PrivacyPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
)

export default function App() {
  return <Suspense fallback={<main className="page-shell pt-32 pb-24" role="status">Cargando página…</main>}><RouterProvider router={router} /></Suspense>
}
