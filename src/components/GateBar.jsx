import { useState } from 'react'
import { guestsApi, statusOf } from '../guests'

const clock = (ts) => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

// Yönetici bir misafirin QR kodunu okutunca: kapıda girişi onaylama çubuğu
export default function GateBar({ guest, adminKey, onGuest, notify }) {
  const [busy, setBusy] = useState(false)
  const s = statusOf(guest)

  const toggle = async () => {
    setBusy(true)
    try {
      const g = await guestsApi(adminKey).update({ id: guest.id, checkedIn: !guest.checkedIn })
      onGuest({ ...guest, checkedIn: g.checkedIn })
      notify(g.checkedIn ? `${g.name} giriş yaptı ✓` : 'Giriş geri alındı')
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`gatebar ${guest.checkedIn ? 'gatebar--in' : ''}`} role="region" aria-label="Kapı girişi">
      <div>
        <span className="gatebar__label">Kapı girişi</span>
        <strong>{guest.name}</strong>
        <span>
          {s === 'yes' ? `${guest.rsvp.count} kişi geliyor` : s === 'no' ? 'Gelemem demişti' : `Cevap vermemiş · ${guest.seats} kişilik davet`}
          {guest.table && ` · Masa ${guest.table}`}
        </span>
      </div>
      <button type="button" disabled={busy} onClick={toggle}>
        {guest.checkedIn ? `✓ Girdi ${clock(guest.checkedIn)}` : 'Girişi onayla'}
      </button>
    </div>
  )
}
