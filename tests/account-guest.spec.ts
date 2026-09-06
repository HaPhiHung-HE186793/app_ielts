import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('account configuration is optional and existing guest learning remains available', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Thiết lập nhịp học' }).click()
  await page.getByRole('link', { name: 'Tài khoản và đăng nhập' }).click()
  await expect(page.locator('main')).toBeFocused()
  await expect(
    page.getByRole('heading', { name: 'Bản này đang dùng chế độ không đăng nhập.' }),
  ).toBeVisible()
  await expect(page.getByLabel('Email của bạn')).toHaveCount(0)
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(report.violations).toEqual([])
  await page.getByRole('link', { name: 'Tiếp tục học', exact: false }).click()
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mình sẵn sàng thử' })).toBeVisible()
})
