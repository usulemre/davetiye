import { randomBytes } from 'node:crypto'
import { Redis } from '@upstash/redis'

let redis
export function db() {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
}

// Basit hız sınırı: `window` saniyede en fazla `max` istek
export async function rateLimit(req, action, max, window) {
  const key = `rl:${action}:${clientIp(req)}`
  const count = await db().incr(key)
  if (count === 1) await db().expire(key, window)
  return count <= max
}

// Yönetici oturumu: girişte verilen token Redis'te 30 gün saklanır
export async function isAdminToken(token) {
  if (typeof token !== 'string' || token.length < 32) return false
  return Boolean(await db().get(`session:${token}`))
}

export function isAdmin(req) {
  return isAdminToken(req.headers['x-admin-key'])
}

export function clean(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function isOurBlob(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

// Davetli listesi: Redis hash'inde id → davetli kaydı
export const GUESTS = `${process.env.DATA_PREFIX || ''}guests`
export const MAX_GUESTS = 1500

// Kişiye özel link kodu (karışan harfler olmadan)
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export function guestId() {
  return Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join('')
}

// Türkiye numaralarını WhatsApp biçimine çevir: 0532… → 90532…
export function cleanPhone(value) {
  let d = String(value ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 11 && d[0] === '0') d = `9${d}`
  if (d.length === 10 && d[0] === '5') d = `90${d}`
  return d.slice(0, 15)
}

export function cleanRsvp(input, seats) {
  if (!input || !['yes', 'no'].includes(input.status)) return null
  const count = input.status === 'yes' ? Math.min(seats, Math.max(1, Math.round(Number(input.count) || 1))) : 0
  return { status: input.status, count, note: clean(input.note, 300), at: Date.now() }
}
