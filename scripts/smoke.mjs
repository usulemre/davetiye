// Hızlı duman testi: sitenin ana akışları çalışıyor mu?
//   npm run test:smoke                       → http://localhost:3000
//   npm run test:smoke -- https://muhammed-tugce.vercel.app
// Chrome yolu farklıysa: CHROME_PATH=/yol/chrome npm run test:smoke
// Sadece okur; hiçbir veri yazmaz (canlı sitede güvenle çalıştırılabilir).
import puppeteer from 'puppeteer-core'

const URL = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = async (name, fn) => {
  try {
    await fn()
    results.push(['✓', name])
  } catch (err) {
    results.push(['✗', name, err.message.split('\n')[0]])
  }
}
const assert = (ok, msg) => { if (!ok) throw new Error(msg) }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = async (path, width = 390) => {
  const p = await browser.newPage()
  await p.setViewport({ width, height: 844, isMobile: width < 600, hasTouch: width < 600 })
  p.errors = []
  p.on('pageerror', (e) => p.errors.push(e.message))
  await p.goto(URL + path, { waitUntil: 'networkidle2', timeout: 60000 })
  return p
}

for (const api of ['/api/config', '/api/posts', '/api/wishes']) {
  await check(`${api} cevap veriyor`, async () => {
    const res = await fetch(URL + api)
    assert(res.ok, `HTTP ${res.status}`)
    await res.json()
  })
}
await check('yönetici uçları girişsiz kapalı', async () => {
  for (const [path, method] of [['/api/guests', 'GET'], ['/api/admin', 'GET'], ['/api/config', 'PUT']]) {
    const res = await fetch(URL + path, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'PUT' ? '{}' : undefined })
    assert(res.status === 403, `${method} ${path} → ${res.status}`)
  }
})

await check('zarf açılıyor, kapak ve bölümler görünüyor', async () => {
  const p = await page('/')
  await p.waitForSelector('.intro .intro__names', { timeout: 20000 })
  await p.click('.intro')
  await p.waitForFunction(() => !document.querySelector('.intro'), { timeout: 20000 })
  const names = await p.$eval('.hero__names', (e) => e.innerText)
  assert(names.trim().length > 3, 'isimler boş')
  for (const id of ['davet', 'tarih', 'konum', 'son']) assert(await p.$(`#${id}`), `#${id} bölümü yok`)
  assert(!p.errors.length, `sayfa hatası: ${p.errors[0]}`)
  await p.close()
})

await check('bağlantıyla doğrudan bölüme gidiliyor (#lcv)', async () => {
  const p = await page('/#lcv')
  await wait(1500)
  assert(!(await p.$('.intro')), 'zarf ekranı kapanmadı')
  assert(await p.$('#lcv .rsvp__form, #lcv .rsvp__done'), 'katılım formu yok')
  assert(!p.errors.length, `sayfa hatası: ${p.errors[0]}`)
  await p.close()
})

await check('hafif mod (?hafif): 3D yerine çizim alyanslar', async () => {
  const p = await page('/?hafif#davet')
  await wait(1500)
  assert(await p.$('.rings-lite'), 'hafif alyanslar yok')
  assert(!(await p.$('.rings3d')), '3D yine yüklendi')
  await p.close()
})

await check('dev ekran (?ekran) açılıyor', async () => {
  const p = await page('/?ekran', 1600)
  await p.waitForSelector('.screen__qr img', { timeout: 20000 })
  assert(!p.errors.length, `sayfa hatası: ${p.errors[0]}`)
  await p.close()
})

await check('bilgisayar genişliğinde sayfa hatası yok', async () => {
  const p = await page('/#davet', 1280)
  await wait(2500)
  assert(!p.errors.length, `sayfa hatası: ${p.errors[0]}`)
  await p.close()
})

await browser.close()
for (const [mark, name, err] of results) console.log(`${mark} ${name}${err ? `  →  ${err}` : ''}`)
const failed = results.filter(([m]) => m === '✗').length
console.log(failed ? `\n${failed} kontrol başarısız` : `\nHepsi geçti (${results.length} kontrol)`)
process.exit(failed ? 1 : 0)
