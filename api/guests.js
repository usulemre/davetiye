import { db, isAdmin, clean, guestId, cleanPhone, cleanRsvp, GUESTS, MAX_GUESTS } from './_lib.js'

const SIDES = ['damat', 'gelin', '']

function shape(input, prev = {}) {
  const pick = (k) => (input[k] !== undefined ? input[k] : prev[k])
  return {
    ...prev,
    name: clean(pick('name'), 80),
    phone: cleanPhone(pick('phone')),
    seats: Math.min(20, Math.max(1, Math.round(Number(pick('seats')) || 1))),
    table: clean(pick('table'), 20),
    side: SIDES.includes(pick('side')) ? pick('side') : '',
    lang: pick('lang') === 'en' ? 'en' : 'tr',
  }
}

// Yönetici: davetli listesi, ekleme, düzenleme, kapı girişi, silme
export default async function handler(req, res) {
  try {
    if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
    const r = db()

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      const all = (await r.hgetall(GUESTS)) || {}
      const guests = Object.values(all).sort((a, b) => a.createdAt - b.createdAt)
      return res.status(200).json({ guests })
    }

    if (req.method === 'POST') {
      const list = Array.isArray(req.body?.guests) ? req.body.guests.slice(0, 300) : []
      const total = await r.hlen(GUESTS)
      if (total + list.length > MAX_GUESTS) return res.status(400).json({ error: 'Davetli sınırı aşıldı' })
      const now = Date.now()
      const created = list
        .map((g, i) => ({ ...shape(g), id: guestId(), rsvp: null, checkedIn: null, source: 'liste', createdAt: now + i }))
        .filter((g) => g.name)
      if (!created.length) return res.status(400).json({ error: 'İsim girilmedi' })
      await r.hset(GUESTS, Object.fromEntries(created.map((g) => [g.id, g])))
      return res.status(201).json({ guests: created })
    }

    if (req.method === 'PUT') {
      const id = clean(req.body?.id, 20)
      const prev = id && (await r.hget(GUESTS, id))
      if (!prev) return res.status(404).json({ error: 'Davetli bulunamadı' })
      const next = shape(req.body, prev)
      if (!next.name) return res.status(400).json({ error: 'İsim boş olamaz' })
      if ('rsvp' in req.body) next.rsvp = cleanRsvp(req.body.rsvp, next.seats)
      if ('sentAt' in req.body) next.sentAt = req.body.sentAt ? Date.now() : null
      if ('checkedIn' in req.body) next.checkedIn = req.body.checkedIn ? Date.now() : null
      await r.hset(GUESTS, { [id]: next })
      return res.status(200).json({ guest: next })
    }

    if (req.method === 'DELETE') {
      const id = clean(req.query?.id, 20)
      await r.hdel(GUESTS, id)
      return res.status(204).end()
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
