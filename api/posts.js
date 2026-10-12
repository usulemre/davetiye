import { del } from '@vercel/blob'
import { db, rateLimit, isAdmin, clean, isOurBlob } from './_lib.js'

const PAGE = 60

async function listPosts() {
  const r = db()
  const ids = await r.zrange('posts', 0, PAGE - 1, { rev: true })
  if (!ids.length) return []
  const p = r.pipeline()
  for (const id of ids) {
    p.hgetall(`post:${id}`)
    p.get(`likes:${id}`)
    p.lrange(`comments:${id}`, 0, -1)
  }
  const out = await p.exec()
  return ids
    .map((id, i) => {
      const post = out[i * 3]
      if (!post) return null
      return {
        id,
        url: post.url,
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
      const { url, name, caption, width, height } = req.body || {}
      const author = clean(name, 40)
      if (!isOurBlob(url) || !author) return res.status(400).json({ error: 'Eksik bilgi' })
      if (!(await rateLimit(req, 'post', 30, 3600))) {
        return res.status(429).json({ error: 'Çok fazla paylaşım yaptınız, biraz sonra tekrar deneyin.' })
      }
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
      const createdAt = Date.now()
      await db().hset(`post:${id}`, {
        url, name: author, caption: clean(caption, 300),
        width: Number(width) || 0, height: Number(height) || 0, createdAt,
      })
      await db().zadd('posts', { score: createdAt, member: id })
      return res.status(201).json({ id })
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Yetkisiz' })
      const id = clean(req.query.id, 40)
      const post = await db().hgetall(`post:${id}`)
      if (post?.url) await del(post.url).catch(() => {})
      await db().del(`post:${id}`, `likes:${id}`, `comments:${id}`)
      await db().zrem('posts', id)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
