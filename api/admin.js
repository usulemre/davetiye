import { isAdmin, storageUsage } from './_lib.js'

// POST: yönetici anahtarını doğrular
// GET: depolama kullanımı (Anı Duvarı fotoğraf/videoları, site dosyaları)
export default async function handler(req, res) {
  if (req.method === 'POST') return res.status((await isAdmin(req)) ? 204 : 403).end()
  if (req.method !== 'GET') return res.status(405).end()
  if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
  try {
    const out = await storageUsage(true)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(out)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Okunamadı' })
  }
}
