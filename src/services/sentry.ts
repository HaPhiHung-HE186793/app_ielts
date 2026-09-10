/**
 * Sentry frontend error tracking.
 *
 * Chỉ khởi tạo khi VITE_SENTRY_DSN được cấu hình trong môi trường production.
 * Không log nội dung bài học, email, OTP hay bất kỳ PII nào.
 */
import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return // Chỉ bật khi có DSN — local dev không cần

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE ?? 'production',
    // Chỉ gửi 10% transactions để tiết kiệm quota
    tracesSampleRate: 0.1,
    // Không gửi PII mặc định
    sendDefaultPii: false,
    // Scrub trước khi gửi
    beforeSend(event) {
      // Xóa toàn bộ breadcrumbs để tránh leak nội dung bài/học viên
      event.breadcrumbs = undefined
      // Không gửi lỗi mạng bình thường (offline, CORS)
      const msg = event.exception?.values?.[0]?.value ?? ''
      if (msg.includes('NetworkError') || msg.includes('Failed to fetch')) return null
      return event
    },
    // Chặn các domain không liên quan
    allowUrls: [/app-ielts.*\.vercel\.app/, /moingay\.app/, /localhost/],
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  })
}

/**
 * Báo lỗi không mong đợi — ẩn danh, không kèm dữ liệu học viên.
 */
export function reportError(error: unknown, context?: string) {
  Sentry.withScope((scope) => {
    if (context) scope.setTag('context', context)
    Sentry.captureException(error)
  })
}

export { Sentry }
