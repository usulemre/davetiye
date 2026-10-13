// Güçsüz cihazlarda ya da veri tasarrufu açıkken 3D sahneler yerine hafif görünüm.
// Adrese ?hafif eklenirse her cihazda hafif mod, ?3d eklenirse her cihazda 3D açılır.
export function isLite() {
  const q = new URLSearchParams(window.location.search)
  if (q.has('3d')) return false
  if (q.has('hafif')) return true
  const n = navigator
  if (n.connection?.saveData) return true
  if (n.deviceMemory && n.deviceMemory <= 2) return true
  if (n.hardwareConcurrency && n.hardwareConcurrency <= 2) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
}
