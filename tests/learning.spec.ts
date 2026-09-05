import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'

const storageKey = 'moi-ngay.study.v1'

async function completeFirstLesson(page: Page, useHint = false) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  await page.getByRole('button', { name: 'Mình sẵn sàng thử' }).click()
  await page.getByLabel('Mình tên là Linh.').check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  if (useHint) {
    await page.getByRole('button', { name: 'Mình cần một gợi ý' }).click()
    await page.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill('are')
    await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
    await expect(page.getByText('Mình cùng xem lại một chút.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Mình cùng xem lại một chút.')).toBeVisible()
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  }
  await page.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill('is')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('My name is Nam.', { exact: false }).check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('Ghi lại câu của bạn').fill('Hi! My name is An.')
  await page.getByRole('button', { name: 'Hoàn thành bài học' }).click()
  await expect(page.getByRole('heading', { name: 'Bạn vừa làm được rồi.' })).toBeVisible()
}

async function openSettings(page: Page) {
  const mobileButton = page.getByRole('button', { name: 'Mở cài đặt', exact: true })
  if (await mobileButton.isVisible()) await mobileButton.click()
  else await page.getByRole('button', { name: 'Mở cài đặt cá nhân' }).click()
}

test('navigation, keyboard access and responsive layout', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.locator('.skip-link').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  for (const label of ['Khám phá', 'Luyện tập', 'Ôn lại', 'Tiến bộ', 'Hôm nay']) {
    const link = page.getByRole('navigation').getByRole('link', { name: label, exact: true })
    await link.click()
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true })
  expect(errors).toEqual([])
})

test('completes a lesson, resumes after error and preserves truthful results', async ({ page }) => {
  await completeFirstLesson(page, true)
  await expect(page.locator('.result-stat strong')).toHaveText('2/3')
  await page.reload()
  await page.getByRole('navigation').getByRole('link', { name: 'Tiến bộ' }).click()
  await expect(page.getByText('Hi! My name is An.', { exact: false })).toBeVisible()
  await expect(page.getByText('67%', { exact: true })).toBeVisible()
  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)
  expect(state.completions).toHaveLength(1)
  expect(state.draft).toBeNull()
  expect(state.reviews.hello.attempts).toBe(0)
})

test('review becomes due after one day and wrong recall reschedules once', async ({ page }) => {
  const now = Date.UTC(2026, 8, 6, 16, 59)
  await page.clock.install({ time: now })
  await completeFirstLesson(page)
  await page.clock.setSystemTime(now + 86_400_000 + 60_000)
  await page.goto('/#/review')
  await page.getByRole('button', { name: 'Bắt đầu ôn' }).click()
  await page.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill('are')
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await expect(page.getByText('Câu này sẽ đến hạn ôn lại sau 10 phút.')).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)
  expect(state.reviewLog).toHaveLength(1)
  expect(state.reviewLog[0].correct).toBe(false)
  expect(state.reviews.hello.attempts).toBe(1)
  expect(state.reviews.hello.dueAt - state.reviewLog[0].reviewedAt).toBe(600_000)
})

test('preferences, backup download and restore keep the learner data', async ({ page }) => {
  await completeFirstLesson(page)
  await openSettings(page)
  await page.getByLabel('Mình gọi bạn là gì?').fill('An')
  await page.getByLabel('Thời gian có thể học mỗi ngày').selectOption('60')
  await page.getByRole('button', { name: 'Giải trí', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu lựa chọn' }).click()
  await openSettings(page)
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Tải bản sao' }).click()
  const download = await pendingDownload
  const raw = await readFile((await download.path())!, 'utf8')
  expect(JSON.parse(raw).profile.name).toBe('An')
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Xóa dữ liệu trên thiết bị' }).click()
  await openSettings(page)
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(raw) })
  await expect(page.getByText('Đã khôi phục tiến độ từ bản sao.')).toBeVisible()
  await expect(page.getByLabel('Mình gọi bạn là gì?')).toHaveValue('An')
  await expect(page.getByLabel('Thời gian có thể học mỗi ngày')).toHaveValue('60')
  await page.getByRole('button', { name: 'Đóng cài đặt' }).click()
  await page.goto('/#/progress')
  await expect(page.getByText('Hi! My name is An.', { exact: false })).toBeVisible()
  await openSettings(page)
  await expect(page.getByLabel('Mình gọi bạn là gì?')).toHaveValue('An')
  await page.locator('input[type=file]').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{bad'),
  })
  await expect(page.getByText(/Không khôi phục được:/)).toBeVisible()
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).completions.length,
      storageKey,
    ),
  ).toBe(1)
})

test('unsubmitted text and choice survive a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  await page.getByRole('button', { name: 'Mình sẵn sàng thử' }).click()
  await page.getByLabel('Mình tên là Linh.').check()
  await page.reload()
  await expect(page.getByLabel('Mình tên là Linh.')).toBeChecked()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill('i')
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Câu trả lời của bạn' })).toHaveValue('i')
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).draft.responses.recall,
      storageKey,
    ),
  ).toBeUndefined()
})

test('core pages and preferences have no detected WCAG A/AA violations', async ({ page }) => {
  for (const path of [
    '/today',
    '/discover',
    '/practice',
    '/review',
    '/progress',
    '/lesson/hello',
  ]) {
    await page.goto(`/#${path}`)
    const report = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      report.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
      `${path}: ${JSON.stringify(report.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })))}`,
    ).toEqual([])
  }
  await openSettings(page)
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    report.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('corrupt saved state is kept intact and clearly reported', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), storageKey)
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Bản cũ được giữ nguyên')
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe('{broken')
})

test('storage failure keeps a session usable and warns that it is not saved', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError')
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Chưa lưu được thay đổi')
  await page.getByRole('button', { name: 'Mình sẵn sàng thử' }).click()
  await expect(
    page.getByRole('heading', { name: '“My name is Linh” có nghĩa là gì?' }),
  ).toBeVisible()
})

test('topic filter and an invalid lesson URL have usable outcomes', async ({ page }) => {
  await page.goto('/#/discover')
  await page.getByRole('button', { name: 'Ăn uống', exact: true }).click()
  await expect(page.locator('.lesson-card')).toHaveCount(1)
  await expect(page.locator('.lesson-card')).toContainText('Một tách trà, một câu mới')
  await page.goto('/#/lesson/not-a-lesson')
  await expect(page.getByRole('heading', { name: 'Mình chưa tìm thấy trang này.' })).toBeVisible()
  await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu học', exact: true })).toBeVisible()
})
