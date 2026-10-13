import { db, rateLimit, isAdmin, clean, hasLink } from './_lib.js'

// İyi dilekler: misafirlerin bıraktığı kısa mesajlar
const KEY = `${process.env.DATA_PREFIX || ''}wishes`
const MAX = 500
const EMOJIS = ['🤍', '💐', '🥂', '💍', '✨', '🎉']
const parse = (w) => (typeof w === 'string' ? JSON.parse(w) : w)

export default async function handler(req, res) {
  try {
    const r = db()

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      const list = await r.lrange(KEY, 0, 199)
      return res.status(200).json({ wishes: list.map(parse) })
    }

    if (req.method === 'POST') {
      const name = clean(req.body?.name, 40)
      const text = clean(req.body?.text, 240)
      if (!name || text.length < 2) return res.status(400).json({ error: 'Lütfen adınızı ve dileğinizi yazın' })
      if (hasLink(text) || hasLink(name)) return res.status(400).json({ error: 'Dileklere bağlantı (link) eklenemiyor' })
      if (!(await rateLimit(req, 'wish', 6, 600))) return res.status(429).json({ error: 'Çok hızlı gönderiyorsunuz, biraz bekleyin 😄' })
      const emoji = EMOJIS.includes(req.body?.emoji) ? req.body.emoji : EMOJIS[0]
      const wish = { id: Math.random().toString(36).slice(2, 10), name, text, emoji, createdAt: Date.now() }
      await r.lpush(KEY, JSON.stringify(wish))
      await r.ltrim(KEY, 0, MAX - 1)
      return res.status(201).json({ wish })
    }

    if (req.method === 'DELETE') {
      if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
      const id = clean(req.query?.id, 20)
      const list = await r.lrange(KEY, 0, -1)
      const match = list.find((w) => parse(w).id === id)
      if (match) await r.lrem(KEY, 1, typeof match === 'string' ? match : JSON.stringify(match))
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
