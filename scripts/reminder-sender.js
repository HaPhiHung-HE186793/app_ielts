import webpush from 'web-push'
import { createHash } from 'node:crypto'

export function supportedEndpoint(endpoint) {
  try {
    const url = new URL(endpoint)
    return (
      url.protocol === 'https:' &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(
        url.hostname,
      )
    )
  } catch {
    return false
  }
}

// The receipt is durable BEFORE the HTTP call. Unknown outcomes are not retried.
export async function sendDueReminders(
  client,
  vapid,
  send = webpush.sendNotification.bind(webpush),
  deviceId = null,
) {
  const claimed = await client.rpc('claim_reminders', { p_device: deviceId })
  if (claimed.error) throw new Error('Không lấy được lịch nhắc.')
  const counts = { accepted: 0, failed: 0, expired: 0, cancelled: 0 }
  for (const receipt of claimed.data ?? []) {
    const ready = await client.rpc('prepare_reminder', { p_delivery: receipt.id })
    if (ready.error) throw new Error('Không xác nhận được lượt gửi.')
    const item = ready.data
    if (!item) {
      counts.cancelled++
      continue
    }
    let status = 'failed'
    if (supportedEndpoint(item.subscription?.endpoint)) {
      try {
        await send(
          item.subscription,
          JSON.stringify({
            kind: 'study-reminder',
            deviceId: item.deviceId,
            revision: item.revision,
            day: item.day,
            expiresAt: item.expiresAt,
          }),
          {
            vapidDetails: vapid,
            TTL: 0,
            timeout: 10_000,
            urgency: 'normal',
            topic: createHash('sha256')
              .update(item.deviceId + item.day)
              .digest('hex')
              .slice(0, 32),
          },
        )
        status = 'accepted'
      } catch (error) {
        status = [404, 410].includes(error.statusCode) ? 'expired' : 'failed'
      }
    }
    const finished = await client.rpc('finish_reminder', { p_delivery: item.id, p_status: status })
    if (finished.error) throw new Error('Chưa lưu được kết quả gửi; lượt này sẽ không gửi lặp.')
    counts[status]++
  }
  return counts
}
