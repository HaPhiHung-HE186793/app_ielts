import pg, { type PoolClient } from 'pg'

export type DbRole = 'moi_ngay_api' | 'moi_ngay_worker'
export function createNeonPool(databaseUrl: string) {
  const url = new URL(databaseUrl)
  url.searchParams.delete('sslmode')
  url.searchParams.delete('channel_binding')
  const pool = new pg.Pool({
    connectionString: url.href,
    ssl: { rejectUnauthorized: true },
    enableChannelBinding: true,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  })
  pool.on('error', () => console.error('Kết nối DB nhàn rỗi bị gián đoạn; sẽ thử kết nối lại.'))
  return pool
}
export class NeonDatabase {
  readonly pool: pg.Pool
  constructor(pool: pg.Pool) {
    this.pool = pool
  }
  async transaction<T>(
    role: DbRole,
    owner: string | null,
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect()
    let broken = false
    try {
      await client.query('BEGIN')
      await client.query(
        role === 'moi_ngay_api' ? 'SET LOCAL ROLE moi_ngay_api' : 'SET LOCAL ROLE moi_ngay_worker',
      )
      await client.query("SELECT set_config('moi_ngay.actor', $1, true)", [owner ?? ''])
      if (owner && role === 'moi_ngay_api') await client.query('SELECT moi_ngay.ensure_account()')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch {
        broken = true
      }
      throw error
    } finally {
      client.release(broken)
    }
  }
  async ready() {
    return this.transaction('moi_ngay_api', null, async (client) => {
      const result = await client.query('SELECT version FROM moi_ngay.schema_version')
      if (result.rows.length !== 1 || result.rows[0].version !== 1)
        throw new Error('Schema not ready')
    })
  }
}
