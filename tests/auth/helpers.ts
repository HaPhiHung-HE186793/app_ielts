import { createClient } from '@supabase/supabase-js'
import { expect, type Page } from '@playwright/test'
import { localBackend } from '../../scripts/local-backend.js'

export const local = localBackend()
export const authKey = `moi-ngay.auth:${encodeURIComponent(local.url)}`
const options = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
}
export const admin = createClient(local.url, local.secretKey, options)
export const publicClient = () => createClient(local.url, local.publicKey, options)
export const testEmail = () => `moi-ngay-${crypto.randomUUID()}@example.test`

export async function createTestAccount() {
  const email = testEmail()
  const password = `Test-${crypto.randomUUID()}-9!`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error('Không tạo được tài khoản thử trên Supabase local.')
  const client = publicClient()
  const login = await client.auth.signInWithPassword({ email, password })
  if (login.error || !login.data.session) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw new Error('Không đăng nhập được tài khoản thử trên Supabase local.')
  }
  return { id: data.user.id, email, client, session: login.data.session }
}

type MailSummary = { ID: string }
async function mailbox(email: string): Promise<MailSummary[]> {
  if (!/^moi-ngay-[a-f0-9-]+@example\.test$/.test(email))
    throw new Error('Chỉ đọc hộp thư do test tạo.')
  const response = await fetch(
    `${local.mailUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
  )
  if (!response.ok) throw new Error('Chưa đọc được hộp thư local.')
  return (await response.json()).messages ?? []
}
export async function emailCode(email: string) {
  const messages = await mailbox(email)
  if (!messages[0]) return null
  const response = await fetch(`${local.mailUrl}/api/v1/message/${messages[0].ID}`)
  const message = await response.json()
  return String(message.Text).match(/\b\d{6}\b/)?.[0] ?? null
}
export async function cleanupAccount(id: string, email: string) {
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw new Error('Không xóa được tài khoản thử do test này tạo.')
  const messages = await mailbox(email)
  if (messages.length) {
    const response = await fetch(`${local.mailUrl}/api/v1/messages`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: messages.map((message) => message.ID) }),
    })
    if (!response.ok) throw new Error('Chưa xóa được email thử của tài khoản vừa dọn.')
  }
}
export async function requestCode(page: Page, email: string) {
  await page.goto('/#/account')
  await page.getByLabel('Email của bạn').fill(email)
  await page.getByRole('button', { name: 'Nhận mã đăng nhập' }).click()
  await expect(page.getByLabel('Mã đăng nhập')).toBeVisible()
  let code: string | null = null
  await expect
    .poll(async () => {
      code = await emailCode(email)
      return !!code
    })
    .toBe(true)
  return code!
}
export async function verifyCode(page: Page, code: string) {
  const verification = page.waitForResponse(
    (response) =>
      response.url().endsWith('/auth/v1/verify') && response.request().method() === 'POST',
  )
  await page.getByLabel('Mã đăng nhập').fill(code)
  await page.getByRole('button', { name: 'Xác nhận mã' }).click()
  const response = await verification
  if (!response.ok()) throw new Error('Mã OTP local chưa được xác nhận.')
  const { user } = await response.json()
  await expect(page.getByRole('heading', { name: 'Đã đăng nhập', exact: true })).toBeVisible()
  return user.id as string
}
