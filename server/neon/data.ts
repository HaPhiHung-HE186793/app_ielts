import { type DataRequest } from '../../src/services/data-contract.ts'
import { NeonDatabase } from './database.ts'

export async function executeData(db: NeonDatabase, input: DataRequest) {
  return db.transaction('moi_ngay_api', input.owner, async (client) => {
    switch (input.action) {
      case 'profile.read':
        return (
          (
            await client.query('SELECT display_name FROM moi_ngay.account_profiles WHERE id=$1', [
              input.owner,
            ])
          ).rows[0] ?? null
        )
      case 'profile.save':
        await client.query(
          'INSERT INTO moi_ngay.account_profiles(id,display_name) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name',
          [input.owner, input.name],
        )
        return null
      case 'study.read':
        return (
          (
            await client.query(
              'SELECT revision::float8 AS revision,state FROM moi_ngay.study_snapshots WHERE user_id=$1',
              [input.owner],
            )
          ).rows[0] ?? null
        )
      case 'study.commit':
        return (
          await client.query('SELECT moi_ngay.commit_study($1,$2,$3,$4::jsonb) AS result', [
            input.owner,
            input.mutation,
            input.revision,
            JSON.stringify(input.state),
          ])
        ).rows[0].result
      case 'reminders.read': {
        const devices = await client.query(
          'SELECT to_jsonb(d) AS result FROM moi_ngay.reminder_devices d WHERE id=$1 AND user_id=$2',
          [input.device, input.owner],
        )
        const service = await client.query(
          'SELECT public_key,heartbeat_at FROM moi_ngay.reminder_service',
        )
        return { device: devices.rows[0]?.result ?? null, service: service.rows[0] ?? null }
      }
      case 'reminders.save':
        return (
          await client.query(
            'SELECT to_jsonb(moi_ngay.save_reminder($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)) AS result',
            [
              input.owner,
              input.device,
              input.revision,
              input.enabled,
              JSON.stringify(input.settings),
              JSON.stringify(input.subscription),
              input.publicKey,
            ],
          )
        ).rows[0].result
      case 'reminders.snooze':
        return (
          await client.query('SELECT to_jsonb(moi_ngay.snooze_reminder($1,$2,$3)) AS result', [
            input.owner,
            input.device,
            input.revision,
          ])
        ).rows[0].result
    }
  })
}
