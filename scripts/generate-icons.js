import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Original vector sources are in public/icons. Only these generated assets are written.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
try {
  const page = await browser.newPage()
  for (const [source, output, size] of [
    ['icon.svg', 'icon-192.png', 192],
    ['icon.svg', 'icon-512.png', 512],
    ['maskable.svg', 'maskable-512.png', 512],
    ['maskable.svg', 'apple-touch-icon.png', 180],
  ]) {
    const svg = await readFile(new URL(`../public/icons/${source}`, import.meta.url), 'utf8')
    const png = await page.evaluate(
      async ({ svg, size }) => {
        // This callback runs inside Chrome, not Node.
        // eslint-disable-next-line no-undef
        const icon = new Image()
        icon.src = `data:image/svg+xml;base64,${btoa(svg)}`
        await icon.decode()
        // eslint-disable-next-line no-undef
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        canvas.getContext('2d').drawImage(icon, 0, 0, size, size)
        return canvas.toDataURL('image/png').split(',')[1]
      },
      { svg, size },
    )
    await writeFile(
      new URL(`../public/icons/${output}`, import.meta.url),
      Buffer.from(png, 'base64'),
    )
    console.log(`${output}: ${size}x${size}`)
  }
} finally {
  await browser.close()
}
