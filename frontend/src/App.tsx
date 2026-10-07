import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireRole } from './components/RequireRole'
import { AccountPage } from './pages/AccountPage'
import { AdminLibraryPage } from './pages/AdminLibraryPage'
import { AdminPage } from './pages/AdminPage'
import { AdminShell } from './pages/AdminShell'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { LegalPage, PrivacyPage } from './pages/LegalPages'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResultsPage } from './pages/ResultsPage'
import { ServicesPage } from './pages/ServicesPage'
import { TrainerPage } from './pages/TrainerPage'

const router = createBrowserRouter([
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
])

export default function App() {
  return <RouterProvider router={router} />
}
