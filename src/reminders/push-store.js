// Separate from the public Cache Storage pack and the version-3 learning backup.
export function reminderDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('moi-ngay.reminders', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('state')
    request.onerror = () => reject(new Error('Không mở được cài đặt nhắc trên thiết bị.'))
    request.onsuccess = () => resolve(request.result)
  })
}
export async function readReminderBinding() {
  const db = await reminderDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readonly')
    const request = tx.objectStore('state').get('current')
    tx.oncomplete = () => {
      db.close()
      resolve(request.result ?? null)
    }
    tx.onabort = () => {
      db.close()
      reject(new Error('Không đọc được cài đặt nhắc.'))
    }
  })
}
export async function writeReminderBinding(binding) {
  const db = await reminderDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite')
    const store = tx.objectStore('state')
    const request = store.get('current')
    request.onsuccess = () => {
      const previous = request.result
      store.put(
        binding
          ? {
              ...binding,
              lastDay: previous?.deviceId === binding.deviceId ? previous.lastDay : null,
            }
          : null,
        'current',
      )
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onabort = () => {
      db.close()
      reject(new Error('Không lưu được cài đặt nhắc.'))
    }
  })
}
export function reminderMayDisplay(binding, payload, now) {
  if (
    !binding?.enabled ||
    payload?.kind !== 'study-reminder' ||
    payload.deviceId !== binding.deviceId ||
    payload.revision !== binding.revision ||
    !Number.isFinite(payload.expiresAt) ||
    payload.expiresAt < now ||
    payload.expiresAt > now + 120_000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.day) ||
    payload.day === binding.lastDay
  )
    return false
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: binding.settings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const part = (name) => parts.find((item) => item.type === name)?.value
  if (`${part('year')}-${part('month')}-${part('day')}` !== payload.day) return false
  const time = `${part('hour')}:${part('minute')}`,
    settings = binding.settings
  const quiet =
    settings.quietStart < settings.quietEnd
      ? time >= settings.quietStart && time < settings.quietEnd
      : time >= settings.quietStart || time < settings.quietEnd
  return !settings.quietEnabled || !quiet
}
export async function consumeReminder(payload, now = Date.now()) {
  const db = await reminderDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite')
    const store = tx.objectStore('state')
    let accepted = false
    const request = store.get('current')
    request.onsuccess = () => {
      try {
        accepted = reminderMayDisplay(request.result, payload, now)
        if (accepted) store.put({ ...request.result, lastDay: payload.day }, 'current')
      } catch {
        accepted = false
      }
    }
    tx.oncomplete = () => {
      db.close()
      resolve(accepted)
    }
    tx.onabort = () => {
      db.close()
      reject(new Error('Không ghi được lượt nhắc.'))
    }
  })
}
