import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { lessons } from '../src/content/lessons'
import pack from '../src/content/offline-pack.json' with { type: 'json' }

const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('moi-ngay.study.v1')!))
async function begin(page: Page, id: string) {
  await page.goto(`/#/lesson/${id}`)
  await page.getByRole('button', { name: 'Bắt đầu bài này', exact: true }).click()
  await page.getByRole('button', { name: 'Mình sẵn sàng thử', exact: true }).click()
}
async function answer(page: Page, id: string, index: number) {
  const exercise = lessons.find((lesson) => lesson.id === id)!.exercises[index]
  if (exercise.kind === 'input')
    await page.getByLabel('Câu trả lời của bạn', { exact: true }).fill(exercise.answers[0])
  else await page.getByRole('radio', { name: exercise.answers[0], exact: false }).check()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
}

test('four finite weeks are browsable with scoped filters and truthful progress', async ({
  page,
}, info) => {
  await page.goto('/#/discover')
  for (let week = 1; week <= 4; week++) {
    await page.getByRole('button', { name: `Tuần ${week} 0/8 đã học`, exact: true }).click()
    await expect(page.locator('.lesson-card')).toHaveCount(8)
    await expect(page.locator('.lesson-card').last()).toContainText(`Kiểm tra tuần ${week}`)
  }
  await page.getByRole('button', { name: 'Tuần 3 0/8 đã học', exact: true }).click()
  await page.getByRole('button', { name: 'Ăn uống', exact: true }).click()
  await expect(page.locator('.lesson-card')).toHaveCount(2)
  await expect(page.locator('.lesson-card').first()).toContainText('Mua một vài món nhỏ')
  await page.getByRole('button', { name: 'Tuần 4 0/8 đã học', exact: true }).click()
  await expect(page.locator('.lesson-card')).toHaveCount(8)
  expect(
    (
      await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `.local/curriculum-${info.project.name}.png`, fullPage: true })
})

test('new reading/listening lesson persists; transcript counts as help and never as independent recall', async ({
  page,
}) => {
  const lesson = lessons.find((item) => item.id === 'shopping')!
  await begin(page, lesson.id)
  await expect(page.getByText(lesson.exercises[0].passage!, { exact: true })).toBeVisible()
  await answer(page, lesson.id, 0)
  await page.getByLabel('Câu trả lời của bạn', { exact: true }).fill('a')
  await page.reload()
  await expect(page.getByLabel('Câu trả lời của bạn', { exact: true })).toHaveValue('a')
  await answer(page, lesson.id, 1)
  const transcript = page.getByText(lesson.exercises[2].audioText!, { exact: true })
  await expect(transcript).toHaveCount(0)
  await page.getByRole('button', { name: 'Nghe tình huống', exact: true }).click()
  await expect
    .poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThan(0)
  expect((await saved(page)).draft.responses.listening).toBeUndefined()
  await page.getByRole('button', { name: 'Xem lời thoại (tính là có gợi ý)', exact: true }).click()
  await expect(transcript).toBeVisible()
  await page.reload()
  await expect(transcript).toBeVisible()
  expect((await saved(page)).draft.responses.listening.hintUsed).toBe(true)
  await answer(page, lesson.id, 2)
  await expect(page.getByText('Tự nói thành tiếng', { exact: true })).toBeVisible()
  await page
    .getByLabel('Ghi lại câu của bạn (không bắt buộc)')
    .fill('Please buy an apple and some rice.')
  await page.getByText('Tự xem lại câu đã viết', { exact: true }).click()
  await expect(page.getByText(lesson.selfCheck![0], { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Ghi lại câu của bạn (không bắt buộc)')).toHaveValue(
    'Please buy an apple and some rice.',
  )
  await page.getByRole('button', { name: 'Hoàn thành bài học', exact: true }).click()
  await expect(page.locator('.result-stat strong')).toHaveText('2/3')
  const result = await saved(page)
  expect(result.completions[0]).toMatchObject({
    lessonId: 'shopping',
    independent: 2,
    reflection: 'Please buy an apple and some rice.',
  })
  expect(result.reviews.shopping).toBeTruthy()
})

test('all four weekly checks complete, save and replay offline with real packaged audio', async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(90_000)
  await page.goto('/#/install')
  await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
  await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.locator('.offline-panel')).toContainText(
    `${pack.resources.length}/${pack.resources.length} file`,
  )
  await page.close()
  await context.setOffline(true)
  const offline = await context.newPage()
  await offline.goto(`${baseURL}/#/discover`)
  for (let week = 1; week <= 4; week++) {
    const id = `week-${week}-check`
    await begin(offline, id)
    await answer(offline, id, 0)
    await answer(offline, id, 1)
    await offline.getByRole('button', { name: 'Nghe tình huống', exact: true }).click()
    await expect
      .poll(() => offline.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))
      .toBeGreaterThan(0)
    await answer(offline, id, 2)
    await offline
      .getByLabel('Ghi lại câu của bạn (không bắt buộc)')
      .fill('My original practice sentence.')
    await offline.getByRole('button', { name: 'Hoàn thành bài học', exact: true }).click()
    await expect(offline.locator('.result-stat strong')).toHaveText('3/3')
  }
  await offline.goto('/#/discover')
  await offline.reload()
  const result = await saved(offline)
  expect(result.completions.map((item: { lessonId: string }) => item.lessonId)).toEqual([
    'week-1-check',
    'week-2-check',
    'week-3-check',
    'week-4-check',
  ])
  for (let week = 1; week <= 4; week++)
    await expect(
      offline.getByRole('button', { name: `Tuần ${week} 1/8 đã học`, exact: true }),
    ).toBeVisible()
})
