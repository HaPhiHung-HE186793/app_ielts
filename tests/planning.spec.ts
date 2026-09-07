import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { emptyState, type StudyState } from '../src/data/schema'
import { startLesson } from '../src/domain/session'
import { initialReview } from '../src/domain/learning'

const key = 'moi-ngay.study.v1'
async function saved(page: Page): Promise<StudyState> {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)
}
async function seed(page: Page, value: unknown) {
  await page.goto('/')
  await page.evaluate(({ storageKey, raw }) => localStorage.setItem(storageKey, raw), {
    storageKey: key,
    raw: JSON.stringify(value),
  })
  await page.reload()
}
async function startMode(page: Page, mode: '2' | '5' | '15' | 'full') {
  await page
    .getByRole('group', { name: 'Thời gian cho phiên học' })
    .getByRole('button', { name: mode === 'full' ? /Buổi đầy đủ/ : new RegExp(`^${mode} phút`) })
    .click()
  await page
    .getByRole('button', {
      name: mode === 'full' ? 'Bắt đầu phiên đầy đủ' : `Bắt đầu phiên ${mode} phút`,
    })
    .click()
}
async function noAxeViolations(page: Page) {
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
}

test('first setup saves optional goals without assigning an entry band', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Thiết lập nhịp học' }).click()
  await page.getByLabel('Mình gọi bạn là gì?').fill('An')
  await page
    .getByRole('combobox', { name: 'Mục tiêu của bạn', exact: true })
    .selectOption('ielts65')
  await page.getByLabel('Ngày mục tiêu (không bắt buộc)').fill('2027-03-06')
  await page.getByLabel('Bạn thấy nền tảng hiện tại thế nào?').selectOption('starting')
  await page.getByLabel('Thời gian có thể học mỗi ngày').selectOption('60')
  await noAxeViolations(page)
  await page.getByRole('button', { name: 'Lưu lựa chọn' }).click()
  await page.reload()
  await expect(page.getByText('Mục tiêu: IELTS 6.5', { exact: true })).toBeVisible()
  expect((await saved(page)).profile).toMatchObject({
    goal: 'ielts65',
    targetDate: '2027-03-06',
    foundation: 'starting',
    exam: 'undecided',
    dailyMinutes: 60,
  })
  await startMode(page, 'full')
  await expect(
    page.getByRole('list', { name: 'Các hoạt động của phiên' }).getByRole('listitem'),
  ).toHaveCount(10)
  await expect(
    page.getByText('Tổng khoảng 50 phút dự kiến, trong 60 phút đã chọn.', { exact: false }),
  ).toBeVisible()
  await noAxeViolations(page)
})

test('two-minute recall persists separately and keeps the original lesson draft', async ({
  page,
}) => {
  const original = startLesson(emptyState(), 'hello', 'existing-draft')
  original.draft!.pendingAnswer = 'unfinished text'
  await seed(page, original)
  await startMode(page, '2')
  await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
  await expect(page.getByRole('blockquote')).toHaveCount(0)
  await page.getByLabel('Câu trả lời của bạn').fill('are')
  await page.getByRole('button', { name: 'Mình cần gợi ý', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Câu trả lời của bạn')).toHaveValue('are')
  await expect(page.locator('.hint-box')).toBeVisible()
  await noAxeViolations(page)
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await page.reload()
  await expect(page.getByText('Mình cùng nhìn lại câu này nhé.')).toBeVisible()
  await noAxeViolations(page)
  await page.getByRole('button', { name: 'Kết thúc phiên' }).click()
  await expect(
    page.getByRole('heading', { name: 'Bạn đã dành một khoảng cho mình.' }),
  ).toBeFocused()
  await noAxeViolations(page)
  const state = await saved(page)
  expect(state.quickLog).toHaveLength(1)
  expect(state.quickLog[0]).toMatchObject({ correct: false, independent: false })
  expect(state.completions).toHaveLength(0)
  expect(state.reviews).toEqual({})
  expect(state.draft).toEqual(original.draft)
  await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục bài đang học', exact: true }).click()
  expect((await saved(page)).draft).toEqual(original.draft)
})

test('five-minute session completes the whole lesson and survives receipt reload', async ({
  page,
}) => {
  await page.goto('/')
  await startMode(page, '5')
  await page.getByRole('button', { name: 'Bắt đầu bài này' }).click()
  await page.getByLabel('Mình tên là Linh.').check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('Câu trả lời của bạn').fill('is')
  await page.reload()
  await expect(page.getByLabel('Câu trả lời của bạn')).toHaveValue('is')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('My name is Nam.').check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('Ghi lại câu của bạn').fill('My name is An.')
  await page.getByRole('button', { name: 'Hoàn thành bài học' }).click()
  await expect(page.getByRole('heading', { name: 'Bài học này đã hoàn thành.' })).toBeFocused()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Bài học này đã hoàn thành.' })).toBeVisible()
  await page.getByRole('button', { name: 'Kết thúc phiên' }).click()
  await page.reload()
  const state = await saved(page)
  expect(state.plan!.cursor).toBe(1)
  expect(state.completions).toHaveLength(1)
  expect(state.completions[0]).toMatchObject({ independent: 3, reflection: 'My name is An.' })
  await expect(page.getByText('1/1 hoạt động đã làm', { exact: false })).toBeVisible()
})

test('fifteen-minute plan preserves a due review and next lesson across navigation', async ({
  page,
}) => {
  const now = Date.UTC(2026, 8, 6, 16, 59)
  await page.clock.install({ time: now })
  await seed(page, {
    ...emptyState(),
    reviews: { hello: { ...initialReview(now), dueAt: now } },
    completions: [
      {
        id: 'old',
        lessonId: 'hello',
        independent: 3,
        reflection: '',
        completedAt: now - 86_400_000,
      },
    ],
  })
  await startMode(page, '15')
  expect((await saved(page)).plan!.items.map((item) => item.kind)).toEqual([
    'review',
    'lesson',
    'lesson',
  ])
  await page.getByLabel('Câu trả lời của bạn').fill('is')
  await page.getByRole('button', { name: 'Tạm dừng phiên', exact: true }).click()
  await page.getByRole('link', { name: /Tiếp tục phiên đang dở/ }).click()
  await expect(page.getByLabel('Câu trả lời của bạn')).toHaveValue('is')
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await page.reload()
  await expect(page.getByText('Bạn tự nhớ được câu này!')).toBeVisible()
  await page.getByRole('button', { name: 'Sang hoạt động tiếp theo' }).click()
  await page.getByRole('button', { name: 'Bắt đầu bài này' }).click()
  await page.reload()
  const state = await saved(page)
  expect(state.reviewLog).toHaveLength(1)
  expect(state.reviews.hello.dueAt - state.reviewLog[0].reviewedAt).toBe(3 * 86_400_000)
  expect(state.plan!.cursor).toBe(1)
  expect(state.draft!.lessonId).toBe('friends')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('cancelling a new plan keeps the current one and accepting preserves lesson work', async ({
  page,
}) => {
  const initial = startLesson(emptyState(), 'hello', 'existing')
  await seed(page, initial)
  await startMode(page, '15')
  const first = (await saved(page)).plan
  await page.getByRole('button', { name: 'Tạm dừng phiên', exact: true }).click()
  page.once('dialog', (dialog) => dialog.dismiss())
  await startMode(page, '2')
  expect((await saved(page)).plan).toEqual(first)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
  expect((await saved(page)).plan!.mode).toBe('2')
  expect((await saved(page)).draft).toEqual(initial.draft)
})

test('version-one data upgrades on write and restores safely through the preferences dialog', async ({
  page,
}) => {
  const current = startLesson(emptyState(), 'hello', 'legacy-draft')
  current.draft!.pendingAnswer = 'legacy answer'
  const legacy = {
    version: 1,
    profile: { name: 'Mai', dailyMinutes: 30, exam: 'undecided', interests: [] },
    draft: current.draft,
    completions: [],
    reviews: {},
    reviewLog: [],
  }
  await seed(page, legacy)
  expect((await saved(page)).version).toBe(1) // Reading does not overwrite the source.
  await page.getByRole('button', { name: 'Chỉnh nhịp học', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Mục tiêu của bạn', exact: true })
    .selectOption('foundation')
  await page.getByRole('button', { name: 'Lưu lựa chọn' }).click()
  expect((await saved(page)).version).toBe(3)
  expect((await saved(page)).draft).toEqual(current.draft)
  await page.getByRole('button', { name: 'Chỉnh nhịp học', exact: true }).click()
  page.on('dialog', (dialog) => dialog.accept())
  await page.locator('input[type=file]').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  await expect(page.getByText('Đã khôi phục tiến độ từ bản sao.')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Mục tiêu của bạn', exact: true })).toHaveValue(
    'explore',
  )
  await expect(page.getByLabel('Ngày mục tiêu (không bắt buộc)')).toHaveValue('')
  await page.getByRole('button', { name: 'Lưu lựa chọn' }).click()
  expect((await saved(page)).draft).toEqual(current.draft)
  await page.getByRole('button', { name: 'Chỉnh nhịp học', exact: true }).click()
  await page.locator('input[type=file]').setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...legacy, version: 99 })),
  })
  await expect(page.getByText(/Không khôi phục được:/)).toBeVisible()
  expect((await saved(page)).draft).toEqual(current.draft)
})
