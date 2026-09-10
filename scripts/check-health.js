#!/usr/bin/env node
/**
 * scripts/check-health.js
 *
 * Kiểm tra nhanh trạng thái production endpoints.
 * Dùng local: node scripts/check-health.js
 * Dùng trong CI: node scripts/check-health.js --strict (exit 1 nếu có endpoint down)
 */

const STRICT = process.argv.includes('--strict')

const BACKEND = process.env.RENDER_API_URL ?? 'https://moi-ngay-api.onrender.com'
const FRONTEND = process.env.VITE_FRONTEND_URL ?? 'https://app-ielts-two.vercel.app'

const endpoints = [
  { name: 'Backend /healthz', url: `${BACKEND}/healthz`, expect: 200 },
  { name: 'Backend /readyz', url: `${BACKEND}/readyz`, expect: 200 },
  { name: 'Frontend /', url: `${FRONTEND}/`, expect: 200 },
]

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

let allOk = true

async function checkEndpoint({ name, url, expect }) {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'moi-ngay-health-check/1.0' },
    })
    const ms = Date.now() - start
    const ok = res.status === expect
    if (!ok) allOk = false
    const icon = ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
    const latency = ms > 3000 ? `${YELLOW}${ms}ms${RESET}` : `${ms}ms`
    console.log(`  ${icon}  ${name.padEnd(25)} ${String(res.status).padEnd(5)} ${latency}`)
    if (!ok) console.log(`     Expected ${expect}, got ${res.status}: ${url}`)
  } catch (err) {
    allOk = false
    const ms = Date.now() - start
    console.log(`  ${RED}✗${RESET}  ${name.padEnd(25)} ERROR  ${ms}ms`)
    console.log(`     ${err.message}: ${url}`)
  }
}

console.log(`\n${YELLOW}Mỗi ngày — Production Health Check${RESET}`)
console.log(`Thời gian: ${new Date().toISOString()}\n`)

await Promise.all(endpoints.map(checkEndpoint))

if (allOk) {
  console.log(`\n${GREEN}Tất cả endpoints hoạt động bình thường.${RESET}\n`)
} else {
  console.log(`\n${RED}Một hoặc nhiều endpoint có vấn đề!${RESET}\n`)
  if (STRICT) process.exitCode = 1
}
