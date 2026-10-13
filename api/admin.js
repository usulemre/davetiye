import { list } from '@vercel/blob'
import { isAdmin } from './_lib.js'

// POST: yönetici anahtarını doğrular
// GET: depolama kullanımı (Anı Duvarı fotoğraf/videoları, site dosyaları)
export default async function handler(req, res) {
  if (req.method === 'POST') return res.status((await isAdmin(req)) ? 204 : 403).end()
  if (req.method !== 'GET') return res.status(405).end()
  if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
  try {
    const out = { total: 0, count: 0, memories: 0, videos: 0, site: 0 }
    let cursor
    do {
      const page = await list({ cursor, limit: 1000 })
      for (const b of page.blobs) {
        out.total += b.size
        out.count += 1
        if (b.pathname.startsWith('anilar/')) {
          out.memories += b.size
          if (/\.(mp4|mov|webm)$/i.test(b.pathname)) out.videos += 1
        } else {
          out.site += b.size
        }
      }
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(out)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Okunamadı' })
  }
}
