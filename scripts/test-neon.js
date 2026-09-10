// Local integration: real PostgreSQL, signed JWTs, managed Auth REST fixture, real browser.
// Requires the existing local Docker database (npm run db:start); never connects to Neon cloud.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID, randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import pg from 'pg'
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose'
import { chromium, expect } from '@playwright/test'
import { preview } from 'vite'
import { NeonDatabase } from '../server/neon/database.ts'
import { databaseStartupMessage } from '../server/neon/startup-error.ts'
import { executeData } from '../server/neon/data.ts'
import { createNeonServer } from '../server/neon/http.ts'
import { neonIdentity } from '../server/neon/identity.ts'
import { emptyState } from '../src/data/schema.ts'
import { defaultReminderSettings } from '../src/features/reminders/schema.ts'
import { createRelease } from './release/create.js'

const authUrl = 'https://ep-fixture.auth.ap-southeast-1.aws.neon.build/neondb/auth'
const origin = new URL(authUrl).origin
const id = randomBytes(6).toString('hex'),
  database = 'neon_test_' + id,
  login = 'neon_test_' + id
const password = randomBytes(24).toString('hex')
const adminPassword = execFileSync(
  'docker',
  ['exec', 'supabase_db_app_ielts', 'printenv', 'POSTGRES_PASSWORD'],
  { encoding: 'utf8' },
).trim()
const base = { host: '127.0.0.1', port: 54322, user: 'postgres', password: adminPassword }
const admin = new pg.Pool({ ...base, database: 'postgres', max: 1 })
const roles = ['moi_ngay_runtime', 'moi_ngay_api', 'moi_ngay_worker', 'moi_ngay_guest']
const existing = (
  await admin.query('SELECT rolname FROM pg_roles WHERE rolname=ANY($1)', [roles])
).rows.map((r) => r.rolname)
let setup, pool, browser, api, auth, web
let created = false,
  loginCreated = false
const listen = async (server) => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return 'http://127.0.0.1:' + server.address().port
}
const close = async (server) => {
  if (!server) return
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}
try {
  // Identifiers and password are generated hex, never derived from user input.
  await admin.query(`CREATE DATABASE ${database}`)
  created = true
  setup = new pg.Pool({ ...base, database, max: 1 })
  await assert.rejects(setup.query('SELECT version FROM moi_ngay.schema_version'), (error) =>
    databaseStartupMessage(error).includes('NEON_DB_SCHEMA_MISSING'),
  )
  await setup.query(await readFile('db/neon/001_initial.sql', 'utf8'))
  await setup.query(await readFile('db/neon/check_setup.sql', 'utf8'))
  await admin.query(`CREATE ROLE ${login} LOGIN PASSWORD '${password}'`)
  loginCreated = true
  pool = new pg.Pool({ ...base, user: login, password, database, max: 2 })
  const db = new NeonDatabase(pool)
  await assert.rejects(db.ready(), (error) =>
    databaseStartupMessage(error).includes('NEON_DB_PERMISSION_DENIED'),
  )
  await admin.query(`GRANT moi_ngay_api,moi_ngay_worker TO ${login}`)
  await setup.query('DELETE FROM moi_ngay.schema_version')
  await assert.rejects(db.ready(), (error) =>
    databaseStartupMessage(error).includes('NEON_DB_SCHEMA_VERSION'),
  )
  await setup.query('INSERT INTO moi_ngay.schema_version VALUES (1)')
  await db.ready()
  console.log(
    'PASS startup diagnostics for missing schema, role grant and schema version on real PostgreSQL',
  )
  const a = randomUUID(),
    b = randomUUID()
  const call = (owner, action, extra = {}) => executeData(db, { owner, action, ...extra })
  await call(a, 'profile.save', { name: 'Account A' })
  await call(b, 'profile.save', { name: 'Account B' })
  assert.deepEqual(await call(a, 'profile.read'), { display_name: 'Account A' })
  assert.equal(
    await db.transaction(
      'moi_ngay_api',
      b,
      async (c) =>
        (await c.query('SELECT * FROM moi_ngay.account_profiles WHERE id=$1', [a])).rowCount,
    ),
    0,
  )
  await assert.rejects(
    db.transaction('moi_ngay_api', b, (c) =>
      c.query('UPDATE moi_ngay.account_profiles SET id=$1 WHERE id=$2', [a, b]),
    ),
  )
  await assert.rejects(
    db.transaction('moi_ngay_api', a, (c) => c.query('DELETE FROM moi_ngay.study_snapshots')),
  )
  await assert.rejects(
    db.transaction('moi_ngay_api', b, (c) =>
      c.query('SELECT moi_ngay.commit_study($1,$2,0,$3)', [a, randomUUID(), emptyState()]),
    ),
  )
  assert.deepEqual(await call(b, 'profile.read'), { display_name: 'Account B' }) // Pool after rollback/owner change.
  const state = emptyState(),
    mutation = randomUUID()
  const first = await call(a, 'study.commit', { mutation, revision: 0, state })
  assert.deepEqual(first, { status: 'applied', revision: 1 })
  assert.deepEqual(await call(a, 'study.commit', { mutation, revision: 0, state }), first)
  await assert.rejects(
    call(a, 'study.commit', {
      mutation,
      revision: 0,
      state: { ...state, profile: { name: 'changed' } },
    }),
  )
  const concurrent = await Promise.all(
    [1, 2].map(() => call(a, 'study.commit', { mutation: randomUUID(), revision: 1, state })),
  )
  assert.deepEqual(concurrent.map((r) => r.status).sort(), ['applied', 'conflict'])
  assert.equal((await call(a, 'study.read')).revision, 2)
  assert.equal(await call(b, 'study.read'), null)
  const device = randomUUID()
  await call(a, 'reminders.save', {
    device,
    revision: 0,
    enabled: false,
    settings: defaultReminderSettings(),
    subscription: null,
    publicKey: null,
  })
  assert.equal((await call(a, 'reminders.read', { device })).device.enabled, false)
  assert.equal((await call(b, 'reminders.read', { device })).device, null)
  await assert.rejects(call(b, 'reminders.snooze', { device, revision: 1 }))
  const budget = randomUUID()
  await db.transaction('moi_ngay_worker', null, (c) =>
    c.query('SELECT moi_ngay.configure_ai_budget($1,true,10000)', [budget]),
  )
  const reserve = (owner) =>
    db.transaction(
      'moi_ngay_worker',
      null,
      async (c) =>
        (
          await c.query('SELECT moi_ngay.reserve_ai_request($1,$2,$3,$4) AS result', [
            budget,
            owner,
            randomUUID(),
            'a'.repeat(64),
          ])
        ).rows[0].result.status,
    )
  assert.deepEqual((await Promise.all([reserve(a), reserve(b)])).sort(), ['budget', 'reserved'])
  await assert.rejects(
    db.transaction('moi_ngay_api', a, (c) =>
      c.query('SELECT moi_ngay.configure_ai_budget($1,true,999999)', [budget]),
    ),
  )
  console.log(
    'PASS PostgreSQL migration, RLS, rollback, CAS/replay/concurrency, reminders and budget cap',
  )

  const { publicKey, privateKey } = await generateKeyPair('EdDSA')
  const verify = neonIdentity(
    authUrl,
    createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: 'fixture' }] }),
  )
  const users = new Map(),
    sessions = new Map()
  const tokenFor = (user) =>
    new SignJWT({ email: user.email, emailVerified: true })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'fixture' })
      .setSubject(user.id)
      .setIssuer(origin)
      .setAudience(origin)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(privateKey)
  // This fixture tests our REST boundary; it does not claim to test Neon's email delivery or hosted Auth.
  auth = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    const cookie = req.headers.cookie?.match(/(?:^|; )neonauth.session_token=([a-f0-9]+)/)?.[1]
    const user = sessions.get(cookie)
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
    if (req.url === '/sign-in/email-otp') {
      if (body.otp !== '123456') {
        res.writeHead(400)
        return res.end('{}')
      }
      const next = users.get(body.email) ?? { id: randomUUID(), email: body.email }
      users.set(body.email, next)
      const session = randomBytes(20).toString('hex')
      sessions.set(session, next)
      res.setHeader(
        'Set-Cookie',
        `neonauth.session_token=${session}; HttpOnly; Path=/; SameSite=None`,
      )
      return res.end(JSON.stringify({ user: next, session: {} }))
    }
    if (req.url === '/get-session')
      return res.end(JSON.stringify(user ? { user, session: {} } : null))
    if (req.url === '/token') {
      if (!user) {
        res.writeHead(401)
        return res.end('{}')
      }
      return res.end(JSON.stringify({ token: await tokenFor(user) }))
    }
    if (req.url === '/sign-out') {
      sessions.delete(cookie)
      res.setHeader('Set-Cookie', 'neonauth.session_token=; HttpOnly; Max-Age=0; Path=/')
      return res.end('{}')
    }
    if (req.url === '/email-otp/send-verification-otp') return res.end('{}')
    res.writeHead(404)
    res.end('{}')
  })
  const authFixture = await listen(auth)
  const origins = []
  api = createNeonServer({ db, authUrl: authFixture, origins, verify })
  const apiUrl = await listen(api)
  const apiCall = (token, body) =>
    fetch(apiUrl + '/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: JSON.stringify(body),
    })
  assert.equal((await apiCall(null, { action: 'profile.read', owner: a })).status, 401)
  const jwt = await tokenFor({ id: a, email: 'a@example.test' })
  assert.equal((await apiCall(jwt, { action: 'profile.read', owner: b })).status, 403)
  assert.equal((await apiCall(jwt, { action: 'profile.read', owner: a })).status, 200)
  assert.equal(
    (
      await apiCall(jwt, {
        action: 'study.commit',
        owner: a,
        mutation: randomUUID(),
        revision: 2,
        state: { bad: true },
      })
    ).status,
    400,
  )
  assert.equal(
    (
      await fetch(apiUrl + '/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
    403,
  )
  assert.equal((await fetch(apiUrl + '/api/auth/admin/list-users')).status, 404)
  const aiStatus = await fetch(apiUrl + '/api/ai/status', {
    headers: { Authorization: 'Bearer ' + jwt },
  })
  assert.equal((await aiStatus.json()).available, false)
  console.log('PASS HTTP identity/ownership/schema/CSRF/route allowlist and disabled AI')

  const release = await createRelease({ mode: 'neon', authUrl }, { aiProxy: true })
  web = await preview({
    configFile: false,
    envDir: false,
    build: { outDir: release.site },
    preview: { host: '127.0.0.1', port: 4188, strictPort: true, proxy: { '/api': apiUrl } },
  })
  const site = 'http://127.0.0.1:4188'
  origins.push(site)
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
  const ctx = await browser.newContext(),
    ctx2 = await browser.newContext()
  const page = await ctx.newPage(),
    other = await ctx2.newPage()
  page.setDefaultTimeout(15000)
  other.setDefaultTimeout(15000)
  const signIn = async (p, email) => {
    await p.goto(site + '/#/account')
    await p.getByLabel('Email của bạn').fill(email)
    await p.getByRole('button', { name: 'Nhận mã đăng nhập' }).click()
    await p.getByLabel('Mã đăng nhập').fill('123456')
    await p.getByRole('button', { name: 'Xác nhận mã' }).click()
    await expect(p.getByRole('heading', { name: 'Đã đăng nhập', exact: true })).toBeVisible()
  }
  const synced = (p) =>
    expect(p.locator('.sync-status')).toHaveText('Đã đồng bộ', { timeout: 20000 })
  const enable = async (p) => {
    await p.getByRole('button', { name: 'Bật đồng bộ phần học này' }).click()
    await synced(p)
  }
  const sync = async (p) => {
    await p.goto(site + '/#/account')
    await p.getByRole('button', { name: 'Đồng bộ ngay' }).click()
    await synced(p)
  }
  await signIn(page, 'browser-a@example.test')
  const account = users.get('browser-a@example.test')
  await page.getByLabel('Tên tài khoản', { exact: true }).fill('Neon fixture A')
  await page.getByRole('button', { name: 'Lưu tên tài khoản' }).click()
  await expect(page.getByText('Đã lưu tên vào tài khoản.', { exact: true })).toBeVisible()
  assert.equal((await call(account.id, 'profile.read')).display_name, 'Neon fixture A')
  await enable(page)
  await page.goto(site + '/#/today')
  await page.getByRole('button', { name: /^2 phút/ }).click()
  await page.getByRole('button', { name: 'Bắt đầu phiên 2 phút' }).click()
  await page.getByRole('button', { name: 'Ẩn câu và thử nhớ' }).click()
  await page.getByLabel('Câu trả lời của bạn').fill('Neon draft one')
  await sync(page)
  await signIn(other, 'browser-a@example.test')
  await enable(other)
  await other.goto(site + '/#/today')
  await other.getByRole('link', { name: /Tiếp tục phiên đang dở/ }).click()
  await expect(other.getByLabel('Câu trả lời của bạn')).toHaveValue('Neon draft one')
  await ctx2.setOffline(true)
  await other.getByLabel('Câu trả lời của bạn').fill('kept offline')
  await other.goto(site + '/#/account')
  await expect(other.locator('.sync-status')).toHaveText('Mất mạng · chờ đồng bộ')
  // Response loss after an actual committed write, then replay with the same mutation ID.
  let receipt
  await other.route('**/api/data', async (route) => {
    const body = route.request().postDataJSON()
    if (body.action !== 'study.commit') return route.continue()
    const response = await route.fetch()
    assert.equal(response.status(), 200)
    receipt = body.mutation
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"fixture lost response"}',
    })
  })
  await ctx2.setOffline(false)
  await expect(other.locator('.sync-status')).toHaveText('Chưa đồng bộ được', { timeout: 20000 })
  assert.ok(receipt)
  await other.unroute('**/api/data')
  await sync(other)
  await sync(page)
  assert.equal((await call(account.id, 'study.read')).state.plan.practice.answer, 'kept offline')
  assert.equal(
    await db.transaction(
      'moi_ngay_api',
      account.id,
      async (c) =>
        (await c.query('SELECT * FROM moi_ngay.study_commits WHERE mutation_id=$1', [receipt]))
          .rowCount,
    ),
    1,
  )
  const local = await other.evaluate(() => Object.entries(localStorage))
  assert.equal(
    local.some(
      ([, value]) => value.includes('access_token') || value.includes('eyJhbGciOiJFZERTQS'),
    ),
    false,
  )
  assert.equal(
    (await other.evaluate(() => globalThis.document.cookie)).includes('session_token'),
    false,
  )
  const cookies = await ctx2.cookies()
  assert.ok(
    cookies.some(
      (c) => c.name === 'neonauth.session_token' && c.httpOnly && c.path === '/api/auth',
    ),
  )
  await other.reload()
  await synced(other)
  await other.getByRole('button', { name: 'Đăng xuất trên trình duyệt này' }).click()
  await signIn(other, 'browser-b@example.test')
  await enable(other)
  assert.equal(await call(users.get('browser-b@example.test').id, 'study.read'), null)
  await other.goto(site + '/#/today')
  await expect(other.getByRole('link', { name: /Tiếp tục phiên đang dở/ })).toHaveCount(0)
  console.log(
    'PASS browser OTP contract/profile/two-device draft/offline/lost response/reload/account switch/HttpOnly and JWT storage',
  )
  console.log(
    'Neon local checks passed. Hosted Auth, SMTP, TLS, Vercel and Render remain unverified.',
  )
} finally {
  await browser?.close()
  await close(web?.httpServer)
  await close(api)
  await close(auth)
  await pool?.end()
  await setup?.end()
  if (created) await admin.query(`DROP DATABASE ${database} WITH (FORCE)`)
  if (loginCreated) await admin.query(`DROP ROLE ${login}`)
  for (const role of roles.filter((role) => !existing.includes(role)))
    await admin.query(`DROP ROLE IF EXISTS ${role}`)
  await admin.end()
}
