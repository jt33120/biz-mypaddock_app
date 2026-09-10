import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const errors=[]
page.on('pageerror', e=>errors.push(e.message))
await page.goto(process.env.NIGHT_URL ?? 'http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' })
await page.locator('.barre').waitFor({timeout:60000})
await page.evaluate(()=>document.fonts.ready)
for(const width of [390,768,1440]) {
 await page.setViewportSize({width,height:width===1440?1000:900})
 for(const tab of ['ACCUEIL','GARAGE','ROULAGES','COMPTE']) {
   await page.locator('nav.barre').getByRole('button',{name:tab,exact:true}).click()
   await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}))
   await page.waitForTimeout(200)
   await page.screenshot({path:`artifacts/night-session/final-${tab.toLowerCase()}-${width}.png`,fullPage:true})
   console.log(width,tab,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,title:document.querySelector('.ecran')?.textContent?.slice(0,90)})))
 }
}
console.log({errors})
await browser.close()
