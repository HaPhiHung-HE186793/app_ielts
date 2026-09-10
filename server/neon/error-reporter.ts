/**
 * Server-side error reporter — gửi lỗi lên Sentry qua HTTP Envelope API.
 *
 * Không dùng @sentry/node SDK để tránh phụ thuộc OpenTelemetry nặng.
 * Chỉ gửi: message, stack trace, environment, release. Không log PII.
 */

interface SentryEvent {
  level: 'error' | 'warning' | 'info'
  message?: string
  exception?: {
    values: Array<{
      type: string
      value: string
      stacktrace?: { frames: Array<{ filename: string; lineno?: number; function?: string }> }
    }>
  }
  tags?: Record<string, string>
  environment: string
  release?: string
  platform: 'node'
}

function parseDsn(dsn: string): { url: string; publicKey: string; projectId: string } | null {
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\//, '')
    const publicKey = u.username
    if (!projectId || !publicKey) return null
    return {
      url: `${u.protocol}//${u.hostname}/api/${projectId}/envelope/`,
      publicKey,
      projectId,
    }
  } catch {
    return null
  }
}

function buildEnvelope(event: SentryEvent, parsed: { publicKey: string }): string {
  const id = crypto.randomUUID().replace(/-/g, '')
  const header = JSON.stringify({
    event_id: id,
    sent_at: new Date().toISOString(),
    sdk: { name: 'sentry.javascript.node.http', version: '1.0.0' },
    dsn: '',
    auth: `Sentry sentry_version=7, sentry_client=sentry.javascript.node.http/1.0.0, sentry_key=${parsed.publicKey}`,
  })
  const itemHeader = JSON.stringify({ type: 'event', length: 0 })
  const body = JSON.stringify({ event_id: id, ...event })
  return `${header}\n${itemHeader}\n${body}\n`
}

export class ServerErrorReporter {
  private dsn: ReturnType<typeof parseDsn>
  private environment: string

  constructor(env: Record<string, string | undefined>) {
    const raw = env.SENTRY_DSN
    this.dsn = raw ? parseDsn(raw) : null
    this.environment = env.RENDER_SERVICE_NAME ? 'production' : 'development'
  }

  capture(error: unknown, tags?: Record<string, string>) {
    if (!this.dsn) return // Tắt nếu không có DSN
    const event = this.buildEvent(error, tags)
    this.send(event).catch(() => {}) // fire-and-forget, không làm crash server
  }

  private buildEvent(error: unknown, tags?: Record<string, string>): SentryEvent {
    if (error instanceof Error) {
      const frames = (error.stack ?? '')
        .split('\n')
        .slice(1)
        .map((line) => {
          const match = /at .+ \((.+):(\d+):\d+\)/.exec(line.trim())
          return match
            ? { filename: match[1], lineno: Number(match[2]), function: line.trim().split(' ')[1] }
            : { filename: line.trim() }
        })
      return {
        level: 'error',
        platform: 'node',
        environment: this.environment,
        exception: {
          values: [
            {
              type: error.constructor.name,
              value: error.message,
              stacktrace: { frames },
            },
          ],
        },
        tags,
      }
    }
    return {
      level: 'error',
      platform: 'node',
      environment: this.environment,
      message: String(error),
      tags,
    }
  }

  private async send(event: SentryEvent) {
    if (!this.dsn) return
    const envelope = buildEnvelope(event, this.dsn)
    const res = await fetch(this.dsn.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: envelope,
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.warn(`[Sentry] Gửi lỗi thất bại: ${res.status}`)
  }
}
