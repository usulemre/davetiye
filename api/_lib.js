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
