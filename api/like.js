import { db, rateLimit, clean } from './_lib.js'

// Yerel testlerde canlı veriye dokunmamak için (DATA_PREFIX=test:)
const P = process.env.DATA_PREFIX || ''

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const id = clean(req.body?.id, 40)
    const liked = Boolean(req.body?.liked)
    if (!id || !(await db().exists(`${P}post:${id}`))) return res.status(404).json({ error: 'Bulunamadı' })
    if (!(await rateLimit(req, 'like', 200, 600))) return res.status(429).json({ error: 'Yavaş 😄' })
    let likes = liked ? await db().incr(`${P}likes:${id}`) : await db().decr(`${P}likes:${id}`)
    if (likes < 0) {
      await db().set(`${P}likes:${id}`, 0)
      likes = 0
    }
    return res.status(200).json({ likes })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
