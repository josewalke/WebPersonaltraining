import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SiteProvider } from './site-context.tsx'
import { AuthProvider } from './auth-context.tsx'
import { bindPanelScrollTint } from './panel-scroll-tint.ts'

const root = document.getElementById('root')
if (!root) {
  throw new Error('No se encontró #root')
}

bindPanelScrollTint()

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <SiteProvider>
        <App />
      </SiteProvider>
    </AuthProvider>
  </StrictMode>,
)
