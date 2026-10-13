import { db, isAdmin } from './_lib.js'

// Yerel testlerde canlı veriye dokunmamak için DATA_PREFIX=test: kullanılabilir
const KEY = `${process.env.DATA_PREFIX || ''}site:config`
const MAX_SIZE = 100_000
const HEX = /^#[0-9a-f]{6}$/i

function safeUrl(value) {
  if (typeof value !== 'string' || !value) return ''
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    return new URL(value).protocol === 'https:' ? value : ''
  } catch {
    return ''
  }
}

// Yalnızca güvenli alanları ve biçimleri kabul et
function sanitize(input) {
  const out = JSON.parse(JSON.stringify(input))
  for (const k of ['heroPhoto', 'outroPhoto', 'music']) if (k in out) out[k] = safeUrl(out[k])
  if (Array.isArray(out.story)) out.story = out.story.map((s) => ({ ...s, photo: safeUrl(s.photo) }))
  if (Array.isArray(out.album)) out.album = out.album.map((a) => ({ ...a, photo: safeUrl(a.photo) })).slice(0, 120)
  if (out.customTheme) {
    for (const [k, v] of Object.entries(out.customTheme)) if (!HEX.test(v)) delete out.customTheme[k]
  }
  return out
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      const saved = await db().get(KEY)
      return res.status(200).json({ config: saved || {} })
    }

    if (req.method === 'PUT') {
      if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
      const body = req.body
      if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Geçersiz veri' })
      if (JSON.stringify(body).length > MAX_SIZE) return res.status(413).json({ error: 'Ayarlar çok büyük' })
      const clean = sanitize(body)
      await db().set(KEY, clean)
      return res.status(200).json({ config: clean })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
