import { test, expect, type Page, type Browser, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  authKey,
  cleanupAccount,
  createTestAccount,
  local,
  requestCode,
  verifyCode,
} from './helpers'
import { emptyState, type StudyState } from '../../src/data/schema'
import { startLesson } from '../../src/domain/session'
import { initialReview } from '../../src/domain/learning'
import { STORAGE_KEY, studyKey } from '../../src/data/study-store'

type Account = Awaited<ReturnType<typeof createTestAccount>>
const keyFor = (account: Account) => studyKey({ project: local.url, userId: account.id })
async function openOwner(page: Page, account: Account, state?: StudyState) {
  await page.goto('/')
  await page.evaluate(
    ({ authKey, session, key, state }) => {
      if (state) localStorage.setItem(key, JSON.stringify(state))
      localStorage.setItem(authKey, JSON.stringify(session))
    },
    { authKey, session: account.session, key: keyFor(account), state },
  )
  await page.goto('/#/account')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Đã đăng nhập', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bật đồng bộ phần học này' })).toBeVisible()
}
async function enable(page: Page) {
  await page.getByRole('button', { name: 'Bật đồng bộ phần học này' }).click()
  await synced(page)
}
async function synced(page: Page) {
  await expect(page.locator('.sync-status')).toHaveText('Đã đồng bộ', { timeout: 15_000 })
}
async function syncNow(page: Page) {
  await page.goto('/#/account')
  await page.getByRole('button', { name: 'Đồng bộ ngay' }).click()
  await synced(page)
}
async function localState(page: Page, account: Account): Promise<StudyState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), keyFor(account))
}
async function remoteState(account: Account) {
  const result = await account.client.from('study_snapshots').select('state,revision').maybeSingle()
  if (result.error) throw new Error('Could not read test state')
  return result.data as { state: StudyState; revision: number } | null
}
async function device(browser: Browser, info: TestInfo) {
  return browser.newContext({
    viewport: info.project.use.viewport,
    isMobile: info.project.use.isMobile,
    hasTouch: info.project.use.hasTouch,
  })
}
async function quickDraft(page: Page, answer: string) {
  await page.goto('/#/today')
  await page.getByRole('button', { name: /^2 phút/ }).click()
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
  await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
  await page.getByLabel('Câu trả lời của bạn').fill(answer)
}

test('two independent devices resume real progress and a pending answer after opting in', async ({
  page,
  browser,
}, info) => {
  const account = await createTestAccount(),
    otherDevice = await device(browser, info)
  const completedAt = Date.now()
  const baseline = {
    ...emptyState(),
    completions: [
      {
        id: 'finished',
        lessonId: 'hello',
        completedAt,
        independent: 3,
        reflection: 'My first lesson.',
      },
    ],
    reviews: { hello: initialReview(completedAt) },
  }
  try {
    await openOwner(page, account, baseline)
    expect(await remoteState(account)).toBeNull()
    await enable(page)
    await quickDraft(page, 'a draft to continue')
    await syncNow(page)
    const other = await otherDevice.newPage()
    await verifyCode(other, await requestCode(other, account.email))
    await enable(other)
    expect((await localState(other, account)).completions).toEqual(baseline.completions)
    expect((await localState(other, account)).reviews.hello).toEqual(baseline.reviews.hello)
    await other.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
    await other.getByRole('link', { name: /Tiếp tục phiên đang dở/ }).click()
    await expect(other.getByLabel('Câu trả lời của bạn')).toHaveValue('a draft to continue')
    await other.getByLabel('Câu trả lời của bạn').fill('continued on second device')
    await syncNow(other)
    await syncNow(page)
    expect((await localState(page, account)).plan?.practice.answer).toBe(
      'continued on second device',
    )
    await page.reload()
    await synced(page)
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(axe.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: info.outputPath('sync.png'), fullPage: true })
  } finally {
    await otherDevice.close()
    await page.close()
    await cleanupAccount(account.id, account.email)
  }
})

test('offline drafts survive reload, retry a lost acknowledgement and do not create duplicate commits', async ({
  page,
  context,
}) => {
  const account = await createTestAccount()
  try {
    await openOwner(page, account)
    await enable(page)
    await context.setOffline(true)
    await quickDraft(page, 'kept while offline')
    await page.goto('/#/account')
    await expect(page.locator('.sync-status')).toHaveText('Mất mạng · chờ đồng bộ')
    expect(await remoteState(account)).toBeNull()
    // Lose only the response after the real server accepts the commit.
    let acceptedMutation: string | undefined
    await page.route('**/rest/v1/rpc/commit_study', async (route) => {
      const response = await route.fetch()
      expect(response.ok()).toBe(true)
      acceptedMutation = route.request().postDataJSON().p_mutation
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"lost acknowledgement"}',
      })
    })
    await context.setOffline(false)
    await expect(page.locator('.sync-status')).toHaveText('Chưa đồng bộ được', { timeout: 15_000 })
    expect(acceptedMutation).toBeTruthy()
    const pendingId = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!)._sync.pending.id,
      keyFor(account),
    )
    expect(pendingId).toBe(acceptedMutation)
    await page.unroute('**/rest/v1/rpc/commit_study')
    await page.reload()
    await synced(page)
    expect((await localState(page, account)).plan?.practice.answer).toBe('kept while offline')
    const receipts = await account.client
      .from('study_commits')
      .select('mutation_id')
      .eq('mutation_id', acceptedMutation!)
    expect(receipts.data).toHaveLength(1)
  } finally {
    await context.setOffline(false)
    await page.close()
    await cleanupAccount(account.id, account.email)
  }
})

test('concurrent edits show both drafts and keep histories when choosing the account version', async ({
  page,
  browser,
}, info) => {
  const account = await createTestAccount(),
    otherDevice = await device(browser, info)
  try {
    await openOwner(page, account)
    await enable(page)
    await quickDraft(page, 'shared draft')
    await syncNow(page)
    const other = await otherDevice.newPage()
    await verifyCode(other, await requestCode(other, account.email))
    await enable(other)
    await page.context().setOffline(true)
    await otherDevice.setOffline(true)
    for (const [target, answer] of [
      [page, 'my local change'],
      [other, 'change from other device'],
    ] as const) {
      await target.goto('/#/session')
      await target.getByLabel('Câu trả lời của bạn').fill(answer)
      await target.goto('/#/account')
    }
    await otherDevice.setOffline(false)
    await synced(other)
    await page.context().setOffline(false)
    await expect(page.locator('.sync-status')).toHaveText('Cần chọn bản giữ lại', {
      timeout: 15_000,
    })
    await expect(page.getByText('my local change', { exact: false }).last()).toBeVisible()
    await expect(page.getByText('change from other device', { exact: false }).last()).toBeVisible()
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(axe.violations).toEqual([])
    await page.screenshot({ path: info.outputPath('conflict.png'), fullPage: true })
    await page.reload()
    await expect(page.locator('.sync-status')).toHaveText('Cần chọn bản giữ lại', {
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Dùng phần trên tài khoản' }).click()
    await synced(page)
    expect((await localState(page, account)).plan?.practice.answer).toBe('change from other device')
    expect((await remoteState(account))?.state.plan?.practice.answer).toBe(
      'change from other device',
    )
  } finally {
    await page.context().setOffline(false)
    await otherDevice.close()
    await page.close()
    await cleanupAccount(account.id, account.email)
  }
})

test('guest import is explicit, preserves the source and a second tab waits for the writer to close', async ({
  page,
  context,
}) => {
  const account = await createTestAccount()
  const guest = startLesson(emptyState(), 'hello', 'guest-to-import')
  try {
    await page.goto('/')
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
      key: STORAGE_KEY,
      state: guest,
    })
    await openOwner(page, account)
    await enable(page)
    expect(await remoteState(account)).toBeNull()
    await page.getByRole('button', { name: 'Xem phần học không đăng nhập' }).click()
    expect(await remoteState(account)).toBeNull()
    await page.getByRole('button', { name: 'Nhập phần học đã chọn' }).click()
    await synced(page)
    expect((await remoteState(account))?.state.draft?.id).toBe('guest-to-import')
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).draft.id, STORAGE_KEY),
    ).toBe('guest-to-import')
    const other = await context.newPage()
    await other.goto('/#/account')
    await expect(other.locator('.sync-status')).toHaveText('Đang mở ở tab khác')
    await other.goto('/#/today')
    await expect(other.getByRole('heading', { name: 'Đang mở ở tab khác' })).toBeVisible()
    await page.close()
    await expect(other.getByRole('heading', { name: 'Đang mở ở tab khác' })).toHaveCount(0)
    await other.goto('/#/account')
    await synced(other)
    expect((await localState(other, account)).draft?.id).toBe('guest-to-import')
    await other.close()
  } finally {
    await cleanupAccount(account.id, account.email)
  }
})

test('a server commit finishing after logout never updates the next account', async ({ page }) => {
  const alice = await createTestAccount(),
    bob = await createTestAccount()
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  let accepted!: () => void
  const received = new Promise<void>((resolve) => {
    accepted = resolve
  })
  try {
    await openOwner(page, alice, startLesson(emptyState(), 'hello', 'alice-in-flight'))
    await page.route('**/rest/v1/rpc/commit_study', async (route) => {
      const response = await route.fetch()
      if (!response.ok()) throw new Error('Test commit failed')
      accepted()
      await hold
      try {
        await route.fulfill({ response })
      } catch {
        /* App has aborted the old owner's request. */
      }
    })
    await page.getByRole('button', { name: 'Bật đồng bộ phần học này' }).click()
    await received
    await page.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
    await verifyCode(page, await requestCode(page, bob.email))
    release()
    await page.unroute('**/rest/v1/rpc/commit_study')
    await enable(page)
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
    expect((await localState(page, bob)).draft).toBeNull()
    expect(await remoteState(bob)).toBeNull()
    expect((await remoteState(alice))?.state.draft?.id).toBe('alice-in-flight')
  } finally {
    release()
    await page.close()
    await cleanupAccount(alice.id, alice.email)
    await cleanupAccount(bob.id, bob.email)
  }
})
