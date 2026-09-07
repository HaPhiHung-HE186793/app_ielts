import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createAiServer } from '../../server/ai/http'
import type { AiProvider } from '../../server/ai/provider'
import { admin, authKey, cleanupAccount, createTestAccount, local } from './helpers'
import { emptyState } from '../../src/data/schema'
import { startLesson, submitAnswer } from '../../src/domain/session'
import { studyKey } from '../../src/data/study-store'
import { lessons } from '../../src/content/lessons'

const hint: AiProvider = {
  name: 'Test fixture',
  model: 'fixture-v1',
  source: 'test-fixture',
  review: async () => ({
    feedback: {
      verdict: 'try-again',
      summary: 'Câu của bạn đã nêu được ý giới thiệu.',
      strength: null,
      improvement: { quote: 'I is', hint: 'Chủ ngữ I cần dạng nào của be?' },
      nextStep: 'Tự sửa động từ rồi đọc lại.',
    },
    inputTokens: 500,
    outputTokens: 100,
  }),
}
async function openReflection(page: Page, account: Awaited<ReturnType<typeof createTestAccount>>) {
  let state = startLesson(emptyState(), 'hello', crypto.randomUUID())
  state = { ...state, draft: { ...state.draft!, stage: 'exercise' } }
  for (let i = 0; i < 3; i++) {
    state = { ...state, draft: { ...state.draft!, index: i } }
    state = submitAnswer(state, lessons[0].exercises[i].answers[0])
  }
  state = {
    ...state,
    draft: { ...state.draft!, stage: 'reflection', reflection: 'I is a student.' },
  }
  await page.goto('/')
  await page.evaluate(
    ({ key, session, studyKey, state }) => {
      localStorage.setItem(key, JSON.stringify(session))
      localStorage.setItem(studyKey, JSON.stringify(state))
    },
    {
      key: authKey,
      session: account.session,
      studyKey: studyKey({ project: local.url, userId: account.id }),
      state,
    },
  )
  await page.goto('/#/lesson/hello')
  await page.reload()
  await expect(page.getByLabel('Ghi lại câu của bạn (không bắt buộc)')).toHaveValue(
    'I is a student.',
  )
}
async function api(page: Page, provider: AiProvider | null) {
  const budgetId = crypto.randomUUID()
  await admin.rpc('configure_ai_budget', { p_id: budgetId, p_enabled: true, p_limit: 100_000 })
  const server = createAiServer({ admin, budgetId, provider, origins: ['http://127.0.0.1:4174'] })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server failed')
  const url = `http://127.0.0.1:${address.port}`
  await page.route('**/api/ai/**', async (route) => {
    const response = await route.fetch({ url: url + new URL(route.request().url()).pathname })
    await route.fulfill({ response })
  })
  return {
    budgetId,
    cleanup: async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await admin.from('ai_budgets').delete().eq('id', budgetId)
    },
  }
}
test('unconfigured AI stays honest and does not block saving/completing a lesson', async ({
  page,
}) => {
  const a = await createTestAccount(),
    service = await api(page, null)
  try {
    await openReflection(page, a)
    await expect(page.getByText(/Gia sư AI chưa được bật hoặc chưa có ngân sách/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nhờ AI gợi ý', exact: true })).toBeDisabled()
    expect((await a.client.from('ai_requests').select('*')).data).toEqual([])
    await page.getByLabel('Ghi lại câu của bạn (không bắt buộc)').fill('My name is Linh.')
    await page.reload()
    await expect(page.getByLabel('Ghi lại câu của bạn (không bắt buộc)')).toHaveValue(
      'My name is Linh.',
    )
    await page.getByRole('button', { name: 'Hoàn thành bài học', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Bạn vừa làm được rồi.' })).toBeVisible()
  } finally {
    await service.cleanup()
    await cleanupAccount(a.id, a.email)
  }
})

test('consent is required; a lost response/reload reuses the request and changing text never silently applies old feedback', async ({
  page,
}) => {
  const a = await createTestAccount()
  let calls = 0
  const service = await api(page, {
    ...hint,
    review: async (...args) => {
      calls++
      return hint.review(...args)
    },
  })
  // Use browser-side response loss after the real request completes, without touching the API fixture.
  await page.addInitScript(() => {
    const original = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const response = await original(input, init)
      if (String(input).endsWith('/api/ai/feedback') && !localStorage.getItem('test-ai-lost')) {
        localStorage.setItem('test-ai-lost', 'yes')
        return new Response('{"error":"network"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return response
    }
  })
  try {
    await openReflection(page, a)
    await expect(page.getByRole('button', { name: 'Nhờ AI gợi ý', exact: true })).toBeDisabled()
    expect(calls).toBe(0)
    await page
      .getByLabel('Tôi đồng ý gửi câu này và ngữ cảnh bài đến OpenAI để nhận gợi ý.')
      .check()
    await expect(page.getByRole('button', { name: 'Nhờ AI gợi ý', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: 'Nhờ AI gợi ý', exact: true }).click()
    await expect(page.getByText(/Chưa kết nối được với gia sư AI/)).toBeVisible()
    expect(calls).toBe(1)
    // The last paid attempt can exhaust the budget while its lost response still needs replay.
    await admin.rpc('configure_ai_budget', {
      p_id: service.budgetId,
      p_enabled: true,
      p_limit: 360,
    })
    await page.reload()
    await page
      .getByLabel('Tôi đồng ý gửi câu này và ngữ cảnh bài đến OpenAI để nhận gợi ý.')
      .check()
    await page.getByRole('button', { name: 'Kiểm tra lại lượt gửi', exact: true }).click()
    await expect(page.getByText('PHẢN HỒI MÔ PHỎNG — CHỈ DÙNG KIỂM THỬ')).toBeVisible()
    expect(calls).toBe(1)
    expect((await a.client.from('ai_requests').select('request_id')).data).toHaveLength(1)
    expect(
      (
        await new AxeBuilder({ page })
          .include('main')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('main')?.focus()
      window.scrollTo(0, 0)
    })
    await page.screenshot({ path: `.local/ai-${test.info().project.name}.png`, fullPage: true })
    await page.getByLabel('Ghi lại câu của bạn (không bắt buộc)').fill('I am a student.')
    await expect(page.getByText('PHẢN HỒI MÔ PHỎNG — CHỈ DÙNG KIỂM THỬ')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Nhờ AI gợi ý', exact: true })).toBeVisible()
    expect(calls).toBe(1)
    await page.getByRole('button', { name: 'Hoàn thành bài học', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Bạn vừa làm được rồi.' })).toBeVisible()
  } finally {
    await service.cleanup()
    await cleanupAccount(a.id, a.email)
  }
})

test('editing or changing account while waiting cannot overwrite drafts or reveal old feedback', async ({
  page,
}) => {
  const a = await createTestAccount(),
    b = await createTestAccount()
  let release!: () => void,
    calls = 0
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  const service = await api(page, {
    ...hint,
    review: async (...args) => {
      calls++
      await waiting
      return hint.review(...args)
    },
  })
  try {
    await openReflection(page, a)
    await page
      .getByLabel('Tôi đồng ý gửi câu này và ngữ cảnh bài đến OpenAI để nhận gợi ý.')
      .check()
    await page.getByRole('button', { name: 'Nhờ AI gợi ý', exact: true }).click()
    await expect.poll(() => calls).toBe(1)
    await page.getByLabel('Ghi lại câu của bạn (không bắt buộc)').fill('I am a student now.')
    await page.goto('/#/account')
    await page.getByRole('button', { name: 'Đăng xuất trên trình duyệt này', exact: true }).click()
    await expect(page.getByLabel('Email của bạn')).toBeVisible()
    await openReflection(page, b)
    release()
    await expect(page.getByText('PHẢN HỒI MÔ PHỎNG — CHỈ DÙNG KIỂM THỬ')).toHaveCount(0)
    expect((await b.client.from('ai_requests').select('*')).data).toEqual([])
    const draft = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).draft,
      studyKey({ project: local.url, userId: a.id }),
    )
    expect(draft.reflection).toBe('I am a student now.')
  } finally {
    release()
    await service.cleanup()
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
  }
})
