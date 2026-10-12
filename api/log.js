import { rateLimit, clean } from './_lib.js'

// Misafirin telefonunda oluşan yükleme hatalarını kayda geçirir (Vercel loglarında görünür)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    if (await rateLimit(req, 'log', 20, 600)) {
      console.error('[client-error]', JSON.stringify({
        step: clean(req.body?.step, 40),
        message: clean(req.body?.message, 300),
        file: clean(req.body?.file, 120),
        ua: clean(req.headers['user-agent'], 300),
      }))
    }
  } catch {
    // kayıt başarısız olsa da misafiri etkilemesin
  }
  return res.status(204).end()
}
