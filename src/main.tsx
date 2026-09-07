import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { initializeInstallation } from './app/installation'
import { initializeAuth } from './app/auth'
import { initializeSync } from './app/sync'
import { initializeOffline } from './app/offline'
import { initializeReminders } from './features/reminders/service'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/vietnamese-400.css'
import '@fontsource/lora/latin-400-italic.css'
import '@fontsource/lora/vietnamese-400-italic.css'
import './styles/index.css'

initializeInstallation()
initializeAuth()
initializeSync()
void initializeOffline()
initializeReminders()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
