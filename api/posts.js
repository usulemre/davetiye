import { del } from '@vercel/blob'
import { db, rateLimit, isAdmin, clean, isOurBlob, hasLink } from './_lib.js'

// Yerel testlerde canlı veriye dokunmamak için (DATA_PREFIX=test:)
const P = process.env.DATA_PREFIX || ''

const PAGE = 60

async function listPosts() {
  const r = db()
  const ids = await r.zrange(`${P}posts`, 0, PAGE - 1, { rev: true })
  if (!ids.length) return []
  const p = r.pipeline()
  for (const id of ids) {
    p.hgetall(`${P}post:${id}`)
    p.get(`${P}likes:${id}`)
    p.lrange(`${P}comments:${id}`, 0, -1)
  }
  const out = await p.exec()
  return ids
    .map((id, i) => {
      const post = out[i * 3]
      if (!post) return null
      return {
        id,
        url: post.url,
        type: post.type === 'video' ? 'video' : 'photo',
        poster: post.poster || '',
        name: post.name,
        caption: post.caption || '',
        width: Number(post.width) || null,
        height: Number(post.height) || null,
        createdAt: Number(post.createdAt),
        likes: Math.max(0, Number(out[i * 3 + 1]) || 0),
        comments: (out[i * 3 + 2] || []).map((c) => (typeof c === 'string' ? JSON.parse(c) : c)),
      }
    })
    .filter(Boolean)
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ posts: await listPosts() })
    }

    if (req.method === 'POST') {
      const { url, name, caption, width, height, type, poster } = req.body || {}
      const author = clean(name, 40)
      if (!isOurBlob(url) || !author) return res.status(400).json({ error: 'Eksik bilgi' })
      if (hasLink(caption)) return res.status(400).json({ error: 'Nota bağlantı (link) eklenemiyor' })
      const video = type === 'video'
      if (video && poster && !isOurBlob(poster)) return res.status(400).json({ error: 'Eksik bilgi' })
      if (!(await rateLimit(req, 'post', 30, 3600))) {
        return res.status(429).json({ error: 'Çok fazla paylaşım yaptınız, biraz sonra tekrar deneyin.' })
      }
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
      const createdAt = Date.now()
      await db().hset(`${P}post:${id}`, {
        url, name: author, caption: clean(caption, 300),
        ...(video ? { type: 'video', poster: poster || '' } : {}),
        width: Number(width) || 0, height: Number(height) || 0, createdAt,
      })
      await db().zadd(`${P}posts`, { score: createdAt, member: id })
      return res.status(201).json({ id })
    }

    if (req.method === 'DELETE') {
      if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
      const id = clean(req.query.id, 40)
      const post = await db().hgetall(`${P}post:${id}`)
      if (post?.url) await del(post.url).catch(() => {})
      if (post?.poster) await del(post.poster).catch(() => {})
      await db().del(`${P}post:${id}`, `${P}likes:${id}`, `${P}comments:${id}`)
      await db().zrem(`${P}posts`, id)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
