import { chromium, expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

declare global {
  interface Window {
    installTest: { calls: number; resolve: () => void; standalone?: boolean }
  }
}

// Synthetic lifecycle tests below verify our UI, not installation by the OS.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', (event) => {
      if (event.isTrusted) event.stopImmediatePropagation()
    })
    window.installTest = { calls: 0, resolve: () => {} }
  })
})

async function offerInstall(
  page: Page,
  outcome: 'accepted' | 'dismissed' | 'error',
  pending = false,
) {
  await page.evaluate(
    ({ outcome, pending }) => {
      const event = new Event('beforeinstallprompt', { cancelable: true })
      const userChoice = new Promise((resolve) => {
        window.installTest.resolve = () => resolve({ outcome })
        if (!pending) window.installTest.resolve()
      })
      Object.assign(event, {
        userChoice,
        prompt: () => {
          window.installTest.calls += 1
          return outcome === 'error' ? Promise.reject(new Error('unavailable')) : Promise.resolve()
        },
      })
      window.dispatchEvent(event)
    },
    { outcome, pending },
  )
}

test('Chrome reads the manifest, decodes icons and validates installability metadata', async ({
  baseURL,
}, testInfo) => {
  // Default Playwright contexts are incognito, where Chrome deliberately blocks installs.
  // An empty directory argument creates an isolated, temporary profile, never the user's.
  const context = await chromium.launchPersistentContext('', {
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    baseURL,
    viewport: testInfo.project.use.viewport,
    isMobile: testInfo.project.use.isMobile,
    hasTouch: testInfo.project.use.hasTouch,
  })
  try {
    const page = await context.newPage()
    await page.goto('/#/install')
    const protocol = await context.newCDPSession(page)
    const manifest = await protocol.send('Page.getAppManifest')
    expect(manifest.errors).toEqual([])
    const data = JSON.parse(manifest.data!)
    expect(new URL(data.start_url, manifest.url).hash).toBe('#/today')
    expect(new URL(data.id, manifest.url).pathname).toBe('/')
    expect(new URL(data.scope, manifest.url).pathname).toBe('/')
    expect(data.display).toBe('standalone')
    const icons = [...data.icons, { src: '/icons/apple-touch-icon.png', sizes: '180x180' }]
    for (const icon of icons) {
      const size = await page.evaluate(async (src) => {
        const image = new Image()
        image.src = src
        await image.decode()
        return `${image.naturalWidth}x${image.naturalHeight}`
      }, new URL(icon.src, manifest.url).href)
      expect(size).toBe(icon.sizes)
    }
    const result = await protocol.send('Page.getInstallabilityErrors')
    expect(result.installabilityErrors).toEqual([])
  } finally {
    await context.close()
  }
})

test('install guide is reachable from settings, supports all platforms and keyboard navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Thiết lập nhịp học' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Thêm vào màn hình chính' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('main')).toBeFocused()
  await expect(page).toHaveTitle('Thêm vào màn hình chính · Mỗi ngày')
  await expect(page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true })).toHaveCount(0)
  await expect(page.getByText('Bạn đang dùng bản trên máy này.')).toBeVisible()
  for (const platform of ['iPhone / iPad', 'Android', 'Máy tính']) {
    const button = page.getByRole('button', { name: platform, exact: true })
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    const report = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(report.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'iPhone / iPad', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath('install.png'), fullPage: true })
  await page.getByRole('button', { name: 'Mở cài đặt và bản sao' }).click()
  await expect(page.getByRole('button', { name: 'Tải bản sao', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng cài đặt' }).click()
  await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
  await expect(page).toHaveURL(/#\/today$/)
})

test('a deferred prompt survives navigation and dismissal consumes it only once', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Bắt đầu học', exact: true })).toBeVisible()
  await offerInstall(page, 'dismissed', true)
  expect(await page.evaluate(() => window.installTest.calls)).toBe(0)
  await page.getByRole('link', { name: 'Thêm vào màn hình chính' }).click()
  await page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang chờ trình duyệt…' })).toBeDisabled()
  await page.getByRole('link', { name: 'Về Hôm nay', exact: true }).click()
  await page.getByRole('link', { name: 'Thêm vào màn hình chính' }).click()
  await expect(page.getByRole('button', { name: 'Đang chờ trình duyệt…' })).toBeDisabled()
  await page.evaluate(() => window.installTest.resolve())
  await expect(page.locator('.install-status')).toContainText('Bạn có thể cài sau')
  await expect(page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => window.installTest.calls)).toBe(1)
})

test('prompt failure falls back to instructions and acceptance does not claim standalone', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/#/install')
  await expect(page.locator('h1')).toBeVisible()
  await offerInstall(page, 'error')
  await page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true }).click()
  await expect(page.locator('.install-status')).toContainText('Chưa mở được cửa sổ cài')
  await expect(page.getByRole('group', { name: 'Thiết bị cần hướng dẫn' })).toBeVisible()
  await offerInstall(page, 'accepted')
  await page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true }).click()
  await expect(page.locator('.install-status')).toContainText('Bạn đã đồng ý cài')
  await expect(page.getByText('Bạn đang mở ở chế độ ứng dụng.')).toHaveCount(0)
  expect(await page.evaluate(() => window.installTest.calls)).toBe(2)
  expect(errors).toEqual([])
})

test('appinstalled wins over a pending choice and hides subsequent offers during this visit', async ({
  page,
}) => {
  await page.goto('/#/install')
  await expect(page.locator('h1')).toBeVisible()
  await offerInstall(page, 'accepted', true)
  await page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true }).click()
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await page.evaluate(() => window.installTest.resolve())
  await expect(page.locator('.install-status')).toContainText('Trình duyệt đã ghi nhận cài đặt')
  await offerInstall(page, 'accepted')
  await expect(page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true })).toHaveCount(0)
  await expect(page.getByText('Bạn đang mở ở chế độ ứng dụng.')).toHaveCount(0)
})

for (const source of ['display-mode', 'navigator.standalone'] as const) {
  test(`controlled ${source} signal detects application mode and removes a pending offer`, async ({
    page,
  }) => {
    await page.addInitScript((source) => {
      if (source === 'navigator.standalone') {
        Object.defineProperty(navigator, 'standalone', { get: () => window.installTest.standalone })
      } else {
        const original = window.matchMedia.bind(window)
        window.matchMedia = (query) => {
          const result = original(query)
          if (query === '(display-mode: standalone)') {
            Object.defineProperty(result, 'matches', {
              get: () => Boolean(window.installTest.standalone),
            })
          }
          return result
        }
      }
    }, source)
    await page.goto('/#/install')
    await expect(page.locator('h1')).toBeVisible()
    await offerInstall(page, 'accepted')
    await expect(page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true })).toBeVisible()
    await page.evaluate(() => {
      window.installTest.standalone = true
      window.dispatchEvent(new Event('pageshow'))
    })
    await expect(page.getByText('Bạn đang mở ở chế độ ứng dụng.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true })).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Thiết bị cần hướng dẫn' })).toHaveCount(0)
    await page.evaluate(() => {
      window.installTest.standalone = false
      window.dispatchEvent(new Event('focus'))
    })
    await expect(page.getByRole('group', { name: 'Thiết bị cần hướng dẫn' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cài Mỗi ngày', exact: true })).toHaveCount(0)
  })
}

test('opening the manifest start URL in the same browser context resumes an unfinished session', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^2 phút/ }).click()
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
  await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
  await page.getByLabel('Câu trả lời của bạn').fill('unfinished')
  await page.getByRole('button', { name: 'Mình cần gợi ý', exact: true }).click()
  const original = await page.evaluate(
    () => JSON.parse(localStorage.getItem('moi-ngay.study.v1')!).plan,
  )
  const manifestUrl = await page
    .locator('link[rel="manifest"]')
    .evaluate((link: HTMLLinkElement) => link.href)
  const response = await page.request.get(manifestUrl)
  const manifest = await response.json()
  const launchUrl = new URL(manifest.start_url, manifestUrl).href
  await page.close()
  const reopened = await context.newPage()
  await reopened.goto(launchUrl)
  await reopened.getByRole('link', { name: /Tiếp tục phiên đang dở/ }).click()
  await expect(reopened.getByLabel('Câu trả lời của bạn')).toHaveValue('unfinished')
  await expect(reopened.locator('.hint-box')).toBeVisible()
  expect(
    await reopened.evaluate(() => JSON.parse(localStorage.getItem('moi-ngay.study.v1')!).plan),
  ).toEqual(original)
})
