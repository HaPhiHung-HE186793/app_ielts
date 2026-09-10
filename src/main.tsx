import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { initializeInstallation } from './app/installation'
import { initializeAuth } from './app/auth'
import { initializeSync } from './app/sync'
import { initializeOffline } from './app/offline'
import { initializeReminders } from './features/reminders/service'
import { initSentry, Sentry } from './services/sentry'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/vietnamese-400.css'
import '@fontsource/lora/latin-400-italic.css'
import '@fontsource/lora/vietnamese-400-italic.css'
import './styles/index.css'

// Khởi tạo Sentry đầu tiên để catch mọi lỗi ngay từ đầu
initSentry()
initializeInstallation()
initializeAuth()
initializeSync()
void initializeOffline()
initializeReminders()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <main style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Có lỗi xảy ra</h1>
          <p>Ứng dụng gặp lỗi không mong đợi. Tiến độ học của bạn đã được lưu.</p>
          <button onClick={resetError} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
            Thử lại
          </button>
          {import.meta.env.DEV && (
            <pre style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.75rem', overflow: 'auto' }}>
              {String(error)}
            </pre>
          )}
        </main>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
