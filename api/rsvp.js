import { db, rateLimit, clean, guestId, cleanRsvp, GUESTS, MAX_GUESTS } from './_lib.js'

// Misafire yalnızca kendi davet bilgisi gösterilir
// Listeye kendini ekleyen misafir kişi sayısını sonradan 10'a kadar değiştirebilir
const limit = (g) => (g.source === 'site' ? 10 : g.seats)
const pub = (g) => ({ id: g.id, name: g.name, seats: limit(g), table: g.table, rsvp: g.rsvp, checkedIn: g.checkedIn })

export default async function handler(req, res) {
  try {
    const r = db()

    // Kişiye özel link: ?g=kod
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      if (!(await rateLimit(req, 'rsvp-get', 120, 600))) return res.status(429).json({ error: 'Çok fazla istek' })
      const g = await r.hget(GUESTS, clean(req.query?.g, 20))
      return g ? res.status(200).json({ guest: pub(g) }) : res.status(404).json({ error: 'Davet bulunamadı' })
    }

    // Katılım bildirimi
    if (req.method === 'POST') {
      if (!(await rateLimit(req, 'rsvp', 30, 3600))) return res.status(429).json({ error: 'Çok fazla deneme yapıldı, biraz sonra tekrar deneyin' })
      const id = clean(req.body?.g, 20)

      if (id) {
        const g = await r.hget(GUESTS, id)
        if (!g) return res.status(404).json({ error: 'Davet bulunamadı' })
        const rsvp = cleanRsvp(req.body, limit(g))
        if (!rsvp) return res.status(400).json({ error: 'Lütfen katılım durumunu seçin' })
        const next = { ...g, rsvp }
        if (g.source === 'site' && rsvp.count) next.seats = rsvp.count
        await r.hset(GUESTS, { [id]: next })
        return res.status(200).json({ guest: pub(next) })
      }

      // Genel linkten gelen misafir: listeye kendisi eklenir
      const name = clean(req.body?.name, 80)
      if (name.length < 3) return res.status(400).json({ error: 'Lütfen adınızı ve soyadınızı yazın' })
      if (!(await rateLimit(req, 'rsvp-new', 6, 3600))) return res.status(429).json({ error: 'Çok fazla deneme yapıldı, biraz sonra tekrar deneyin' })
      if ((await r.hlen(GUESTS)) >= MAX_GUESTS) return res.status(400).json({ error: 'Şu an bildirim alınamıyor' })
      const seats = Math.min(10, Math.max(1, Math.round(Number(req.body?.count) || 1)))
      const rsvp = cleanRsvp(req.body, seats)
      if (!rsvp) return res.status(400).json({ error: 'Lütfen katılım durumunu seçin' })
      const g = { id: guestId(), name, phone: '', seats, table: '', side: '', rsvp, checkedIn: null, source: 'site', createdAt: Date.now() }
      await r.hset(GUESTS, { [g.id]: g })
      return res.status(201).json({ guest: pub(g) })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
