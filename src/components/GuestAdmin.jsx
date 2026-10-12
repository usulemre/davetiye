import { useEffect, useMemo, useState } from 'react'
import { guestsApi, guestLink, parseGuestLines, statusOf } from '../guests'
import { copyText } from '../hooks'
import { formatDate } from '../date'
import Qr from './Qr'

const SIDES = [['', 'Ortak'], ['damat', 'Damat tarafı'], ['gelin', 'Gelin tarafı']]
const STATUS = { yes: 'Geliyor', no: 'Gelmiyor', wait: 'Cevap yok' }
const clock = (ts) => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
const norm = (s) => String(s || '').toLocaleLowerCase('tr')
const byTable = (a, b) => a.localeCompare(b, 'tr', { numeric: true })

// Davetli listesi bütün sekmelerde ortak: bir kez yüklenir, değişiklikler anında kaydedilir
export function useGuests(adminKey, notify) {
  const api = useMemo(() => guestsApi(adminKey), [adminKey])
  const [guests, setGuests] = useState(null)

  const load = () => api.list().then(setGuests).catch((err) => { notify(err.message); setGuests([]) })
  useEffect(() => { load() }, [api])

  const run = async (fn, message) => {
    try {
      const out = await fn()
      if (message) notify(message)
      return out
    } catch (err) {
      notify(err.message)
      return null
    }
  }

  return {
    guests,
    reload: load,
    add: (list) => run(async () => {
      const created = await api.add(list)
      setGuests((g) => [...(g || []), ...created])
      return created
    }),
    update: (patch, message) => run(async () => {
      const next = await api.update(patch)
      setGuests((g) => g.map((x) => (x.id === next.id ? next : x)))
      return next
    }, message),
    remove: (id) => run(async () => {
      await api.remove(id)
      setGuests((g) => g.filter((x) => x.id !== id))
    }, 'Silindi'),
  }
}

function summary(guests) {
  const s = { invited: guests.length, seats: 0, yes: 0, yesPeople: 0, no: 0, wait: 0, inPeople: 0, inCount: 0 }
  for (const g of guests) {
    s.seats += g.seats
    const st = statusOf(g)
    s[st] += 1
    if (st === 'yes') s.yesPeople += g.rsvp.count
    if (g.checkedIn) {
      s.inCount += 1
      s.inPeople += st === 'yes' ? g.rsvp.count : g.seats
    }
  }
  return s
}

function whatsappText(site, g, reminder) {
  const d = formatDate(site.start)
  const couple = `${site.groom.first} & ${site.bride.first}`
  if (reminder) {
    return `Merhaba ${g.name} 🤍\n\n${couple} düğününe katılıp katılamayacağınızı henüz öğrenemedik. Aşağıdaki linkten birkaç saniyede bildirebilirsiniz:\n\n${guestLink(g.id)}`
  }
  return `Merhaba ${g.name} 🤍\n\n${couple} olarak ${d.day} ${d.monthName} ${d.year} ${d.weekday} günü ${site.venue.name}'da evleniyoruz ve sizi de aramızda görmek istiyoruz 💍\n\nDavetiyeniz ve katılım bildirimi için:\n${guestLink(g.id)}`
}

const waUrl = (phone, text) => `https://wa.me/${phone || ''}?text=${encodeURIComponent(text)}`

function downloadCsv(guests) {
  const head = ['Ad Soyad', 'Telefon', 'Taraf', 'Davet (kişi)', 'Durum', 'Gelecek kişi', 'Masa', 'Not', 'Giriş', 'Kişiye özel link']
  const rows = guests.map((g) => [
    g.name, g.phone, SIDES.find(([k]) => k === g.side)?.[1] || '', g.seats, STATUS[statusOf(g)],
    g.rsvp?.count ?? '', g.table, g.rsvp?.note || '', g.checkedIn ? clock(g.checkedIn) : '', guestLink(g.id),
  ])
  const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'davetliler.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

function Stats({ s, gate }) {
  const items = gate
    ? [['Giren kişi', s.inPeople], ['Beklenen kişi', s.yesPeople], ['Giren davet', `${s.inCount}/${s.yes}`]]
    : [['Davet', s.invited], ['Gelecek kişi', s.yesPeople], ['Gelmiyor', s.no], ['Cevap yok', s.wait]]
  return (
    <div className="gstats">
      {items.map(([label, value]) => (
        <div key={label}><b>{value}</b><span>{label}</span></div>
      ))}
    </div>
  )
}

function StatusChip({ g }) {
  const st = statusOf(g)
  return (
    <span className={`gchip gchip--${st}`}>
      {st === 'yes' ? `✓ ${g.rsvp.count} kişi geliyor` : st === 'no' ? '✗ Gelmiyor' : '⏳ Cevap yok'}
    </span>
  )
}

// ---------- Davetliler ----------
export function GuestList({ store, site, notify }) {
  const { guests } = store
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const [bulk, setBulk] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!guests) return <p className="ahint">Yükleniyor…</p>
  const s = summary(guests)
  const shown = guests
    .filter((g) => filter === 'all' || statusOf(g) === filter)
    .filter((g) => !q || norm(g.name).includes(norm(q)) || g.phone.includes(q.replace(/\D/g, '') || '§'))

  return (
    <>
      <p className="ahint">Bu sekmedeki değişiklikler anında kaydedilir. Her davetlinin kişiye özel linki olur: misafir linki açınca adıyla karşılanır, tek dokunuşla katılımını bildirir.</p>
      <Stats s={s} />

      {adding || !guests.length ? (
        <AddGuest store={store} notify={notify} bulk={bulk} setBulk={setBulk} onClose={guests.length ? () => setAdding(false) : null} />
      ) : (
        <button type="button" className="abtn abtn--block gadd__open" onClick={() => setAdding(true)}>+ Davetli ekle</button>
      )}

      <div className="gtools">
        <input className="gsearch" placeholder="İsim ya da telefon ara" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="gfilters">
          {[['all', `Hepsi ${s.invited}`], ['yes', `Geliyor ${s.yes}`], ['no', `Gelmiyor ${s.no}`], ['wait', `Cevap yok ${s.wait}`]].map(([k, label]) => (
            <button key={k} type="button" className={filter === k ? 'is-active' : ''} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <p className="ahint">{guests.length ? 'Eşleşen davetli yok.' : 'Henüz davetli eklenmedi.'}</p>}
      <ul className="glist">
        {shown.map((g) => (
          <li key={g.id} className="gitem">
            <button type="button" className="gitem__main" onClick={() => setOpen(open === g.id ? null : g.id)}>
              <span className="gitem__name">{g.name}</span>
              <span className="gitem__meta">
                {g.seats} kişilik{g.table && ` · Masa ${g.table}`}{g.side && ` · ${g.side === 'damat' ? 'Damat' : 'Gelin'}`}{g.source === 'site' && ' · Siteden'}
              </span>
              <StatusChip g={g} />
              {g.rsvp?.note && <span className="gitem__note">“{g.rsvp.note}”</span>}
            </button>
            <div className="gitem__acts">
              <a className="gbtn gbtn--wa" target="_blank" rel="noreferrer"
                href={waUrl(g.phone, whatsappText(site, g, statusOf(g) === 'wait' && g.sentAt))}
                onClick={() => !g.sentAt && store.update({ id: g.id, sentAt: true })}>
                {statusOf(g) === 'wait' && g.sentAt ? 'Hatırlat' : 'WhatsApp'}
              </a>
              <button type="button" className="gbtn"
                onClick={async () => notify((await copyText(guestLink(g.id))) ? 'Kişiye özel link kopyalandı 🔗' : 'Kopyalanamadı')}>
                Link
              </button>
            </div>
            {open === g.id && <EditGuest g={g} store={store} onDone={() => setOpen(null)} />}
          </li>
        ))}
      </ul>

      {guests.length > 0 && (
        <button type="button" className="abtn abtn--ghost abtn--block" onClick={() => downloadCsv(guests)}>
          Listeyi Excel olarak indir
        </button>
      )}
    </>
  )
}

function AddGuest({ store, notify, bulk, setBulk, onClose }) {
  const blank = { name: '', phone: '', seats: 2, side: '', table: '' }
  const [g, setG] = useState(blank)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = bulk ? parseGuestLines(text) : []

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const created = await store.add(bulk ? parsed : [g])
    setBusy(false)
    if (!created) return
    notify(`${created.length} davetli eklendi ✓`)
    if (bulk) setText('')
    else setG({ ...blank, side: g.side })
    if (bulk) onClose?.()
  }

  return (
    <form className="agroup gadd" onSubmit={submit}>
      <div className="gadd__head">
        <h4>Davetli ekle</h4>
        <button type="button" className="alink" onClick={() => setBulk(!bulk)}>{bulk ? 'Tek tek ekle' : 'Toplu ekle (Excel / liste)'}</button>
        {onClose && <button type="button" className="admin__icon gadd__x" onClick={onClose} aria-label="Kapat">×</button>}
      </div>
      {bulk ? (
        <>
          <p className="ahint">Her satıra bir davetli yazın ya da Excel'den sütunları kopyalayıp yapıştırın: <b>Ad Soyad, Telefon, Kişi sayısı, Masa</b>. Sadece ad da yeterli.</p>
          <textarea className="gbulk" rows={6} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={'Ayşe Yılmaz, 0532 111 22 33, 2\nMehmet Demir, 0555 444 55 66, 4, 3\nZeynep Kaya'} />
          <button type="submit" className="abtn abtn--block" disabled={busy || !parsed.length}>
            {busy ? 'Ekleniyor…' : `${parsed.length} davetliyi ekle`}
          </button>
        </>
      ) : (
        <>
          <div className="afield-row">
            <label className="afield"><span>Ad Soyad</span><input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} required /></label>
            <label className="afield"><span>Telefon</span><input type="tel" inputMode="tel" placeholder="05xx" value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} /></label>
          </div>
          <div className="afield-row afield-row--3">
            <label className="afield"><span>Kişi</span><input type="number" min="1" max="20" value={g.seats} onChange={(e) => setG({ ...g, seats: e.target.value })} /></label>
            <label className="afield"><span>Masa</span><input value={g.table} onChange={(e) => setG({ ...g, table: e.target.value })} /></label>
            <label className="afield"><span>Taraf</span>
              <select value={g.side} onChange={(e) => setG({ ...g, side: e.target.value })}>
                {SIDES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" className="abtn abtn--block" disabled={busy || !g.name.trim()}>{busy ? 'Ekleniyor…' : '+ Ekle'}</button>
        </>
      )}
    </form>
  )
}

function EditGuest({ g, store, onDone }) {
  const [d, setD] = useState({ name: g.name, phone: g.phone, seats: g.seats, table: g.table, side: g.side })
  const save = async () => { if (await store.update({ id: g.id, ...d }, 'Kaydedildi ✓')) onDone() }
  const setRsvp = (status) => store.update({ id: g.id, rsvp: status ? { status, count: g.rsvp?.count || g.seats, note: g.rsvp?.note } : null }, 'Durum güncellendi ✓')
  return (
    <div className="gedit">
      <div className="afield-row">
        <label className="afield"><span>Ad Soyad</span><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></label>
        <label className="afield"><span>Telefon</span><input type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} /></label>
      </div>
      <div className="afield-row afield-row--3">
        <label className="afield"><span>Kişi</span><input type="number" min="1" max="20" value={d.seats} onChange={(e) => setD({ ...d, seats: e.target.value })} /></label>
        <label className="afield"><span>Masa</span><input value={d.table} onChange={(e) => setD({ ...d, table: e.target.value })} /></label>
        <label className="afield"><span>Taraf</span>
          <select value={d.side} onChange={(e) => setD({ ...d, side: e.target.value })}>
            {SIDES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className="ahint">Telefonla cevap verdiyse durumunu buradan işaretleyebilirsin:</p>
      <div className="gfilters">
        <button type="button" className={statusOf(g) === 'yes' ? 'is-active' : ''} onClick={() => setRsvp('yes')}>Geliyor</button>
        <button type="button" className={statusOf(g) === 'no' ? 'is-active' : ''} onClick={() => setRsvp('no')}>Gelmiyor</button>
        <button type="button" className={statusOf(g) === 'wait' ? 'is-active' : ''} onClick={() => setRsvp(null)}>Cevap yok</button>
      </div>
      <div className="gedit__foot">
        <button type="button" className="alink alink--danger"
          onClick={() => window.confirm(`${g.name} listeden silinsin mi?`) && store.remove(g.id)}>Davetliyi sil</button>
        <button type="button" className="abtn" onClick={save}>Kaydet</button>
      </div>
    </div>
  )
}

// ---------- Masa planı ----------
export function Tables({ store }) {
  const { guests } = store
  if (!guests) return <p className="ahint">Yükleniyor…</p>
  const active = guests.filter((g) => statusOf(g) !== 'no')
  const groups = {}
  for (const g of active) (groups[g.table || ''] ||= []).push(g)
  const names = Object.keys(groups).filter(Boolean).sort(byTable)
  const people = (list) => list.reduce((n, g) => n + (statusOf(g) === 'yes' ? g.rsvp.count : g.seats), 0)

  return (
    <>
      <p className="ahint">Misafirin masasını yazman yeterli. "Geliyorum" diyen misafir, kendi davetiyesinde masa numarasını ve giriş kartını görür. Gelmeyecekler listede yok.</p>
      {[...names, ''].filter((t) => groups[t]).map((t) => (
        <section key={t || 'none'} className={`gtable ${t ? '' : 'gtable--none'}`}>
          <header>
            <strong>{t ? `Masa ${t}` : 'Masası belli olmayanlar'}</strong>
            <span>{people(groups[t])} kişi</span>
          </header>
          <ul>
            {groups[t].map((g) => (
              <li key={g.id}>
                <span>
                  {g.name}
                  <small>{statusOf(g) === 'yes' ? `${g.rsvp.count} kişi geliyor` : `cevap yok · ${g.seats} kişilik`}</small>
                </span>
                <TableInput g={g} store={store} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!active.length && <p className="ahint">Henüz davetli yok. "Davetliler" sekmesinden ekleyebilirsin.</p>}
    </>
  )
}

function TableInput({ g, store }) {
  const [v, setV] = useState(g.table)
  useEffect(() => setV(g.table), [g.table])
  const commit = () => v.trim() !== g.table && store.update({ id: g.id, table: v.trim() }, v.trim() ? `${g.name} → Masa ${v.trim()}` : 'Masa kaldırıldı')
  return (
    <input className="gtable__in" aria-label={`${g.name} masa`} placeholder="Masa" value={v}
      onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
  )
}

// ---------- Kapı girişi ----------
export function Gate({ store }) {
  const { guests } = store
  const [q, setQ] = useState('')
  if (!guests) return <p className="ahint">Yükleniyor…</p>
  const order = { yes: 0, wait: 1, no: 2 }
  const shown = guests
    .filter((g) => !q || norm(g.name).includes(norm(q)) || norm(g.table) === norm(q))
    .sort((a, b) => order[statusOf(a)] - order[statusOf(b)] || a.name.localeCompare(b.name, 'tr'))

  return (
    <>
      <p className="ahint">Misafir telefonundaki giriş kartını gösterdiğinde QR kodu kendi telefonunun kamerasıyla okut: açılan sayfanın altında "Girişi onayla" çıkar. Ya da buradan isimle ara.</p>
      <Stats s={summary(guests)} gate />
      <input className="gsearch gsearch--big" placeholder="Misafir adı ya da masa no" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="glist">
        {shown.map((g) => (
          <li key={g.id} className={`ggate ${g.checkedIn ? 'is-in' : ''}`}>
            <span className="ggate__who">
              <b>{g.name}</b>
              <small>{statusOf(g) === 'yes' ? `${g.rsvp.count} kişi` : STATUS[statusOf(g)]}{g.table && ` · Masa ${g.table}`}</small>
            </span>
            <button type="button" onClick={() => store.update({ id: g.id, checkedIn: !g.checkedIn }, g.checkedIn ? 'Giriş geri alındı' : `${g.name} giriş yaptı ✓`)}>
              {g.checkedIn ? `✓ ${clock(g.checkedIn)}` : 'Giriş'}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

// ---------- QR kodlar ----------
export function QrCodes() {
  const origin = window.location.origin
  const codes = [
    ['Masa kartı · Anı Duvarı', 'Masalara koyun: misafirler okutup fotoğraf paylaşsın', `${origin}/#anilar`, 'ani-duvari-qr.png'],
    ['Davetiye', 'Basılı davetiyeye ya da karşılama panosuna koyabilirsiniz', `${origin}/`, 'davetiye-qr.png'],
    ['Katılım bildirimi', 'Okutan misafir doğrudan katılım formuna gelir', `${origin}/#lcv`, 'katilim-qr.png'],
  ]
  return (
    <>
      <p className="ahint">Kodları indirip yazdırabilirsin. Telefon kamerasıyla okutunca ilgili sayfa açılır.</p>
      {codes.map(([title, hint, url, file]) => (
        <section key={url} className="agroup gqr">
          <Qr text={url} size={150} />
          <div>
            <h4>{title}</h4>
            <p className="ahint">{hint}</p>
            <QrDownload url={url} file={file} />
          </div>
        </section>
      ))}
    </>
  )
}

function QrDownload({ url, file }) {
  const download = async () => {
    const { default: QRCode } = await import('qrcode')
    const a = document.createElement('a')
    a.href = await QRCode.toDataURL(url, { width: 1200, margin: 2, color: { dark: '#4b3a3a', light: '#ffffff' } })
    a.download = file
    a.click()
  }
  return <button type="button" className="abtn abtn--ghost" onClick={download}>İndir</button>
}
