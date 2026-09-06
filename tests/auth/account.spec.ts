import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  authKey,
  cleanupAccount,
  createTestAccount,
  local,
  requestCode,
  testEmail,
  verifyCode,
} from './helpers'
import { emptyState } from '../../src/data/schema'
import { startLesson } from '../../src/domain/session'
import { STORAGE_KEY, studyKey } from '../../src/data/study-store'

async function axe(page: Page) {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(report.violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}
async function seedLogin(page: Page, account: Awaited<ReturnType<typeof createTestAccount>>) {
  await page.goto('/')
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
    key: authKey,
    session: account.session,
  })
  await page.goto('/#/account')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Đã đăng nhập', exact: true })).toBeVisible()
}

test('new email signs up using a real OTP, rejects a wrong code and saves only the account name', async ({
  page,
}, testInfo) => {
  const email = testEmail()
  let id: string | undefined
  try {
    const code = await requestCode(page, email)
    await axe(page)
    await page.getByLabel('Mã đăng nhập').fill(code === '000000' ? '111111' : '000000')
    await page.getByRole('button', { name: 'Xác nhận mã' }).click()
    await expect(page.getByRole('status')).toContainText('Mã chưa hợp lệ')
    id = await verifyCode(page, code)
    await page.getByLabel('Tên tài khoản', { exact: true }).fill('Tên thử riêng')
    await page.getByRole('button', { name: 'Lưu tên tài khoản' }).click()
    await expect(page.getByText('Đã lưu tên vào tài khoản.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Tên tài khoản', { exact: true })).toHaveValue('Tên thử riêng')
    await axe(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath('account.png'), fullPage: true })
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
    await page.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
    await expect(page.getByLabel('Email của bạn')).toBeVisible()
    await expect(page.getByText(email, { exact: true })).toHaveCount(0)
    expect(await page.evaluate((key) => localStorage.getItem(key), authKey)).toBeNull()
  } finally {
    if (id) await cleanupAccount(id, email)
  }
})

test('switching accounts across tabs separates drafts and stops the old activity clock', async ({
  page,
  context,
}) => {
  const alice = await createTestAccount()
  const bob = await createTestAccount()
  const aliceKey = studyKey({ project: local.url, userId: alice.id })
  const bobKey = studyKey({ project: local.url, userId: bob.id })
  try {
    await page.clock.install({ time: Date.now() })
    await page.goto('/')
    const guest = startLesson(emptyState(), 'hello', 'guest-draft')
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key: STORAGE_KEY,
      raw: JSON.stringify(guest),
    })
    await page.reload()
    await verifyCode(page, await requestCode(page, alice.email))
    await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
    await page.getByRole('button', { name: /^2 phút/ }).click()
    await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
    await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
    await page.getByLabel('Câu trả lời của bạn').fill('alice-private-answer')
    await page.clock.runFor(6000)
    expect(
      JSON.parse((await page.evaluate((key) => localStorage.getItem(key), aliceKey))!).activityLog
        .length,
    ).toBeGreaterThan(0)
    const other = await context.newPage()
    await other.goto('/#/account')
    await other.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
    await expect(page.locator('.current-study-scope')).toHaveCount(0)
    await verifyCode(other, await requestCode(other, bob.email))
    await expect(page.locator('.current-study-scope')).toBeVisible()
    await page.bringToFront()
    await page.clock.runFor(6000)
    expect(await page.evaluate((key) => localStorage.getItem(key), bobKey)).toBeNull()
    expect(
      JSON.parse((await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))!).draft.id,
    ).toBe('guest-draft')
    expect(
      JSON.parse((await page.evaluate((key) => localStorage.getItem(key), aliceKey))!).plan.practice
        .answer,
    ).toBe('alice-private-answer')
    await page.getByRole('navigation').getByRole('link', { name: 'Hôm nay', exact: true }).click()
    await expect(page.getByRole('link', { name: /Tiếp tục phiên đang dở/ })).toHaveCount(0)
    await other.close()
    // A fresh, valid server session is used as a fixture to revisit Alice's stored scope.
    await seedLogin(page, alice)
    await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
    await page.getByRole('link', { name: /Tiếp tục phiên đang dở/ }).click()
    await expect(page.getByLabel('Câu trả lời của bạn')).toHaveValue('alice-private-answer')
  } finally {
    await cleanupAccount(alice.id, alice.email)
    await cleanupAccount(bob.id, bob.email)
  }
})

test('profile failures preserve typed data and retry loads the real private record', async ({
  page,
}) => {
  const account = await createTestAccount()
  try {
    await page.route('**/rest/v1/account_profiles*', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"test outage"}',
      }),
    )
    await seedLogin(page, account)
    await expect(
      page.getByText('Chưa tải được thông tin tài khoản.', { exact: false }),
    ).toBeVisible()
    await page.unroute('**/rest/v1/account_profiles*')
    await page.getByRole('button', { name: 'Thử tải lại' }).click()
    await page.getByLabel('Tên tài khoản', { exact: true }).fill('Keep this draft')
    await page.route('**/rest/v1/account_profiles*', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"test outage"}',
      }),
    )
    await page.getByRole('button', { name: 'Lưu tên tài khoản' }).click()
    await expect(page.getByText('Chưa lưu được tên tài khoản.', { exact: false })).toBeVisible()
    await expect(page.getByLabel('Tên tài khoản', { exact: true })).toHaveValue('Keep this draft')
    await page.unroute('**/rest/v1/account_profiles*')
    await page.getByRole('button', { name: 'Lưu tên tài khoản' }).click()
    await expect(page.getByText('Đã lưu tên vào tài khoản.', { exact: true })).toBeVisible()
  } finally {
    await cleanupAccount(account.id, account.email)
  }
})

test('an import started before sign-out cannot replace the guest data afterward', async ({
  page,
  context,
}) => {
  const account = await createTestAccount()
  try {
    await seedLogin(page, account)
    await page.getByRole('button', { name: 'Mở cài đặt và bản sao' }).click()
    await page.evaluate(() => {
      const original = File.prototype.text
      File.prototype.text = function () {
        return new Promise<string>((resolve) => {
          window.addEventListener(
            'finish-test-import',
            () => {
              void original.call(this).then(resolve)
            },
            { once: true },
          )
        })
      }
    })
    const backup = startLesson(emptyState(), 'hello', 'private-import')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'account-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    })
    const other = await context.newPage()
    await other.goto('/#/account')
    await other.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
    await expect(page.locator('.current-study-scope')).toHaveCount(0)
    const dialogs: string[] = []
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message())
      await dialog.dismiss()
    })
    await page.evaluate(() => window.dispatchEvent(new Event('finish-test-import')))
    await page.getByRole('button', { name: 'Đóng cài đặt' }).click()
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
    expect(dialogs).toEqual([])
    await other.close()
  } finally {
    await cleanupAccount(account.id, account.email)
  }
})

test('failed email delivery leaves guest learning available and failed server logout still hides local account data', async ({
  page,
}) => {
  await page.route('**/auth/v1/otp', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"test outage"}',
    }),
  )
  await page.goto('/#/account')
  await page.getByLabel('Email của bạn').fill(testEmail())
  await page.getByRole('button', { name: 'Nhận mã đăng nhập' }).click()
  await expect(page.getByText('Chưa gửi được mã.', { exact: false })).toBeVisible()
  await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu học', exact: true })).toBeVisible()
  const account = await createTestAccount()
  try {
    await seedLogin(page, account)
    await page.route('**/auth/v1/logout*', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"test outage"}',
      }),
    )
    await page.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
    await expect(page.getByLabel('Email của bạn')).toBeVisible()
    await expect(
      page.getByText('Đã rời tài khoản trên trình duyệt này.', { exact: false }),
    ).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), authKey)).toBeNull()
    await expect(page.locator('.current-study-scope')).toHaveCount(0)
  } finally {
    await cleanupAccount(account.id, account.email)
  }
})
