import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { admin, authKey, cleanupAccount, createTestAccount } from './helpers'

async function login(page: Page, account: Awaited<ReturnType<typeof createTestAccount>>) {
  await page.goto('/')
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
    key: authKey,
    session: account.session,
  })
  await page.goto('/#/reminders')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Lưu lịch nhắc', exact: true })).toBeEnabled()
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
}
async function fixturePush(context: BrowserContext, grant: boolean) {
  // Subscription transport is controlled here; RPC, IndexedDB and worker are real.
  await context.grantPermissions(['notifications'])
  await context.addInitScript(
    ({ grant, endpoint }) => {
      Object.defineProperty(Notification, 'requestPermission', {
        value: async () => {
          localStorage.setItem(
            'test-permission-calls',
            String(Number(localStorage.getItem('test-permission-calls') ?? 0) + 1),
          )
          return grant ? 'granted' : 'denied'
        },
      })
      const wrap = (value: {
        endpoint: string
        keys: { p256dh: string; auth: string }
        appKey: number[]
      }) => ({
        endpoint: value.endpoint,
        options: { applicationServerKey: new Uint8Array(value.appKey).buffer },
        toJSON: () => ({ endpoint: value.endpoint, keys: value.keys }),
        unsubscribe: async () => {
          localStorage.removeItem('test-subscription')
          return true
        },
      })
      Object.defineProperty(PushManager.prototype, 'getSubscription', {
        value: async () => {
          const value = localStorage.getItem('test-subscription')
          return value ? wrap(JSON.parse(value)) : null
        },
      })
      Object.defineProperty(PushManager.prototype, 'subscribe', {
        value: async (options: { applicationServerKey: Uint8Array }) => {
          const value = {
            endpoint,
            keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) },
            appKey: Array.from(options.applicationServerKey),
          }
          localStorage.setItem('test-subscription', JSON.stringify(value))
          return wrap(value)
        },
      })
    },
    { grant, endpoint: `https://fcm.googleapis.com/fcm/send/ui-${crypto.randomUUID()}` },
  )
}
test.beforeEach(async () => {
  await admin
    .from('reminder_service')
    .update({ heartbeat_at: new Date().toISOString() })
    .eq('id', true)
})

test('defaults off, validates quiet hours, persists choices and handles denied permission without blocking study', async ({
  page,
  context,
}) => {
  const a = await createTestAccount()
  try {
    await fixturePush(context, false)
    await login(page, a)
    expect(await page.evaluate(() => localStorage.getItem('test-permission-calls'))).toBeNull()
    await page.getByLabel('Múi giờ', { exact: true }).fill('Asia/Ho_Chi_Minh')
    await page.getByLabel('Giờ nhắc', { exact: true }).fill('23:00')
    await page.getByRole('button', { name: 'Lưu lịch nhắc', exact: true }).click()
    await expect(
      page.getByText('Chọn ít nhất một ngày, múi giờ hợp lệ và giờ nhắc nằm ngoài giờ yên lặng.'),
    ).toBeVisible()
    await page.getByLabel('Giờ nhắc', { exact: true }).fill('19:15')
    await page.getByRole('button', { name: 'Lưu lịch nhắc', exact: true }).click()
    await expect(page.getByText('Đã lưu lựa chọn. Nhắc vẫn đang tắt.')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Giờ nhắc', { exact: true })).toHaveValue('19:15')
    await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
    await expect(page.getByText(/Bạn chưa cho phép thông báo/)).toBeVisible()
    expect(
      (await a.client.from('reminder_devices').select('enabled,subscription').single()).data,
    ).toEqual({ enabled: false, subscription: null })
    expect(await page.evaluate(() => localStorage.getItem('test-permission-calls'))).toBe('1')
    expect(
      (
        await new AxeBuilder({ page })
          .include('main')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.locator('main').focus()
    await page.screenshot({
      path: `.local/reminders-${test.info().project.name}.png`,
      fullPage: true,
    })
    await page.getByRole('link', { name: 'Chọn một phiên học', exact: true }).click()
    await expect(page.getByRole('button', { name: /^2 phút/ })).toBeVisible()
  } finally {
    await cleanupAccount(a.id, a.email)
  }
})

test('enable, snooze, reload and disable are real revisioned RPCs; logout and account switch revoke the local binding', async ({
  page,
  context,
}) => {
  const a = await createTestAccount(),
    b = await createTestAccount()
  try {
    await fixturePush(context, true)
    await login(page, a)
    await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Đã bật nhắc', exact: true })).toBeVisible()
    const initial = (await a.client.from('reminder_devices').select('*').single()).data!
    await page.getByRole('button', { name: 'Dời lượt tới 30 phút', exact: true }).click()
    await expect(
      page.getByText('Đã dời lượt tiếp theo thêm 30 phút, tránh giờ yên lặng.'),
    ).toBeVisible()
    const snoozed = (await a.client.from('reminder_devices').select('*').single()).data!
    expect(snoozed.revision).toBe(initial.revision + 1)
    expect(Date.parse(snoozed.next_at)).toBeGreaterThan(Date.parse(initial.next_at))
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Đã bật nhắc', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Tắt nhắc', exact: true }).click()
    await expect(page.getByText('Đã tắt nhắc trên thiết bị này.')).toBeVisible()
    expect(
      (await a.client.from('reminder_devices').select('enabled,subscription').single()).data,
    ).toEqual({ enabled: false, subscription: null })
    await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Đã bật nhắc', exact: true })).toBeVisible()
    await page.goto('/#/account')
    await page.getByRole('button', { name: 'Đăng xuất trên trình duyệt này', exact: true }).click()
    await expect(page.getByLabel('Email của bạn')).toBeVisible()
    expect(
      (await a.client.from('reminder_devices').select('enabled,subscription').single()).data,
    ).toEqual({ enabled: false, subscription: null })
    expect(await page.evaluate(() => localStorage.getItem('test-subscription'))).toBeNull()
    await login(page, b)
    await expect(
      page.getByRole('heading', { name: 'Nhắc đang tắt trên máy này', exact: true }),
    ).toBeVisible()
    expect((await b.client.from('reminder_devices').select('*')).data).toEqual([])
    expect(await page.evaluate(() => localStorage.getItem('test-permission-calls'))).toBe('2')
  } finally {
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
  }
})

test('lost disable response is recoverable; switching owner during an accepted enable cannot bind the new account', async ({
  page,
  context,
}) => {
  const a = await createTestAccount(),
    b = await createTestAccount()
  let release: (() => void) | undefined
  try {
    await fixturePush(context, true)
    await login(page, a)
    await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Đã bật nhắc', exact: true })).toBeVisible()
    await context.route('**/rest/v1/rpc/save_reminder', async (route) => {
      await route.fetch()
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"test lost response"}',
      })
    })
    await page.getByRole('button', { name: 'Tắt nhắc', exact: true }).click()
    await expect(page.getByText(/Chưa xác nhận được thay đổi/)).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('test-subscription'))).toBeNull()
    await context.unrouteAll()
    await page.getByRole('button', { name: 'Tải lại lịch và trạng thái', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }),
    ).toBeEnabled()
    expect((await a.client.from('reminder_devices').select('enabled').single()).data?.enabled).toBe(
      false,
    )
    let accepted = false
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    await context.route('**/rest/v1/rpc/save_reminder', async (route) => {
      const response = await route.fetch()
      accepted = true
      await held
      await route.fulfill({ response }).catch(() => {})
    })
    await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
    await expect.poll(() => accepted).toBe(true)
    await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
      key: authKey,
      session: b.session,
    })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Lưu lịch nhắc', exact: true })).toBeEnabled()
    release!()
    expect(await page.evaluate(() => localStorage.getItem('test-subscription'))).toBeNull()
    expect((await b.client.from('reminder_devices').select('*')).data).toEqual([])
    await expect(
      page.getByRole('heading', { name: 'Nhắc đang tắt trên máy này', exact: true }),
    ).toBeVisible()
  } finally {
    release?.()
    await context.unrouteAll({ behavior: 'wait' })
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
  }
})

test('worker displays one generic notification, rejects repeats/old revisions and click opens Today', async ({
  page,
  context,
  baseURL,
}) => {
  const a = await createTestAccount()
  try {
    await fixturePush(context, true)
    await login(page, a)
    await page.getByLabel('Dùng giờ yên lặng', { exact: true }).uncheck()
    await page.getByLabel('Múi giờ', { exact: true }).fill('UTC')
    await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Đã bật nhắc', exact: true })).toBeVisible()
    const device = (await a.client.from('reminder_devices').select('*').single()).data!
    const cdp = await context.newCDPSession(page)
    let registrationId = ''
    cdp.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }) => {
      registrationId =
        registrations.find((r) => r.scopeURL === `${baseURL}/`)?.registrationId ?? registrationId
    })
    await cdp.send('ServiceWorker.enable')
    await expect.poll(() => registrationId).not.toBe('')
    const now = Date.now(),
      payload = {
        kind: 'study-reminder',
        deviceId: device.id,
        revision: device.revision,
        day: new Date(now).toISOString().slice(0, 10),
        expiresAt: now + 60_000,
        url: 'https://example.test/ignored',
      }
    const push = (data: object) =>
      cdp.send('ServiceWorker.deliverPushMessage', {
        origin: baseURL!,
        registrationId,
        data: JSON.stringify(data),
      })
    const notifications = () =>
      page.evaluate(async () =>
        (await (await navigator.serviceWorker.ready).getNotifications())
          .filter((n) => n.data?.kind === 'study-reminder')
          .map((n) => ({ title: n.title, tag: n.tag, body: n.body })),
      )
    await push({ ...payload, revision: device.revision - 1 })
    expect(await notifications()).toEqual([])
    await push(payload)
    await expect.poll(notifications).toHaveLength(1)
    expect((await notifications())[0].body).not.toContain(a.email)
    // Closing then repeating must not recreate the notification: durable IndexedDB day guard.
    await page.evaluate(async () =>
      (await (await navigator.serviceWorker.ready).getNotifications()).forEach((n) => n.close()),
    )
    await push(payload)
    expect(await notifications()).toEqual([])
    const worker = context.serviceWorkers()[0]
    await worker.evaluate(() => {
      const sw = globalThis as unknown as {
        dispatchEvent: (event: Event) => void
        NotificationEvent: new (type: string, init: object) => Event
        registration: ServiceWorkerRegistration
      }
      return sw.registration
        .showNotification('Kiểm tra thao tác mở', { data: { kind: 'study-reminder' } })
        .then(async () => {
          const notification = (await sw.registration.getNotifications())[0]
          sw.dispatchEvent(new sw.NotificationEvent('notificationclick', { notification }))
        })
    })
    await expect(page).toHaveURL(`${baseURL}/#/today`)
    // Losing the authenticated owner also clears the binding on a fresh page.
    await page.goto('/#/reminders')
    await page.evaluate(({ key }) => localStorage.removeItem(key), { key: authKey })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Đăng nhập để lưu lịch riêng' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('test-subscription'))).toBeNull()
  } finally {
    await cleanupAccount(a.id, a.email)
  }
})
