import { getAuthSnapshot, registerSignOutCleanup, subscribeAuth } from '../../app/auth'
import { publicConfig, supabase } from '../../services/supabase'
import { readReminderBinding, writeReminderBinding } from '../../reminders/push-store'
import {
  reminderDeviceSchema,
  reminderSettingsSchema,
  type ReminderDevice,
  type ReminderSettings,
} from './schema'

type Snapshot = {
  device: ReminderDevice | null
  publicKey: string | null
  heartbeat: string | null
  ready: boolean
  busy: boolean
  message: string
  localActive: boolean
}
const blank: Snapshot = {
  device: null,
  publicKey: null,
  heartbeat: null,
  ready: false,
  busy: false,
  message: '',
  localActive: false,
}
let snapshot = blank
const listeners = new Set<() => void>()
let generation = 0
let activeOwner: string | null = null
let initialized = false
export const getReminderSnapshot = () => snapshot
export const subscribeReminders = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function publish(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((fn) => fn())
}
function owner() {
  return getAuthSnapshot().user?.id ?? ''
}
function ownerKey() {
  return publicConfig.status === 'ready' && owner() ? `${publicConfig.url}:${owner()}` : ''
}
function deviceId() {
  const key = `moi-ngay.reminder-device:${ownerKey()}`
  const saved = localStorage.getItem(key)
  if (saved && /^[a-f0-9-]{36}$/i.test(saved)) return saved
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}
export function reminderSupport() {
  if (!import.meta.env.PROD)
    return 'Nhắc khi đóng app chỉ dùng trong bản build. Bạn vẫn có thể học ở bản phát triển.'
  if (
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window) ||
    !navigator.locks
  )
    return 'Trình duyệt này chưa hỗ trợ đầy đủ. Trên iPhone/iPad, thêm app vào màn hình chính rồi mở từ biểu tượng đó (iOS/iPadOS 16.4 trở lên).'
  return null
}
async function registration() {
  const reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg?.active) throw new Error('App chưa sẵn sàng nhận nhắc. Chờ một chút rồi tải lại trang.')
  return reg
}
async function subscribeWithTimeout(
  reg: ServiceWorkerRegistration,
  key: Uint8Array<ArrayBuffer>,
  expectedOwner: string,
) {
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const attempt = reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  void attempt
    .then(async (sub) => {
      if (!timedOut) return
      await locked(async () => {
        const binding = await readReminderBinding()
        if (!binding || (binding.owner === expectedOwner && !binding.enabled))
          await sub.unsubscribe()
      })
    })
    .catch(() => {})
  try {
    return await Promise.race([
      attempt,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true
          reject(
            new Error('Đăng ký thông báo chưa phản hồi. Bạn có thể thử lại hoặc tiếp tục học.'),
          )
        }, 15_000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
async function clearLocal(expectedOwner?: string) {
  const binding = await readReminderBinding()
  if (expectedOwner && binding && binding.owner !== expectedOwner) return
  await writeReminderBinding(null)
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg) return
  const notes = await reg.getNotifications()
  notes.filter((note) => note.data?.kind === 'study-reminder').forEach((note) => note.close())
  const sub = await reg.pushManager?.getSubscription()
  if (sub) await sub.unsubscribe()
}
const locked = <T>(work: () => Promise<T>) =>
  navigator.locks ? navigator.locks.request('moi-ngay.reminders', work) : work()
function checkCurrent(token: number) {
  if (generation !== token || !owner() || getAuthSnapshot().status !== 'signed-in')
    throw new Error('Phiên tài khoản đã thay đổi. Mở lại lịch nhắc để tiếp tục.')
}
async function load(token: number) {
  checkCurrent(token)
  const id = deviceId()
  const [devices, service] = await Promise.all([
    supabase!.from('reminder_devices').select('*').eq('id', id).retry(false).maybeSingle(),
    supabase!.from('reminder_service').select('public_key,heartbeat_at').retry(false).maybeSingle(),
  ])
  checkCurrent(token)
  if (devices.error || service.error)
    throw new Error('Chưa tải được lịch nhắc. Kiểm tra kết nối rồi tải lại.')
  const device = devices.data ? reminderDeviceSchema.parse(devices.data) : null
  let localActive = false
  if (!reminderSupport()) {
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = await reg?.pushManager.getSubscription()
    checkCurrent(token)
    localActive = !!(
      device?.enabled &&
      sub &&
      Notification.permission === 'granted' &&
      (device.subscription as { endpoint?: string })?.endpoint === sub.endpoint
    )
    await writeReminderBinding(
      device
        ? {
            owner: ownerKey(),
            deviceId: device.id,
            revision: device.revision,
            enabled: localActive,
            settings: device.settings,
          }
        : null,
    )
    checkCurrent(token)
  }
  publish({
    device,
    publicKey: service.data?.public_key ?? null,
    heartbeat: service.data?.heartbeat_at ?? null,
    ready: true,
    localActive,
  })
}
export async function refreshReminders() {
  if (!supabase || getAuthSnapshot().status !== 'signed-in' || snapshot.busy) return
  const token = generation
  publish({ busy: true, message: '' })
  try {
    await locked(() => load(token))
  } catch (error) {
    if (token === generation)
      publish({ message: error instanceof Error ? error.message : 'Chưa tải được lịch nhắc.' })
  } finally {
    if (token === generation) publish({ busy: false })
  }
}
export async function changeReminder(
  action: 'enable' | 'save' | 'disable' | 'snooze',
  settings: ReminderSettings,
) {
  if (snapshot.busy || !snapshot.ready || !supabase) return
  const token = generation,
    expectedOwner = ownerKey(),
    captured = snapshot
  const parsed = reminderSettingsSchema.safeParse(settings)
  if (!parsed.success && action !== 'disable' && action !== 'snooze') {
    publish({
      message: 'Chọn ít nhất một ngày, múi giờ hợp lệ và giờ nhắc nằm ngoài giờ yên lặng.',
    })
    return
  }
  // Permission must be requested directly in the click handler, before awaiting locks/network.
  const permission =
    action === 'enable' && !reminderSupport() ? Notification.requestPermission() : null
  publish({ busy: true, message: '' })
  try {
    if (permission && (await permission) !== 'granted')
      throw new Error(
        'Bạn chưa cho phép thông báo. Có thể đổi quyền trong cài đặt trình duyệt; việc học vẫn dùng bình thường.',
      )
    await locked(async () => {
      checkCurrent(token)
      const id = captured.device?.id ?? deviceId()
      await writeReminderBinding({
        owner: expectedOwner,
        deviceId: id,
        revision: captured.device?.revision ?? 0,
        enabled: false,
        settings: captured.device?.settings ?? settings,
      })
      const enabled = action === 'enable' || (action === 'save' && !!captured.device?.enabled)
      let sub: PushSubscription | null = null
      if (enabled) {
        if (reminderSupport()) throw new Error(reminderSupport()!)
        if (
          !captured.publicKey ||
          !captured.heartbeat ||
          Date.now() - Date.parse(captured.heartbeat) > 90_000
        )
          throw new Error('Máy nhắc chưa sẵn sàng. Thử tải lại sau khi máy nhắc được mở.')
        const reg = await registration()
        checkCurrent(token)
        sub = await reg.pushManager.getSubscription()
        const key = Uint8Array.from(
          atob(captured.publicKey.replace(/-/g, '+').replace(/_/g, '/')),
          (c) => c.charCodeAt(0),
        )
        if (
          sub &&
          sub.options.applicationServerKey &&
          !new Uint8Array(sub.options.applicationServerKey).every((byte, i) => byte === key[i])
        ) {
          await sub.unsubscribe()
          sub = null
        }
        if (!sub) sub = await subscribeWithTimeout(reg, key, expectedOwner)
        try {
          checkCurrent(token)
        } catch (error) {
          await sub.unsubscribe()
          throw error
        }
      }
      // Invalidate old revisions before editing or disabling, even if the network response is lost.
      if (action === 'disable') await clearLocal(expectedOwner)
      checkCurrent(token)
      const result =
        action === 'snooze'
          ? await supabase!.rpc('snooze_reminder', {
              p_owner: owner(),
              p_id: captured.device!.id,
              p_revision: captured.device!.revision,
            })
          : await supabase!.rpc('save_reminder', {
              p_owner: owner(),
              p_id: id,
              p_revision: captured.device?.revision ?? 0,
              p_enabled: enabled,
              p_settings: action === 'disable' ? captured.device!.settings : parsed.data,
              p_subscription: sub?.toJSON() ?? null,
              p_public_key: captured.publicKey,
            })
      checkCurrent(token)
      if (result.error) {
        if (sub) await sub.unsubscribe()
        throw new Error(
          'Chưa xác nhận được thay đổi; nhắc trên máy đã tạm dừng. Tải lại lịch để kiểm tra trước khi thử lại.',
        )
      }
      await load(token)
      publish({
        message:
          action === 'disable'
            ? 'Đã tắt nhắc trên thiết bị này.'
            : action === 'snooze'
              ? 'Đã dời lượt tiếp theo thêm 30 phút, tránh giờ yên lặng.'
              : enabled
                ? 'Đã lưu lịch nhắc cho thiết bị này.'
                : 'Đã lưu lựa chọn. Nhắc vẫn đang tắt.',
      })
    })
  } catch (error) {
    if (token === generation)
      publish({
        message:
          error instanceof Error &&
          !['AbortError', 'NotAllowedError', 'InvalidStateError'].includes(error.name)
            ? error.message
            : 'Chưa đăng ký được thông báo. Kiểm tra quyền, kết nối và thử lại.',
        localActive: false,
      })
  } finally {
    if (token === generation) publish({ busy: false })
  }
}
export function initializeReminders() {
  if (initialized) return
  initialized = true
  const changed = () => {
    const next = ownerKey()
    if (next === activeOwner) return
    activeOwner = next
    generation++
    snapshot = { ...blank }
    listeners.forEach((fn) => fn())
    // Auth callbacks must not call the SDK while its internal lock is held.
    setTimeout(() => {
      void locked(async () => {
        const binding = await readReminderBinding()
        if (binding && binding.owner !== ownerKey()) await clearLocal(binding.owner)
      }).catch(() => {})
    }, 0)
  }
  subscribeAuth(changed)
  changed()
  registerSignOutCleanup(async () => {
    const leaving = ownerKey(),
      id = owner()
    generation++
    await locked(async () => {
      const binding = await readReminderBinding()
      await clearLocal(leaving)
      if (binding?.owner === leaving && supabase) {
        const row = await supabase
          .from('reminder_devices')
          .select('*')
          .eq('id', binding.deviceId)
          .retry(false)
          .maybeSingle()
        if (row.data?.enabled)
          await supabase.rpc('save_reminder', {
            p_owner: id,
            p_id: row.data.id,
            p_revision: row.data.revision,
            p_enabled: false,
            p_settings: row.data.settings,
          })
      }
    }).catch(() => {
      /* Logout still proceeds; revocation of an in-flight push is best effort. */
    })
    publish({ busy: false, localActive: false })
  })
}
