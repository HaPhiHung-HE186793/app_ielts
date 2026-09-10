import { readNeonConfig } from './config.ts'
import { createNeonPool, NeonDatabase } from './database.ts'
import { neonIdentity } from './identity.ts'
import { createNeonServer } from './http.ts'
import { databaseStartupMessage } from './startup-error.ts'

async function main() {
  const config = readNeonConfig(process.env)
  const pool = createNeonPool(config.databaseUrl)
  try {
    const db = new NeonDatabase(pool)
    await db.ready()
    const server = createNeonServer({
      db,
      authUrl: config.authUrl,
      origins: config.origins,
      verify: neonIdentity(config.authUrl),
    })
    server.listen(config.port, '0.0.0.0', () => console.log('Neon backend ready; AI disabled.'))
    let stopping = false
    const stop = () => {
      if (stopping) return
      stopping = true
      server.closeAllConnections()
      server.close(() => {
        void pool.end()
      })
    }
    process.on('SIGTERM', stop)
    process.on('SIGINT', stop)
    server.on('error', () => {
      console.error('Không mở được cổng API.')
      stop()
      process.exitCode = 1
    })
  } catch (error) {
    await pool.end().catch(() => {})
    console.error(databaseStartupMessage(error))
    process.exitCode = 1
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Backend chưa khởi động được.')
  process.exitCode = 1
})
