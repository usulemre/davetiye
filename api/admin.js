import { isAdmin } from './_lib.js'

// Yönetici anahtarını doğrular
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  return res.status((await isAdmin(req)) ? 204 : 403).end()
}
