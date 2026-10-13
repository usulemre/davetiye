// Davetiye çevrimdışı desteği: salonda internet zayıfsa bile daha önce açılmış davetiye
// ve giriş kartı (QR) açılabilsin. Sayfa ve ayarlar önce internetten, olmazsa kayıttan gelir.
const CACHE = 'davetiye-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon-192.png'])).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const save = (req, res, opaque = false) => {
  if (res && (res.ok || (opaque && res.type === 'opaque'))) {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
  }
  return res
}

// Önce internet, olmazsa kayıttaki kopya
const networkFirst = (req, fallback) =>
  fetch(req).then((res) => save(req, res)).catch(() => caches.match(req).then((hit) => hit || (fallback && caches.match(fallback))))

// Önce kayıt (değişmeyen dosyalar), yoksa internet
const cacheFirst = (req, opaque = false) => caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res, opaque)))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (req.mode === 'navigate') return e.respondWith(networkFirst(req, '/'))

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/assets/')) return e.respondWith(cacheFirst(req))
    if (url.pathname === '/api/config' || url.pathname === '/api/rsvp') return e.respondWith(networkFirst(req))
    if (/\.(jpg|png|svg|webmanifest)$/.test(url.pathname)) return e.respondWith(cacheFirst(req))
    return
  }

  // Yazı tipleri ve sitenin kendi fotoğrafları (kapak, hikâye); misafir yüklemeleri kaydedilmez
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) return e.respondWith(cacheFirst(req, true))
  // (cors isteklerine kayıttaki "opak" kopya verilemez; onlar doğrudan internetten gelir)
  if (url.hostname.endsWith('.public.blob.vercel-storage.com') && url.pathname.startsWith('/site/') && req.mode === 'no-cors') return e.respondWith(cacheFirst(req, true))
})
