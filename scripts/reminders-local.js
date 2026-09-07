import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { localBackend } from './local-backend.js'
import { sendDueReminders } from './reminder-sender.js'

const local = localBackend()
const client = createClient(local.url, local.secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
await mkdir('.local', { recursive: true })
let vapid
try {
  vapid = JSON.parse(await readFile('.local/reminder-vapid.json', 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT')
    // eslint-disable-next-line preserve-caught-error -- JSON parse errors may contain private key text.
    throw new Error('Không đọc được khóa VAPID đã lưu; không tạo đè khóa cũ.')
  vapid = {
    ...webpush.generateVAPIDKeys(),
    subject: 'https://github.com/HaPhiHung-HE186793/app_ielts',
  }
  await writeFile('.local/reminder-vapid.json', JSON.stringify(vapid), { flag: 'wx', mode: 0o600 })
}
if (!/^[A-Za-z0-9_-]{87}$/.test(vapid.publicKey) || !/^[A-Za-z0-9_-]{43}$/.test(vapid.privateKey))
  throw new Error('Khóa VAPID local không hợp lệ.')
if (process.argv.includes('--setup')) {
  const result = await client
    .from('reminder_service')
    .upsert({ id: true, public_key: vapid.publicKey, heartbeat_at: new Date().toISOString() })
  if (result.error) throw new Error('Chưa thiết lập được máy nhắc local; kiểm tra migration.')
  console.log('Đã chuẩn bị khóa local và cấu hình công khai. Chưa chạy vòng gửi.')
  process.exit(0)
}
let busy = false
async function tick() {
  if (busy) return
  busy = true
  try {
    const heartbeat = await client
      .from('reminder_service')
      .upsert({ id: true, public_key: vapid.publicKey, heartbeat_at: new Date().toISOString() })
    if (heartbeat.error)
      throw new Error('Chưa cập nhật được trạng thái máy nhắc; hãy chạy db:migrate.')
    const counts = await sendDueReminders(client, vapid)
    if (Object.values(counts).some(Boolean)) console.log(JSON.stringify(counts))
  } catch {
    console.error(
      'Máy nhắc local chưa hoàn thành lượt kiểm tra. Không ghi endpoint/token vào log; kiểm tra Docker và migration.',
    )
  } finally {
    busy = false
  }
}
await tick()
console.log(
  'Máy nhắc local đang chạy. Chỉ gửi cho thiết bị đã chủ động bật; đóng tiến trình để dừng.',
)
setInterval(() => {
  void tick()
}, 10_000)
