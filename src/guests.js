// Kişiye özel davet linki (?d=kod) ve katılım bildirimi
const KEY = 'davetiye:misafir'

export function linkCode() {
  return new URL(window.location.href).searchParams.get('d')
}

// Linkteki kod öncelikli; yoksa bu cihazdan daha önce bildirim yapılmışsa o kod
export const myCode = () => linkCode() || localStorage.getItem(KEY)
export const rememberCode = (id) => localStorage.setItem(KEY, id)

export const guestLink = (id) => `${window.location.origin}/?d=${id}`

async function call(url, opts = {}, adminKey) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(adminKey ? { 'x-admin-key': adminKey } : {}) },
  })
  if (res.status === 204) return {}
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Bir şeyler ters gitti')
  return data
}

export async function fetchGuest(code) {
  if (!code) return null
  try {
    return (await call(`/api/rsvp?g=${encodeURIComponent(code)}`)).guest
  } catch {
    return null
  }
}

export const sendRsvp = (body) => call('/api/rsvp', { method: 'POST', body: JSON.stringify(body) }).then((d) => d.guest)

export const guestsApi = (adminKey) => ({
  list: () => call('/api/guests', {}, adminKey).then((d) => d.guests),
  add: (guests) => call('/api/guests', { method: 'POST', body: JSON.stringify({ guests }) }, adminKey).then((d) => d.guests),
  update: (patch) => call('/api/guests', { method: 'PUT', body: JSON.stringify(patch) }, adminKey).then((d) => d.guest),
  remove: (id) => call(`/api/guests?id=${encodeURIComponent(id)}`, { method: 'DELETE' }, adminKey),
})

// Excel'den kopyalanan ya da elle yazılan satırlar: "Ad Soyad, telefon, kişi sayısı, masa"
export function parseGuestLines(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name = '', phone = '', seats = '', table = ''] = line.split(/\t|;|,/).map((s) => s.trim())
    return { name, phone, seats: Number(seats) || 1, table }
  }).filter((g) => g.name)
}

export const statusOf = (g) => (g.rsvp?.status === 'yes' ? 'yes' : g.rsvp?.status === 'no' ? 'no' : 'wait')
