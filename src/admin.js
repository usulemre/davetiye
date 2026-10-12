const KEY = 'davetiye:admin'

export function getAdminKey() {
  const fromUrl = new URLSearchParams(window.location.search).get('admin')
  if (fromUrl) {
    localStorage.setItem(KEY, fromUrl)
    // Anahtarı adres çubuğundan temizle (ekran görüntüsünde görünmesin)
    const url = new URL(window.location.href)
    url.searchParams.delete('admin')
    window.history.replaceState(null, '', url)
  }
  return localStorage.getItem(KEY)
}

export async function verifyAdmin(key) {
  if (!key) return false
  try {
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'x-admin-key': key } })
    return res.ok
  } catch {
    return false
  }
}

export function forgetAdmin() {
  localStorage.removeItem(KEY)
}
