import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db, rateLimit, isAdmin, clean } from './_lib.js'

const SESSION_DAYS = 30
const ACCOUNT_KEY = `${process.env.DATA_PREFIX || ''}admin:account`

function hash(password, salt = randomBytes(16).toString('hex')) {
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') }
}

function same(a, b) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// Hesap Redis'te yoksa ortam değişkenlerindeki ilk kullanıcı adı/şifre kullanılır
async function checkCredentials(username, password) {
  const account = await db().get(ACCOUNT_KEY)
  if (account?.hash) {
    return same(username.toLocaleLowerCase('tr'), account.username.toLocaleLowerCase('tr')) &&
      same(hash(password, account.salt).hash, account.hash)
  }
  const envUser = process.env.ADMIN_USERNAME || ''
  const envPass = process.env.ADMIN_PASSWORD || ''
  return Boolean(envUser && envPass) &&
    same(username.toLocaleLowerCase('tr'), envUser.toLocaleLowerCase('tr')) && same(password, envPass)
}

export default async function handler(req, res) {
  try {
    // Giriş
    if (req.method === 'POST') {
      if (!(await rateLimit(req, 'login', 10, 900))) {
        return res.status(429).json({ error: 'Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.' })
      }
      const username = clean(req.body?.username, 60)
      const password = String(req.body?.password ?? '').slice(0, 200)
      if (!username || !password || !(await checkCredentials(username, password))) {
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' })
      }
      const token = randomBytes(32).toString('hex')
      await db().set(`session:${token}`, { createdAt: Date.now() }, { ex: SESSION_DAYS * 86400 })
      return res.status(200).json({ token })
    }

    // Çıkış
    if (req.method === 'DELETE') {
      const token = req.headers['x-admin-key']
      if (typeof token === 'string' && token.length >= 32) await db().del(`session:${token}`)
      return res.status(204).end()
    }

    // Kullanıcı adı / şifre değiştir
    if (req.method === 'PUT') {
      if (!(await isAdmin(req))) return res.status(403).json({ error: 'Yetkisiz' })
      const username = clean(req.body?.username, 60)
      const current = String(req.body?.currentPassword ?? '')
      const next = String(req.body?.newPassword ?? '')
      if (!username) return res.status(400).json({ error: 'Kullanıcı adı boş olamaz' })
      if (next.length < 8) return res.status(400).json({ error: 'Yeni şifre en az 8 karakter olmalı' })
      const account = await db().get(ACCOUNT_KEY)
      const currentUser = account?.username || process.env.ADMIN_USERNAME || ''
      if (!(await checkCredentials(currentUser, current))) {
        return res.status(401).json({ error: 'Mevcut şifre hatalı' })
      }
      await db().set(ACCOUNT_KEY, { username, ...hash(next) })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Bir şeyler ters gitti' })
  }
}
