import { db, rateLimit, clean } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const id = clean(req.body?.id, 40)
    const liked = Boolean(req.body?.liked)
    if (!id || !(await db().exists(`post:${id}`))) return res.status(404).json({ error: 'Bulunamadı' })
    if (!(await rateLimit(req, 'like', 200, 600))) return res.status(429).json({ error: 'Yavaş 😄' })
    let likes = liked ? await db().incr(`likes:${id}`) : await db().decr(`likes:${id}`)
    if (likes < 0) {
      await db().set(`likes:${id}`, 0)
      likes = 0
    }
    return res.status(200).json({ likes })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
