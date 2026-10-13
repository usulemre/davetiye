import { db, rateLimit, isAdmin, clean, hasLink } from './_lib.js'

// Yerel testlerde canlı veriye dokunmamak için (DATA_PREFIX=test:)
const P = process.env.DATA_PREFIX || ''

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const id = clean(req.body?.id, 40)
      const name = clean(req.body?.name, 40)
      const text = clean(req.body?.text, 300)
      if (!id || !name || !text) return res.status(400).json({ error: 'Eksik bilgi' })
      if (hasLink(text) || hasLink(name)) return res.status(400).json({ error: 'Yorumlara bağlantı (link) eklenemiyor' })
      if (!(await db().exists(`${P}post:${id}`))) return res.status(404).json({ error: 'Bulunamadı' })
      if (!(await rateLimit(req, 'comment', 30, 600))) {
        return res.status(429).json({ error: 'Çok hızlı yorum yapıyorsunuz, biraz bekleyin 😄' })
      }
      const comment = { id: Math.random().toString(36).slice(2, 10), name, text, createdAt: Date.now() }
      await db().rpush(`${P}comments:${id}`, JSON.stringify(comment))
      return res.status(201).json({ comment })
    }

    if (req.method === 'DELETE') {
      if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
      const postId = clean(req.query.post, 40)
      const commentId = clean(req.query.id, 20)
      const list = await db().lrange(`${P}comments:${postId}`, 0, -1)
      const match = list.find((c) => (typeof c === 'string' ? JSON.parse(c) : c).id === commentId)
      if (match) await db().lrem(`${P}comments:${postId}`, 1, typeof match === 'string' ? match : JSON.stringify(match))
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
