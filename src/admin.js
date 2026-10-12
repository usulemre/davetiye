const KEY = 'davetiye:admin'

// Kayıtlı oturum token'ı (eski ?admin= linkleri artık geçersiz)
export function getAdminKey() {
  const url = new URL(window.location.href)
  if (url.searchParams.has('admin')) {
    url.searchParams.delete('admin')
    window.history.replaceState(null, '', url)
  }
  return localStorage.getItem(KEY)
}

export async function verifyAdmin(token) {
  if (!token) return false
  try {
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'x-admin-key': token } })
    if (res.status === 403) localStorage.removeItem(KEY)
    return res.ok
  } catch {
    return false
  }
}

export async function login(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Giriş yapılamadı')
  localStorage.setItem(KEY, data.token)
  return data.token
}

export async function logout(token) {
  localStorage.removeItem(KEY)
  await fetch('/api/login', { method: 'DELETE', headers: { 'x-admin-key': token } }).catch(() => {})
}

export async function changeCredentials(token, body) {
  const res = await fetch('/api/login', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Değiştirilemedi')
}

export const isLoginPath = () => window.location.pathname.replace(/\/$/, '') === '/yonetici'
