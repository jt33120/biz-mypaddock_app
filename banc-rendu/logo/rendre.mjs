import { chromium } from 'playwright-core'
import path from 'node:path'
const ici = path.dirname(new URL(import.meta.url).pathname)
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
await page.goto(`file://${ici}/planche.html`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: path.join(ici, 'planche.png'), fullPage: true })
await nav.close()
console.log('planche →', path.join(ici, 'planche.png'))
