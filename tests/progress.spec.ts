import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { emptyState, type StudyState } from '../src/data/schema'

const key = 'moi-ngay.study.v1'
const now = new Date(2026, 8, 6, 10).getTime()
async function stateOf(page: Page): Promise<StudyState> {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)
}
async function totalOf(page: Page) {
  return (await stateOf(page)).activityLog.reduce((sum, entry) => sum + entry.elapsedMs, 0)
}
async function openSettings(page: Page) {
  const mobile = page.getByRole('button', { name: 'Mở cài đặt', exact: true })
  await (
    (await mobile.isVisible()) ? mobile : page.getByRole('button', { name: 'Mở cài đặt cá nhân' })
  ).click()
}
async function startQuick(page: Page) {
  await page
    .getByRole('group', { name: 'Thời gian cho phiên học' })
    .getByRole('button', { name: /^2 phút/ })
    .click()
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
  await expect(page.locator('.activity-meter')).toBeVisible()
}

test('time stops for inactivity, manual pause, preferences and leaving the lesson', async ({
  page,
}) => {
  await page.clock.install({ time: now })
  await page.goto('/')
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  await expect(page.locator('.activity-meter')).toBeVisible()
  await page.clock.runFor(65_000)
  const idle = await totalOf(page)
  expect(idle).toBeGreaterThanOrEqual(59_000)
  expect(idle).toBeLessThanOrEqual(61_000)
  await expect(page.getByText('Đang nghỉ · chạm hoặc gõ để tiếp tục')).toBeVisible()
  await page.clock.runFor(15_000)
  expect(await totalOf(page)).toBe(idle)
  await page.getByRole('button', { name: 'Mình sẵn sàng thử' }).click()
  await page.clock.runFor(6000)
  expect(await totalOf(page)).toBeGreaterThan(idle)
  await page.getByRole('button', { name: 'Tạm dừng đo thời gian', exact: true }).click()
  const paused = await totalOf(page)
  await page.clock.runFor(12_000)
  expect(await totalOf(page)).toBe(paused)
  await page.getByRole('button', { name: 'Tiếp tục đo thời gian', exact: true }).click()
  await page.clock.runFor(6000)
  await openSettings(page)
  const settings = await totalOf(page)
  await page.clock.runFor(12_000)
  expect(await totalOf(page)).toBe(settings)
  await page.getByRole('button', { name: 'Đóng cài đặt', exact: true }).click()
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click()
  const left = await totalOf(page)
  await page.clock.runFor(12_000)
  expect(await totalOf(page)).toBe(left)
  await page.goto('/#/progress')
  await expect(page.getByTestId('measured-total')).not.toHaveText('Chưa có dữ liệu đo')
  expect((await stateOf(page)).completions).toHaveLength(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('switching browser tabs and reloading never count time away or duplicate checkpoints', async ({
  page,
  context,
}) => {
  // Let the page load, then stop wall time so browser/CI latency is not counted
  // in addition to the explicit runFor intervals asserted below.
  await page.clock.install({ time: now - 60_000 })
  await page.goto('/')
  await page.clock.pauseAt(now)
  await startQuick(page)
  await page.clock.runFor(8000)
  const first = await totalOf(page)
  expect(first).toBeGreaterThanOrEqual(5000)
  const other = await context.newPage()
  await other.goto('about:blank')
  // Playwright emulates focus on every page by default. Disable that emulation
  // so bringing another tab forward exercises the browser's actual blur/focus events.
  const firstProtocol = await context.newCDPSession(page)
  const otherProtocol = await context.newCDPSession(other)
  await firstProtocol.send('Emulation.setFocusEmulationEnabled', { enabled: false })
  await otherProtocol.send('Emulation.setFocusEmulationEnabled', { enabled: false })
  await other.bringToFront()
  await expect.poll(() => page.evaluate(() => document.hasFocus())).toBe(false)
  const background = await totalOf(page)
  await page.clock.runFor(30_000)
  expect(await totalOf(page)).toBe(background)
  await page.bringToFront()
  await expect.poll(() => page.evaluate(() => document.hasFocus())).toBe(true)
  await page.clock.runFor(6000)
  expect(await totalOf(page)).toBeGreaterThan(background)
  await page.reload()
  const restored = await totalOf(page)
  expect(restored).toBeLessThanOrEqual(15_000)
  await page.clock.runFor(6000)
  const after = await totalOf(page)
  expect(after - restored).toBeGreaterThanOrEqual(5000)
  expect(after - restored).toBeLessThanOrEqual(6500)
  await page.getByRole('button', { name: 'Tạm dừng phiên', exact: true }).click()
  const last = await totalOf(page)
  await page.reload()
  await page.clock.runFor(60_000)
  expect(await totalOf(page)).toBe(last)
  const state = await stateOf(page)
  expect(new Set(state.activityLog.map((entry) => entry.id)).size).toBe(state.activityLog.length)
  await other.close()
})

test('progress keeps completed and replaced sessions with real quick results and measured time', async ({
  page,
}, info) => {
  await page.clock.install({ time: now })
  await page.goto('/')
  await startQuick(page)
  await page.clock.runFor(6000)
  await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
  await page.getByRole('button', { name: 'Mình cần gợi ý', exact: true }).click()
  await page.getByLabel('Câu trả lời của bạn').fill('is')
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await page.getByRole('button', { name: 'Kết thúc phiên' }).click()
  await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
  await page.getByRole('button', { name: 'Bắt đầu phiên 5 phút' }).click()
  await page.getByRole('button', { name: 'Bắt đầu bài này' }).click()
  await page.clock.runFor(6000)
  await page.getByRole('button', { name: 'Tạm dừng phiên', exact: true }).click()
  page.on('dialog', (dialog) => dialog.accept())
  await startQuick(page)
  await page.getByRole('button', { name: 'Tạm dừng phiên', exact: true }).click()
  await page.goto('/#/progress')
  await expect(page.getByText('Đã đổi kế hoạch', { exact: true })).toBeVisible()
  await expect(page.getByText('Hoàn tất', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tiếp tục phiên này' })).toBeVisible()
  await page
    .getByRole('group', { name: 'Lọc lịch sử luyện tập' })
    .getByRole('button', { name: 'Khởi động', exact: true })
    .click()
  await expect(page.locator('.history-item')).toHaveCount(1)
  await expect(page.locator('.history-item')).toContainText('Đúng với gợi ý')
  await expect(page.locator('.history-item')).not.toContainText('Chưa có dữ liệu đo')
  const state = await stateOf(page)
  expect(state.completions).toHaveLength(0)
  expect(state.quickLog).toHaveLength(1)
  expect(state.planHistory).toHaveLength(2)
  expect(state.planHistory.map((entry) => entry.status)).toEqual(['completed', 'replaced'])
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    report.violations.map((issue) => ({
      id: issue.id,
      nodes: issue.nodes.map((node) => node.target),
    })),
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('progress.png'), fullPage: true })
})

test('simulated visibility and page lifecycle events stop recording until visible again', async ({
  page,
}) => {
  await page.clock.install({ time: now })
  await page.goto('/')
  await startQuick(page)
  await page.clock.runFor(6000)
  // Headless Chrome keeps visibility visible even for background tabs. Exercise
  // the real event handlers with a controlled visibility value, separately from
  // the native focus/blur test above. This does not substitute for device tests.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const hidden = await totalOf(page)
  await page.clock.runFor(20_000)
  expect(await totalOf(page)).toBe(hidden)
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'visibilityState')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(6000)
  expect(await totalOf(page)).toBeGreaterThan(hidden)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')))
  const left = await totalOf(page)
  await page.clock.runFor(20_000)
  expect(await totalOf(page)).toBe(left)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow')))
  await page.clock.runFor(6000)
  expect(await totalOf(page)).toBeGreaterThan(left)
})

test('old progress has unknown duration and restore or reset cannot be repopulated by an old timer', async ({
  page,
}) => {
  await page.clock.install({ time: now })
  await page.goto('/')
  const legacy = {
    ...emptyState(),
    version: 2,
    completions: [
      {
        id: 'old',
        lessonId: 'hello',
        independent: 3,
        completedAt: now,
        reflection: 'My name is Mai.',
      },
    ],
  }
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, value), {
    storageKey: key,
    value: JSON.stringify(legacy),
  })
  await page.goto('/#/progress')
  await page.reload()
  await expect(page.getByTestId('measured-total')).toHaveText('Chưa có dữ liệu đo')
  await expect(page.locator('.history-item')).toContainText('Chưa có dữ liệu đo')
  await page.goto('/#/today')
  await startQuick(page)
  await page.clock.runFor(6000)
  await openSettings(page)
  page.on('dialog', (dialog) => dialog.accept())
  await page.locator('input[type=file]').setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  await page.getByRole('button', { name: 'Đóng cài đặt', exact: true }).click()
  await page.clock.runFor(12_000)
  expect((await stateOf(page)).activityLog).toEqual([])
  expect((await stateOf(page)).planHistory).toEqual([])
  await startQuick(page)
  await page.clock.runFor(6000)
  await openSettings(page)
  await page.getByRole('button', { name: 'Xóa dữ liệu trên thiết bị' }).click()
  await page.clock.runFor(12_000)
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBeNull()
})
