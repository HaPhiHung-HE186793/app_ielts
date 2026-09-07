import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { emptyState, profileSchema, type StudyState } from '../src/data/schema'
import { lessons } from '../src/content/lessons'
import { DAY, initialReview } from '../src/domain/learning'
import { startLesson } from '../src/domain/session'

const key = 'moi-ngay.study.v1'
async function seed(page: Page, value: StudyState) {
  await page.goto('/')
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key,
    value,
  })
  await page.reload()
}
const saved = (page: Page): Promise<StudyState> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
async function accessible(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('hard mode works after reopening offline and preserves the original unfinished lesson', async ({
  page,
  context,
  baseURL,
}) => {
  const original = startLesson(emptyState(), 'family', 'unfinished')
  original.draft!.pendingAnswer = 'still my own answer'
  await seed(page, original)
  await page.goto('/#/install')
  await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
  await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible({
    timeout: 20_000,
  })
  await context.setOffline(true)
  await page.close()
  const offline = await context.newPage()
  await offline.goto(`${baseURL}/#/today`)
  await offline.getByRole('radio', { name: 'Khó quá', exact: true }).check()
  await offline.getByText('Xem bài được chọn và lý do', { exact: true }).click()
  await expect(offline.locator('.plan-reasons')).toContainText('Thử câu nền tảng trước bài')
  await offline.getByRole('button', { name: 'Bắt đầu phiên 2 phút', exact: true }).click()
  await expect(offline.locator('.session-itinerary')).toContainText('Bắt đầu bằng một lời chào')
  await offline.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
  await offline.getByLabel('Câu trả lời của bạn').fill('is')
  await offline.reload()
  await expect(offline.getByLabel('Câu trả lời của bạn')).toHaveValue('is')
  await expect(offline.locator('.plan-context')).toContainText('Khó quá')
  await offline.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await offline.getByRole('button', { name: 'Kết thúc phiên' }).click()
  const result = await saved(offline)
  expect(result.draft).toEqual(original.draft)
  expect(result.reviews).toEqual(original.reviews)
  expect(result.completions).toEqual([])
  expect(result.quickLog).toHaveLength(1)
  expect(result.planHistory[0].adaptation).toEqual({ rule: 1, pace: 'hard' })
  await accessible(offline)
})

test('returning and tired paces limit a real backlog and keep their saved reasons after reload', async ({
  page,
}, info) => {
  const now = Date.now()
  const state = emptyState()
  state.profile = profileSchema.parse({
    name: 'An',
    dailyMinutes: 60,
    interests: [],
    exam: 'undecided',
  })
  state.completions = lessons.map((lesson, index) => ({
    id: `done-${index}`,
    lessonId: lesson.id,
    completedAt: now - 10 * DAY + index,
    independent: 3,
    reflection: '',
  }))
  state.reviews = Object.fromEntries(
    lessons.map((lesson, index) => [
      lesson.id,
      { ...initialReview(now), dueAt: now - (index + 1) * DAY },
    ]),
  )
  await seed(page, state)
  await expect(page.getByText('Mừng bạn quay lại.', { exact: false })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Quay lại sau nghỉ', exact: true })).toBeChecked()
  await page.getByRole('button', { name: /^Buổi đầy đủ/ }).click()
  await expect(page.locator('.session-preview')).toContainText('1 bài học · 2 câu đến hạn ôn')
  await page.getByRole('radio', { name: 'Hôm nay mệt', exact: true }).check()
  await expect(page.locator('.session-preview')).toContainText('1 bài học · 1 câu đến hạn ôn')
  await page.getByText('Xem bài được chọn và lý do', { exact: true }).click()
  await accessible(page)
  await page
    .locator('.session-choices')
    .screenshot({ path: `.local/adaptation-${info.project.name}.png` })
  await page.getByRole('button', { name: 'Bắt đầu phiên đầy đủ', exact: true }).click()
  const original = (await saved(page)).plan!
  expect(original.items).toHaveLength(2)
  expect(original.items.reduce((sum, item) => sum + item.minutes, 0)).toBe(6)
  await page.reload()
  await expect(page.locator('.plan-context')).toContainText('Hôm nay mệt')
  expect((await saved(page)).plan).toEqual(original)
  expect((await saved(page)).reviews).toEqual(state.reviews)
  await accessible(page)
})

test('support comes before interests and cancelling a pace change preserves the active plan', async ({
  page,
}) => {
  const state = emptyState()
  state.profile = profileSchema.parse({
    name: 'An',
    dailyMinutes: 30,
    interests: ['Ăn uống'],
    exam: 'undecided',
  })
  state.completions = ['hello', 'friends'].map((lessonId, index) => ({
    id: `done-${index}`,
    lessonId,
    completedAt: Date.now() - DAY + index,
    independent: index ? 1 : 3,
    reflection: '',
  }))
  await seed(page, state)
  await page.getByRole('button', { name: /^15 phút/ }).click()
  await page.getByText('Xem bài được chọn và lý do', { exact: true }).click()
  await expect(page.locator('.plan-reasons li').first()).toContainText('còn cần hỗ trợ')
  await page.getByRole('button', { name: 'Bắt đầu phiên 15 phút', exact: true }).click()
  const original = (await saved(page)).plan!
  expect(original.items[0].lessonId).toBe('friends')
  expect(original.items.some((item) => item.lessonId === 'tea')).toBe(true)
  await page.getByRole('link', { name: 'Chọn lại nhịp hoặc nghỉ ở đây', exact: true }).click()
  await page.getByRole('radio', { name: 'Khó quá', exact: true }).check()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút', exact: true }).click()
  expect((await saved(page)).plan).toEqual(original)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút', exact: true }).click()
  const result = await saved(page)
  expect(result.plan!.adaptation?.pace).toBe('hard')
  expect(result.planHistory[0]).toMatchObject({
    id: original.id,
    status: 'replaced',
    adaptation: original.adaptation,
  })
  expect(result.completions).toEqual(state.completions)
})
