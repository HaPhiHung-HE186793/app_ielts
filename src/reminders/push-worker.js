/* global consumeReminder */
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload
      try {
        payload = event.data?.json()
      } catch {
        return
      }
      if (!(await consumeReminder(payload))) return
      await self.registration.showNotification('Một chút tiếng Anh hôm nay', {
        body: 'Nếu bạn sẵn sàng, mở Mỗi ngày và chọn một phiên vừa sức. Bạn cũng có thể nghỉ hôm nay.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `moi-ngay.reminder.${payload.deviceId}.${payload.day}`,
        renotify: false,
        data: { kind: 'study-reminder' },
      })
    })(),
  )
})
self.addEventListener('notificationclick', (event) => {
  if (event.notification.data?.kind !== 'study-reminder') return
  event.notification.close()
  event.waitUntil(
    (async () => {
      const url = new URL('/#/today', self.location.origin).href
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (existing) {
        await existing.navigate(url)
        await existing.focus()
      } else await self.clients.openWindow(url)
    })(),
  )
})
