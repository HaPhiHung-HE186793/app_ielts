import pack from '../content/offline-pack.json'

type PackStatus = {
  version: string
  build: string
  count: number
  bytes: number
  total: number
  totalBytes: number
  shellBytes: number
  ready: boolean
}
type OfflineSnapshot = {
  phase: 'starting' | 'unsupported' | 'available' | 'busy' | 'error'
  pack: PackStatus | null
  message: string
  update: boolean
  online: boolean
}
let snapshot: OfflineSnapshot = {
  phase: 'starting',
  pack: null,
  message: '',
  update: false,
  online: navigator.onLine,
}
const listeners = new Set<() => void>()
let registration: ServiceWorkerRegistration | null = null
let initialized = false
const publish = (patch: Partial<OfflineSnapshot>) => {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((listener) => listener())
}
export const getOfflineSnapshot = () => snapshot
export function subscribeOffline(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const offlinePack = pack

async function command(command: 'STATUS' | 'DOWNLOAD' | 'DELETE') {
  const worker = navigator.serviceWorker.controller
  if (!worker) throw new Error('App chưa sẵn sàng tải offline. Thử lại sau vài giây.')
  return new Promise<PackStatus>((resolve, reject) => {
    const channel = new MessageChannel()
    const timeout = window.setTimeout(() => {
      channel.port1.close()
      reject(new Error('Chưa nhận được xác nhận. Bấm kiểm tra để xem các file đã lưu.'))
    }, 300_000)
    channel.port1.onmessage = ({ data }) => {
      if (data.progress) {
        publish({ pack: data.progress })
        return
      }
      clearTimeout(timeout)
      channel.port1.close()
      if (data.result) publish({ pack: data.result })
      if (data.error)
        reject(
          new Error(
            data.error === 'quota'
              ? 'Thiết bị không còn đủ chỗ. Giải phóng dung lượng rồi thử tải lại.'
              : data.error === 'version'
                ? 'Phiên bản đã thay đổi. Đóng các cửa sổ Mỗi ngày rồi mở lại.'
                : 'Chưa tải đủ gói. Kiểm tra kết nối và thử tải lại; phần đã lưu vẫn còn.',
          ),
        )
      else resolve(data.result)
    }
    worker.postMessage({ command, version: pack.version }, [channel.port2])
  })
}

export async function refreshOffline() {
  if (snapshot.phase === 'busy' || !navigator.serviceWorker?.controller) return
  try {
    const status = await command('STATUS')
    publish({ pack: status, phase: 'available', message: '' })
  } catch (error) {
    publish({ phase: 'error', message: (error as Error).message })
  }
}
export async function manageOffline(action: 'DOWNLOAD' | 'DELETE') {
  if (snapshot.phase === 'busy') return
  publish({
    phase: 'busy',
    message: action === 'DOWNLOAD' ? 'Đang tải và kiểm tra từng file…' : 'Đang xóa file tải xuống…',
  })
  try {
    const status = await command(action)
    publish({
      pack: status,
      phase: 'available',
      message:
        action === 'DOWNLOAD'
          ? 'Đã tải đủ. Bạn có thể đóng app và mở lại khi mất mạng.'
          : 'Đã xóa file của gói. Tiến độ học và phần chờ đồng bộ vẫn được giữ.',
    })
  } catch (error) {
    publish({ phase: 'error', message: (error as Error).message })
  }
}

export async function initializeOffline() {
  if (initialized) return
  initialized = true
  if (
    !import.meta.env.PROD ||
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('caches' in window)
  ) {
    publish({
      phase: 'unsupported',
      message: import.meta.env.DEV
        ? 'Tải offline dùng ở bản build. Mở bản xem thử để kiểm tra tính năng này.'
        : 'Trình duyệt hoặc địa chỉ này chưa hỗ trợ tải offline. Bạn vẫn có thể học khi có mạng.',
    })
    return
  }
  const connection = () => publish({ online: navigator.onLine })
  window.addEventListener('online', connection)
  window.addEventListener('offline', connection)
  window.addEventListener('focus', () => {
    void refreshOffline()
  })
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    void refreshOffline()
  })
  try {
    registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    const check = () => publish({ update: !!registration?.waiting })
    check()
    registration.addEventListener('updatefound', () => {
      const installing = registration?.installing
      installing?.addEventListener('statechange', () => {
        check()
        if (installing.state === 'redundant' && !navigator.serviceWorker.controller)
          publish({
            phase: 'error',
            message:
              'Chưa lưu được phần mở app. Kiểm tra kết nối/dung lượng và tải lại trang để thử lại.',
          })
      })
    })
    if (navigator.serviceWorker.controller) await refreshOffline()
  } catch {
    publish({
      phase: 'error',
      message: 'Chưa chuẩn bị được app offline. Kiểm tra kết nối/dung lượng rồi tải lại trang.',
    })
  }
}
