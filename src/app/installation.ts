interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallSnapshot = {
  standalone: boolean
  available: boolean
  busy: boolean
  message: string
}

let snapshot: InstallSnapshot = {
  standalone: false,
  available: false,
  busy: false,
  message: '',
}
let deferredPrompt: InstallPromptEvent | null = null
let installedThisVisit = false
let initialized = false
const listeners = new Set<() => void>()

function publish(change: Partial<InstallSnapshot>) {
  snapshot = { ...snapshot, ...change }
  listeners.forEach((listener) => listener())
}

// Start before React mounts so an early browser event survives route changes.
// Nothing is persisted: a normal browser tab cannot reliably detect every installed app.
export function initializeInstallation() {
  if (initialized) return
  initialized = true
  const standalone = window.matchMedia('(display-mode: standalone)')
  const refreshDisplay = () => {
    const active =
      standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (active) deferredPrompt = null
    if (snapshot.standalone !== active) {
      publish({ standalone: active, available: !active && deferredPrompt !== null })
    }
  }
  refreshDisplay()
  standalone.addEventListener('change', refreshDisplay)
  window.addEventListener('pageshow', refreshDisplay)
  window.addEventListener('focus', refreshDisplay)
  window.addEventListener('beforeinstallprompt', (event) => {
    if (snapshot.standalone || snapshot.busy || installedThisVisit) return
    const promptEvent = event as InstallPromptEvent
    if (typeof promptEvent.prompt !== 'function') return
    event.preventDefault()
    deferredPrompt = promptEvent
    publish({ available: true, message: '' })
  })
  window.addEventListener('appinstalled', () => {
    installedThisVisit = true
    deferredPrompt = null
    publish({
      available: false,
      busy: false,
      message: 'Trình duyệt đã ghi nhận cài đặt. Khi biểu tượng Mỗi ngày xuất hiện, hãy mở từ đó.',
    })
  })
}

export const getInstallSnapshot = () => snapshot
export function subscribeInstallation(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function requestInstallation() {
  if (!deferredPrompt || snapshot.busy || snapshot.standalone) return
  const event = deferredPrompt
  deferredPrompt = null // Each event may only be prompted once, including after dismissal.
  publish({ available: false, busy: true, message: '' })
  try {
    await event.prompt() // Must run directly from the user's click, before any other await.
    const choice = await event.userChoice
    if (!installedThisVisit) {
      publish({
        message:
          choice.outcome === 'accepted'
            ? 'Bạn đã đồng ý cài. Hãy chờ trình duyệt hoàn tất, rồi mở biểu tượng Mỗi ngày.'
            : 'Bạn có thể cài sau từ menu trình duyệt. Cứ tiếp tục học khi muốn nhé.',
      })
    }
  } catch {
    if (!installedThisVisit) {
      publish({ message: 'Chưa mở được cửa sổ cài. Bạn có thể làm theo hướng dẫn bên dưới.' })
    }
  } finally {
    publish({ busy: false })
  }
}
