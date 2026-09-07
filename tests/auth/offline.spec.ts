import { test, expect, type Page } from '@playwright/test'
import { authKey, cleanupAccount, createTestAccount, local } from './helpers'
import { studyKey } from '../../src/data/study-store'

type Account = Awaited<ReturnType<typeof createTestAccount>>
async function login(page: Page, account: Account) {
  await page.goto('/')
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
    key: authKey,
    session: account.session,
  })
  await page.goto('/#/account')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Đã đăng nhập', exact: true })).toBeVisible()
}
async function pack(page: Page) {
  await page.goto('/#/install')
  await expect(page.getByRole('button', { name: 'Tải gói để học offline' })).toBeEnabled()
  await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
  await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible({
    timeout: 20_000,
  })
}

test('reopens an expired cached session offline, learns, and retries one accepted commit after reconnect', async ({
  page,
  context,
  baseURL,
}) => {
  const account = await createTestAccount()
  const key = studyKey({ project: local.url, userId: account.id })
  try {
    await login(page, account)
    await page.getByRole('button', { name: 'Bật đồng bộ phần học này' }).click()
    await expect(page.locator('.sync-status')).toHaveText('Đã đồng bộ')
    await pack(page)
    await page.goto('/#/today')
    await page.getByRole('button', { name: /^2 phút/ }).click()
    await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
    await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
    await page.getByLabel('Câu trả lời của bạn').fill('is')
    await context.setOffline(true)
    // Exercise the SDK refresh path on reopen; never alter the signed server JWT.
    await page.evaluate((authKey) => {
      const session = JSON.parse(localStorage.getItem(authKey)!)
      session.expires_at = Math.floor(Date.now() / 1000) - 60
      localStorage.setItem(authKey, JSON.stringify(session))
    }, authKey)
    await page.close()
    const reopened = await context.newPage()
    await reopened.goto(`${baseURL}/#/session`)
    await expect(reopened.getByLabel('Câu trả lời của bạn')).toHaveValue('is', { timeout: 10_000 })
    await reopened.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
    await reopened.getByRole('button', { name: 'Kết thúc phiên' }).click()
    await reopened.goto(`${baseURL}/#/account`)
    await expect(reopened.locator('.sync-status')).toHaveText('Mất mạng · chờ đồng bộ')
    let acceptedId: string | null = null
    await context.route('**/rest/v1/rpc/commit_study', async (route) => {
      const response = await route.fetch()
      const result = await response.json()
      if (!acceptedId && result.status === 'applied') {
        acceptedId = route.request().postDataJSON().p_mutation
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"message":"test lost acknowledgement"}',
        })
      } else await route.fulfill({ response })
    })
    await context.setOffline(false)
    await expect.poll(() => acceptedId).not.toBeNull()
    await expect(reopened.locator('.sync-status')).toHaveText('Chưa đồng bộ được')
    await expect
      .poll(() =>
        reopened.evaluate((key) => JSON.parse(localStorage.getItem(key)!)._sync.pending.id, key),
      )
      .toBe(acceptedId)
    await reopened.reload()
    await expect(reopened.locator('.sync-status')).toHaveText('Đã đồng bộ', { timeout: 20_000 })
    const { data, error } = await account.client.from('study_snapshots').select('state').single()
    expect(error).toBeNull()
    expect(data?.state.quickLog).toHaveLength(1)
    const receipts = await account.client
      .from('study_commits')
      .select('mutation_id')
      .eq('mutation_id', acceptedId!)
    expect(receipts.data).toHaveLength(1)
    expect(
      await reopened.evaluate((key) => JSON.parse(localStorage.getItem(key)!).quickLog.length, key),
    ).toBe(1)
    await reopened.close()
  } finally {
    await context.unrouteAll({ behavior: 'wait' })
    await context.setOffline(false)
    await cleanupAccount(account.id, account.email)
  }
})

test('downloaded resources are public across owners and never contain authenticated responses', async ({
  page,
  context,
}) => {
  const a = await createTestAccount(),
    b = await createTestAccount()
  try {
    await login(page, a)
    await page.getByRole('button', { name: 'Bật đồng bộ phần học này' }).click()
    await expect(page.locator('.sync-status')).toHaveText('Đã đồng bộ')
    await pack(page)
    // Seed a private answer in A's local study scope, then explicitly switch owner.
    const aKey = studyKey({ project: local.url, userId: a.id })
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key)!)
      state.completions.push({
        id: 'private-a',
        lessonId: 'hello',
        completedAt: Date.now(),
        independent: 3,
        reflection: 'Private learner A',
      })
      localStorage.setItem(key, JSON.stringify(state))
    }, aKey)
    await page.reload()
    await page.goto('/#/account')
    await page.getByRole('button', { name: 'Đồng bộ ngay' }).click()
    await expect(page.locator('.sync-status')).toHaveText('Đã đồng bộ')
    await page.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
    await expect(page.getByLabel('Email của bạn')).toBeVisible()
    await login(page, b)
    await page.goto('/#/install')
    await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
    const hasPrivate = await page.evaluate(
      async ({ aId, bId, token }) => {
        for (const name of await caches.keys()) {
          if (!name.startsWith('moi-ngay.')) continue
          const cache = await caches.open(name)
          for (const request of await cache.keys()) {
            if (/auth\/v1|rest\/v1/.test(request.url)) return true
            const text = await (await cache.match(request))!.text()
            if (
              text.includes(aId) ||
              text.includes(bId) ||
              text.includes(token) ||
              text.includes('Private learner A')
            )
              return true
          }
        }
        return false
      },
      { aId: a.id, bId: b.id, token: a.session.access_token },
    )
    expect(hasPrivate).toBe(false)
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
    await page.goto('/#/today')
    await expect(page.getByText('Private learner A', { exact: false })).toHaveCount(0)
  } finally {
    await context.setOffline(false)
    await page.close()
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
  }
})
